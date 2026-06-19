'use strict';

const cron        = require('node-cron');
const User        = require('../models/User');
const Subject     = require('../models/Subject');
const Attendance  = require('../models/Attendance');
const AiPrediction = require('../models/AiPrediction');
const sendEmail   = require('./sendEmail');
const { lowAttendanceTemplate, aiRiskAlertTemplate } = require('./emailTemplates');
const { callGemini } = require('./geminiClient');

const ATTENDANCE_THRESHOLD   = 75;   
const MIN_SESSIONS_FOR_ALERT = 3;    
const MIN_SESSIONS_FOR_AI    = 5;  
const CACHE_TTL_MS = 23 * 60 * 60 * 1000; 

const parseGeminiJson = (raw) => {
  const cleaned = raw
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
  return JSON.parse(cleaned); 
};

const runThresholdCheck = async () => {
  console.log('[Cron] Running threshold check...');
  let emailsSent = 0;

  const subjects = await Subject.find({}).populate('students', 'name email');

  for (const subject of subjects) {
    for (const student of subject.students) {
      const records = await Attendance.find({
        student: student._id,
        subject: subject._id
      });

      if (records.length < MIN_SESSIONS_FOR_ALERT) continue;

      const attended = records.filter(
        r => r.status === 'present' || r.status === 'late'
      ).length;
      const percentage = Math.round((attended / records.length) * 100);

      if (percentage < ATTENDANCE_THRESHOLD) {
        const result = await sendEmail({
          to:      student.email,
          subject: `Attendance Alert — ${subject.name}`,
          html:    lowAttendanceTemplate({ name: student.name, subjectName: subject.name, percentage })
        });
        if (result.success) emailsSent++;
      }
    }
  }

  console.log(`[Cron] Threshold check complete — ${emailsSent} emails sent`);
  return emailsSent;
};

const runAiPredictionAlerts = async () => {
  console.log('[Cron] Running AI risk predictions...');
  let alertsSent     = 0;
  let quotaExhausted = false;
  let cached         = 0;
  let fresh          = 0;

  const students = await User.find({ role: 'student' });

  for (const student of students) {
    if (quotaExhausted) {
      console.log(`[Cron] Skipping ${student.name} — daily Gemini quota exhausted`);
      continue;
    }

    try {
      const subjects = await Subject.find({ students: student._id });
      if (subjects.length === 0) continue;

      const attendanceBySubject = await Promise.all(
        subjects.map(async (subject) => {
          const records = await Attendance.find({
            student: student._id,
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
      if (totalSessions < MIN_SESSIONS_FOR_AI) continue;

      let prediction;
      const existing = await AiPrediction.findOne({ student: student._id });
      const ageMs    = existing?.generatedAt
        ? Date.now() - new Date(existing.generatedAt).getTime()
        : Infinity;

      if (ageMs < CACHE_TTL_MS) {
        prediction = existing.prediction;
        cached++;
        console.log(
          `[Cron] ${student.name}: using cached prediction ` +
          `(${Math.round(ageMs / 3_600_000)}h old) — risk: ${prediction.overallRisk}`
        );
      } else {
        const today = new Date().toISOString().split('T')[0];
        let prompt  = `You are SmartPresence AI. Analyze this student's attendance trend.\n\nStudent: ${student.name}\nDate: ${today}\n\n`;

        attendanceBySubject.forEach(({ subject, records, totalSessions: ts, attended, percentage: pct }) => {
          prompt += `Subject: ${subject.name} (${subject.code}) — ${pct}% (${attended}/${ts})\n`;
          records.slice(0, 10).forEach(r => {
            prompt += `  ${new Date(r.date).toISOString().split('T')[0]}: ${r.status.toUpperCase()}\n`;
          });
        });

        prompt += `\nReturn JSON exactly: { "overallRisk": "safe|low|medium|high|critical", "overallSummary": "2 sentences", "immediateAction": "one actionable sentence" }`;

        const rawResponse = await callGemini(prompt);

        try {
          prediction = parseGeminiJson(rawResponse);
        } catch (parseErr) {
          console.error(`[Cron] JSON parse failed for ${student.name}:`, parseErr.message);
          console.error('   Raw response was:', rawResponse?.slice(0, 200));
          continue;
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await AiPrediction.findOneAndUpdate(
          { student: student._id },
          { student: student._id, prediction, generatedAt: new Date(), expiresAt },
          { upsert: true, returnDocument: 'after' }
        );

        fresh++;
        console.log(`[Cron] ${student.name}: new prediction — risk: ${prediction.overallRisk}`);
      }

      if (['high', 'critical'].includes(prediction.overallRisk)) {
        const level  = prediction.overallRisk === 'critical' ? 'Critical' : 'High';
        const result = await sendEmail({
          to:      student.email,
          subject: `AI Alert: ${level} Attendance Risk`,
          html:    aiRiskAlertTemplate({
            name:           student.name,
            overallRisk:    prediction.overallRisk,
            overallSummary: prediction.overallSummary,
            immediateAction: prediction.immediateAction
          })
        });
        if (result.success) alertsSent++;
      }

    } catch (error) {
      if (error.kind === 'QUOTA_DAILY' || error.message === 'GEMINI_DAILY_QUOTA_EXHAUSTED') {
        console.error(
          '[Cron] Daily Gemini quota exhausted — remaining students will use ' +
          'cached predictions if available, or be retried tomorrow.'
        );
        quotaExhausted = true;
        continue; 
      }

      console.error(`[Cron] AI prediction failed for ${student.name}:`, error.message);
    }
  }

  console.log(
    `[Cron] AI predictions complete — ${alertsSent} alert emails sent ` +
    `(${fresh} fresh API calls, ${cached} served from cache)`
  );
  return alertsSent;
};

const runDailyAttendanceCheck = async () => {
  console.log(`\n[Cron] Daily check started at ${new Date().toLocaleString()}`);
  try {
    await runThresholdCheck();
    await runAiPredictionAlerts();
  } catch (error) {
    console.error('[Cron] Daily check failed:', error.message);
  }
  console.log(`[Cron] Daily check finished\n`);
};

const startCronJobs = () => {
  cron.schedule('0 8 * * *', () => {
    runDailyAttendanceCheck();
  });

  console.log('Cron job scheduled: daily attendance check at 8:00 AM');
};

module.exports = {
  startCronJobs,
  runDailyAttendanceCheck,
  runThresholdCheck,
  runAiPredictionAlerts
};