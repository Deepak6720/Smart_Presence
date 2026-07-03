const AiAnomaly = require('../models/AiAnomaly');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');
const AiPrediction = require('../models/AiPrediction');
const { callGemini } = require('../utils/geminiClient');
const { runDailyAttendanceCheck } = require('../utils/cronJobs');

const buildStudentRiskPrompt = (student, attendanceBySubject, today) => {
  let prompt = `You are SmartPresence AI, an attendance analytics system for a college.
Your task: analyze this student's attendance TREND and predict if they will breach the 75% attendance threshold.

Student: ${student.name}
Analysis Date: ${today}
Academic Policy: Students must maintain >= 75% attendance or face consequences.

ATTENDANCE DATA:
`;
  attendanceBySubject.forEach(subjectData => {
    const { subject, records, totalSessions, attended, percentage } = subjectData;
    prompt += `
Subject: ${subject.name} (Code: ${subject.code})
Current: ${percentage}% attendance (${attended} attended out of ${totalSessions} total sessions)
Session-by-session history (newest first):
`;
    records.slice(0, 30).forEach(record => {
      const dateStr = new Date(record.date).toISOString().split('T')[0];
      prompt += `  ${dateStr}: ${record.status.toUpperCase()}\n`;
    });
  });
  prompt += `
INSTRUCTIONS:
1. Analyze the trend for each subject (are absences clustered? increasing? random?)
2. Calculate: if the current absence pattern continues, what % will the student have in 14 days?
3. Calculate the maximum additional absences the student can afford before breaching 75%
4. Identify patterns: same-day absences every week, consecutive absences, sudden drops, etc.

Return a JSON object with EXACTLY this structure (no extra fields, no markdown):
{
  "overallRisk": "safe | low | medium | high | critical",
  "overallSummary": "2-3 sentence overall assessment of this student's attendance situation",
  "immediateAction": "The single most important thing this student should do right now",
  "subjectPredictions": [
    {
      "subjectCode": "CS3001",
      "subjectName": "Operating System",
      "currentPercentage": 74,
      "predictedPercentage14Days": 68,
      "riskLevel": "safe | low | medium | high | critical",
      "trend": "improving | stable | declining | rapidly_declining",
      "maxAbsencesAllowed": 2,
      "estimatedDaysToBreach": 8,
      "patternObserved": "Absent every Friday for 3 consecutive weeks",
      "reasoning": "Concise explanation of what the data shows and why this risk level was assigned",
      "recommendation": "Specific, actionable advice for this subject"
    }
  ]
}

Risk level definitions (be precise):
- safe: >= 85% AND trend is stable or improving
- low: 75-84% AND trend is stable
- medium: 75-84% AND trend is declining, OR 70-74% AND trend is stable
- high: < 75% OR will breach 75% within 14 days based on trend
- critical: < 65% OR will breach 75% within 7 days

Overall risk = the WORST subject risk level among all subjects.`;

  return prompt;
};

