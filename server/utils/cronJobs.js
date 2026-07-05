const cron = require('node-cron');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const AiPrediction = require('../models/AiPrediction');
const sendEmail = require('./sendEmail');
const { lowAttendanceTemplate, aiRiskAlertTemplate } = require('./emailTemplates');
const { callGemini } = require('./geminiClient');


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const DELAY_BETWEEN_GEMINI_CALLS_MS = 6000;

const MAX_NEW_AI_CALLS_PER_RUN = 6;

const runThresholdCheck = async () => {
  console.log('[Cron] Running threshold check...');
  let emailsSent = 0;

  const subjects = await Subject.find({}).populate('students', 'name email');

  for (const subject of subjects) {
    for (const student of subject.students) {
      try {
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
          const result = await sendEmail({
            to: student.email,
            subject: `Attendance Alert — ${subject.name}`,
            html: lowAttendanceTemplate({
              name: student.name,
              subjectName: subject.name,
              percentage
            })
          });
          if (result.success) emailsSent++;
        }
      } catch (err) {
        console.error(`Threshold check failed for ${student.name}:`, err.message);
      }
    }
  }

  console.log(`[Cron] Threshold check done — ${emailsSent} alert email(s) sent`);
  return emailsSent;
};



const buildCronPrompt = (student, attendanceData, today) => {
  let prompt = `You are SmartPresence AI. Analyze this student's attendance.
Student: ${student.name}
Date: ${today}
Policy: >= 75% attendance required.

ATTENDANCE DATA:
`;

  attendanceData.forEach(({ subject, records, totalSessions, attended, percentage }) => {
    prompt += `${subject.name} (${subject.code}): ${percentage}% (${attended}/${totalSessions})\n`;
    records.slice(0, 10).forEach(r => {
      prompt += `  ${new Date(r.date).toISOString().split('T')[0]}: ${r.status.toUpperCase()}\n`;
    });
  });

  prompt += `
Return ONLY valid JSON (no markdown):
{
  "overallRisk": "safe|low|medium|high|critical",
  "overallSummary": "2-sentence summary",
  "immediateAction": "single most important action"
}

Risk definitions:
- safe: >= 85% AND stable/improving
- low: 75-84% AND stable  
- medium: 75-84% declining OR 70-74% stable
- high: < 75% OR will breach in ~14 days
- critical: < 65% OR will breach in ~7 days`;

  return prompt;
};