const getMyRiskPrediction = async (req, res) => {
  try {
    const studentId = req.user.id;
    const forceRefresh = req.query.refresh === 'true';
    if (!forceRefresh) {
      const cached = await AiPrediction.findOne({ student: studentId });

      if (cached) {
        return res.status(200).json({
          prediction: cached.prediction,
          generatedAt: cached.generatedAt,
          fromCache: true
        });
      }
    }

    const student = await User.findById(studentId).select('name email');

    const subjects = await Subject.find({ students: studentId });

    if (subjects.length === 0) {
      return res.status(200).json({
        prediction: null,
        message: 'no_subjects',
        displayMessage: 'You are not enrolled in any subjects yet. Ask your admin to enroll you.'
      });
    }

    const attendanceBySubject = await Promise.all(
      subjects.map(async (subject) => {
        const records = await Attendance.find({
          student: studentId,
          subject: subject._id
        }).sort({ date: -1 });

        const totalSessions = records.length;
        const attended = records.filter(
          r => r.status === 'present' || r.status === 'late'
        ).length;
        const percentage = totalSessions > 0
          ? Math.round((attended / totalSessions) * 100)
          : 0;

        return { subject, records, totalSessions, attended, percentage };
      })
    );

    const totalSessions = attendanceBySubject.reduce(
      (sum, s) => sum + s.totalSessions, 0
    );

    if (totalSessions<5) {
      return res.status(200).json({
        prediction: null,
        message: 'insufficient_data',
        displayMessage: `Need at least 5 attendance sessions for AI analysis. Currently have ${totalSessions}. Check back after more classes.`
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const prompt = buildStudentRiskPrompt(student, attendanceBySubject, today);

    let rawResponse;
    try {
      rawResponse = await callGemini(prompt);
      
    } catch (geminiError) {
      console.error('Gemini API call failed:', geminiError.message);
      return res.status(503).json({
        message: 'AI service temporarily unavailable. Please try again in a few minutes.',
        error: geminiError.message
      });
    }

    let prediction;
    try {
      const cleaned = rawResponse
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

      prediction = JSON.parse(cleaned);

    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError.message);
      console.error('Raw Gemini output:', rawResponse);
      return res.status(500).json({
        message: 'AI returned an unexpected format. Please try again.',
        rawResponse: process.env.NODE_ENV === 'development' ? rawResponse : undefined
      });
    }
    if (!prediction.overallRisk || !prediction.subjectPredictions) {
      return res.status(500).json({
        message: 'AI prediction is missing required fields. Please try again.'
      });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await AiPrediction.findOneAndUpdate(
      { student: studentId },
      {
        student: studentId,
        prediction,
        generatedAt: new Date(),
        expiresAt
      },
      { upsert: true, returnDocument: "after" }
    );

    res.status(200).json({
      prediction,
      generatedAt: new Date(),
      fromCache: false
    });

  } catch (error) {
    console.error('getMyRiskPrediction error:', error);
    res.status(500).json({
      message: 'Server error during AI prediction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getPlatformRiskOverview = async (req, res) => {
  try {
    const subjects = await Subject.find({}).populate('students', 'name email avatar');

    const atRiskList = [];
    const seen = new Set();

    for (const subject of subjects) {
      for (const student of subject.students) {
        const key = `${student._id}-${subject._id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const records = await Attendance.find({
          student: student._id,
          subject: subject._id
        });

        if (records.length < 3) continue;

        const attended = records.filter(
          r => r.status === 'present' || r.status === 'late'
        ).length;
        const percentage = Math.round((attended / records.length) * 100);

        if (percentage < 75) {
          const cachedPrediction = await AiPrediction.findOne({
            student: student._id
          });

          atRiskList.push({
            student: {
              _id: student._id,
              name: student.name,
              email: student.email,
              avatar: student.avatar
            },
            subject: {
              _id: subject._id,
              name: subject.name,
              code: subject.code
            },
            currentPercentage: percentage,
            totalSessions: records.length,
            hasPrediction: !!cachedPrediction,
            predictionAge: cachedPrediction?.generatedAt || null,
            overallRisk: cachedPrediction?.prediction?.overallRisk || null,
            aiSummary: cachedPrediction?.prediction?.overallSummary || null
          });
        }
      }
    }

    atRiskList.sort((a, b) => a.currentPercentage - b.currentPercentage);

    res.status(200).json({
      atRiskStudents: atRiskList,
      total: atRiskList.length
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const buildAnomalyPrompt = (subject, students, weeklyMatrix, holidays, today) => {
  let prompt = `You are SmartPresence AI, an attendance fraud and anomaly detection system.
Analyze the attendance data below for suspicious patterns, proxy attendance, 
systematic absences, and other anomalies.

Subject: ${subject.name} (${subject.code})
Analysis Date: ${today}
Total Students: ${students.length}
Known Holidays: ${holidays.length > 0 ? holidays.map(h => `${h.name} (${new Date(h.date).toISOString().split('T')[0]})`).join(', ') : 'None in this period'}

WEEKLY ATTENDANCE MATRIX (P=Present, A=Absent, L=Late, -=No class):
`;

  const allDates = [...new Set(
    weeklyMatrix.flatMap(s => s.records.map(r => new Date(r.date).toISOString().split('T')[0]))
  )].sort();

  prompt += `Student Name        | ${allDates.join(' | ')}\n`;
  prompt += `${'─'.repeat(20)}|${'─'.repeat(allDates.length * 9)}\n`;

  weeklyMatrix.forEach(studentData => {
    const name = studentData.student.name.padEnd(20);
    const row = allDates.map(date => {
      const record = studentData.records.find(
        r => new Date(r.date).toISOString().split('T')[0] === date
      );
      if (!record) return '  -  ';
      return record.status === 'present' ? '  P  '
           : record.status === 'late'    ? '  L  '
           : '  A  ';
    }).join(' | ');
    prompt += `${name}| ${row}\n`;
  });

  prompt += `\nCURRENT STATS:\n`;
  weeklyMatrix.forEach(({ student, totalSessions, attended, percentage }) => {
    prompt += `${student.name}: ${percentage}% (${attended}/${totalSessions})\n`;
  });

  prompt += `
PATTERNS TO DETECT (check ALL of these):
1. PROXY SUSPICION: Student with very low attendance (< 40%) suddenly showing 
   90-100% for 2+ consecutive sessions with no gradual recovery
2. SYSTEMATIC ABSENCE: Student absent the same day every week for 3+ weeks
3. MASS ABSENCE: Entire class (> 80%) absent on a non-holiday date
4. SELECTIVE ATTENDANCE: Student present in first/last session of every week only
5. SUDDEN DROP: Student with > 80% suddenly dropping to < 50% in one week
6. IMPOSSIBLE PATTERN: Present on days marked as class cancelled or holidays

Return a JSON object with EXACTLY this structure:
{
  "summary": "2-3 sentence overall assessment of this class's attendance patterns",
  "totalAnomaliesFound": 2,
  "anomalies": [
    {
      "type": "proxy_suspicion | systematic_absence | mass_absence | sudden_drop | selective_attendance | other",
      "severity": "low | medium | high | critical",
      "studentsInvolved": ["Student Name 1", "Student Name 2"],
      "dates": ["2026-06-05", "2026-06-06"],
      "description": "Specific factual description of what was observed in the data",
      "evidence": "Exact data points that support this flag (e.g., 'Absent Jun 1-5, Present Jun 6-10')",
      "recommendation": "Specific action admin or teacher should take to investigate"
    }
  ]
}

If no anomalies are detected, return:
{
  "summary": "No suspicious patterns detected. Attendance appears normal.",
  "totalAnomaliesFound": 0,
  "anomalies": []
}

IMPORTANT: Only flag genuine statistical anomalies. Do not flag students who are 
simply low-attending consistently — that is handled by the risk predictor.
Focus on PATTERN CHANGES and SUSPICIOUS BEHAVIORS.`;

  return prompt;
};

const runAnomalyDetection = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh) {
      const cached = await AiAnomaly.findOne({ subject: subjectId });
      if (cached) {
        return res.status(200).json({
          anomalies: cached.anomalies,
          summary: cached.summary,
          totalAnomaliesFound: cached.totalAnomaliesFound,
          generatedAt: cached.generatedAt,
          fromCache: true
        });
      }
    }

    const subject = await Subject.findById(subjectId)
      .populate('students', 'name email')
      .populate('teacher', 'name');

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (req.user.role === 'teacher' &&
        subject.teacher?._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not your subject' });
    }

    if (subject.students.length === 0) {
      return res.status(200).json({
        anomalies: [],
        summary: 'No students enrolled in this subject.',
        totalAnomaliesFound: 0,
        fromCache: false
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const weeklyMatrix = await Promise.all(
      subject.students.map(async (student) => {
        const records = await Attendance.find({
          student: student._id,
          subject: subjectId,
          date: { $gte: thirtyDaysAgo }
        }).sort({ date: 1 });

        const totalSessions = records.length;
        const attended = records.filter(
          r => r.status === 'present' || r.status === 'late'
        ).length;
        const percentage = totalSessions > 0
          ? Math.round((attended / totalSessions) * 100) : 0;

        return { student, records, totalSessions, attended, percentage };
      })
    );

    const totalRecords = weeklyMatrix.reduce(
      (sum, s) => sum + s.totalSessions, 0
    );

    if (totalRecords < 3) {
      return res.status(200).json({
        anomalies: [],
        summary: 'Not enough attendance data for anomaly detection. Need at least 3 sessions.',
        totalAnomaliesFound: 0,
        fromCache: false,
        message: 'insufficient_data'
      });
    }

    const holidays = await require('../models/Holiday').find({
      date: { $gte: thirtyDaysAgo }
    });

    const today = new Date().toISOString().split('T')[0];
    const prompt = buildAnomalyPrompt(
      subject, subject.students, weeklyMatrix, holidays, today
    );

    let rawResponse;
    try {
      rawResponse = await callGemini(prompt);
    } catch (geminiError) {
      console.error('Gemini anomaly call failed:', geminiError.message);
      return res.status(503).json({
        message: 'AI service temporarily unavailable. Please try again.'
      });
    }

    let result;
    try {
      const cleaned = rawResponse
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();
      result = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Anomaly parse error:', parseError.message);
      console.error('Raw:', rawResponse);
      return res.status(500).json({
        message: 'AI returned unexpected format. Please try again.'
      });
    }

    if (!Array.isArray(result.anomalies)) {
      result.anomalies = [];
      result.totalAnomaliesFound = 0;
    }

    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    await AiAnomaly.findOneAndUpdate(
      { subject: subjectId },
      {
        subject: subjectId,
        anomalies: result.anomalies,
        summary: result.summary || '',
        totalAnomaliesFound: result.totalAnomaliesFound || result.anomalies.length,
        generatedAt: new Date(),
        expiresAt
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );

    res.status(200).json({
      anomalies: result.anomalies,
      summary: result.summary,
      totalAnomaliesFound: result.totalAnomaliesFound || result.anomalies.length,
      generatedAt: new Date(),
      fromCache: false
    });

  } catch (error) {
    console.error('runAnomalyDetection error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllAnomalies = async (req, res) => {
  try {
    const allAnomalies = await AiAnomaly.find({})
      .populate('subject', 'name code')
      .sort({ generatedAt: -1 });

    const withAnomalies = allAnomalies.filter(
      doc => doc.totalAnomaliesFound > 0
    );

    res.status(200).json({
      subjects: allAnomalies.map(doc => ({
        subject: doc.subject,
        totalAnomaliesFound: doc.totalAnomaliesFound,
        summary: doc.summary,
        anomalies: doc.anomalies,
        generatedAt: doc.generatedAt
      })),
      totalSubjectsScanned: allAnomalies.length,
      totalAnomaliesAcrossPlatform: allAnomalies.reduce(
        (sum, doc) => sum + doc.totalAnomaliesFound, 0
      )
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const triggerDailyCheck = async (req, res) => {
  try {
    res.status(202).json({
      message: 'Daily check started in the background. Check server logs for progress.'
    });
    runDailyAttendanceCheck();

  } catch (error) {
    res.status(500).json({ message: 'Failed to trigger check', error: error.message });
  }
};


module.exports = {
  getMyRiskPrediction, getPlatformRiskOverview, runAnomalyDetection, getAllAnomalies  ,triggerDailyCheck     
};