const runAiPredictionAlerts = async () => {
  console.log('[Cron] Running AI risk predictions (cache-first strategy)...');

  let fromCacheCount = 0;
  let newCallCount = 0;
  let skippedLowData = 0;
  let skippedQuotaGuard = 0;
  let alertsSent = 0;

  const students = await User.find({ role: 'student' });
  const today = new Date().toISOString().split('T')[0];

  const cacheWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);


  const studentsNeedingFreshCall = [];

  for (const student of students) {
    const cached = await AiPrediction.findOne({
      student: student._id,
      generatedAt: { $gte: cacheWindow }
    });

    if (cached && cached.prediction?.overallRisk) {
      fromCacheCount++;

      if (['high', 'critical'].includes(cached.prediction.overallRisk)) {
        const result = await sendEmail({
          to: student.email,
          subject: `AI Alert: ${cached.prediction.overallRisk === 'critical' ? 'Critical' : 'High'} Attendance Risk`,
          html: aiRiskAlertTemplate({
            name: student.name,
            overallRisk: cached.prediction.overallRisk,
            overallSummary: cached.prediction.overallSummary || 'Your attendance is at risk.',
            immediateAction: cached.prediction.immediateAction || 'Please attend your upcoming classes.'
          })
        });
        if (result.success) alertsSent++;
      }
    } else {
      studentsNeedingFreshCall.push(student);
    }
  }

  console.log(
    `[Cron] Pass 1 done: ${fromCacheCount} from cache, ` +
    `${studentsNeedingFreshCall.length} need new generation`
  );


  const toProcess = studentsNeedingFreshCall.slice(0, MAX_NEW_AI_CALLS_PER_RUN);
  skippedQuotaGuard = Math.max(0, studentsNeedingFreshCall.length - MAX_NEW_AI_CALLS_PER_RUN);

  if (skippedQuotaGuard > 0) {
    console.log(
      `[Cron] Quota guard: deferring ${skippedQuotaGuard} student(s) to tomorrow's run`
    );
  }

  for (let i = 0; i < toProcess.length; i++) {
    const student = toProcess[i];

    if (i > 0) {
      console.log(`[Cron] Waiting ${DELAY_BETWEEN_GEMINI_CALLS_MS / 1000}s...`);
      await sleep(DELAY_BETWEEN_GEMINI_CALLS_MS);
    }

    try {
      const subjects = await Subject.find({ students: student._id });
      if (subjects.length === 0) {
        skippedLowData++;
        continue;
      }

      const attendanceData = await Promise.all(
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
            ? Math.round((attended / totalSessions) * 100) : 0;

          return { subject, records, totalSessions, attended, percentage };
        })
      );

      const totalSessions = attendanceData.reduce((sum, s) => sum + s.totalSessions, 0);
      if (totalSessions < 5) {
        console.log(`[Cron] Skipping ${student.name} — only ${totalSessions} sessions`);
        skippedLowData++;
        continue;
      }

      const prompt = buildCronPrompt(student, attendanceData, today);
      const rawText = await callGemini(prompt, { maxRetries: 1, baseDelay: 10000 });
      newCallCount++;

      const cleaned = rawText
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

      const prediction = JSON.parse(cleaned);

      if (!prediction?.overallRisk) {
        console.warn(`[Cron] Unexpected prediction format for ${student.name}:`, rawText.slice(0, 100));
        continue;
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await AiPrediction.findOneAndUpdate(
        { student: student._id },
        { student: student._id, prediction, generatedAt: new Date(), expiresAt },
        { upsert: true, new: true }
      );

      console.log(`[Cron] ${student.name}: ${prediction.overallRisk}`);

      if (['high', 'critical'].includes(prediction.overallRisk)) {
        const result = await sendEmail({
          to: student.email,
          subject: `AI Alert: ${prediction.overallRisk === 'critical' ? 'Critical' : 'High'} Attendance Risk`,
          html: aiRiskAlertTemplate({
            name: student.name,
            overallRisk: prediction.overallRisk,
            overallSummary: prediction.overallSummary || 'Your attendance is at risk.',
            immediateAction: prediction.immediateAction || 'Please attend your upcoming classes.'
          })
        });
        if (result.success) alertsSent++;
      }

    } catch (err) {
      const errStr = JSON.stringify(err) || err.message || '';

      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
        console.warn(
          `[Cron] Quota exhausted after ${i + 1} calls. ` +
          `Stopping AI calls — remaining students will use cache next run.`
        );
        break; 
      }

      console.error(`[Cron] AI prediction failed for ${student.name}:`, err.message || errStr.slice(0, 200));
    }
  }

  const summary = [
    `${fromCacheCount} from cache`,
    `${newCallCount} new Gemini call(s)`,
    `${alertsSent} alert email(s) sent`,
    skippedLowData > 0 ? `${skippedLowData} skipped (low data)` : null,
    skippedQuotaGuard > 0 ? `${skippedQuotaGuard} deferred (quota guard)` : null
  ].filter(Boolean).join(', ');

  console.log(`[Cron] AI predictions done — ${summary}`);
  return { alertsSent, fromCacheCount, newCallCount };
};

const runDailyAttendanceCheck = async () => {
  console.log(`\n[Cron] Daily check started at ${new Date().toLocaleString()}`);
  try {
    await runThresholdCheck();
    await sleep(1000);
    await runAiPredictionAlerts();
  } catch (err) {
    console.error('[Cron] Unexpected error in daily check:', err.message);
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