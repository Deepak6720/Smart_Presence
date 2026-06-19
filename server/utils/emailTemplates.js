const baseWrapper = (innerContent) => `
<div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="font-size: 20px; font-weight: 700; color: #2563eb;">SmartPresence</span>
  </div>
  ${innerContent}
  <p style="font-size: 12px; color: #9ca3af; margin-top: 32px; text-align: center;">
    This is an automated message from SmartPresence — AI-Powered Attendance & Analytics.
  </p>
</div>
`;
//Template 1: Account creation welcome email 
const accountCreatedTemplate = ({ name, role, email }) => baseWrapper(`
  <h2 style="color: #111827; font-size: 18px;">Welcome, ${name}! 🎉</h2>
  <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
    Your ${role} account has been created on SmartPresence.
    You can now log in using this email address: <strong>${email}</strong>
  </p>
  <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin-top: 16px;">
    <p style="color: #1e40af; font-size: 13px; margin: 0;">
      ${role === 'student'
        ? 'Don\'t forget to register your face for automatic attendance marking!'
        : 'You can now manage attendance and view AI-powered analytics for your subjects.'
      }
    </p>
  </div>
`);

// Template 2: Below-75% threshold alert (simple arithmetic trigger) 
const lowAttendanceTemplate = ({ name, subjectName, percentage }) => baseWrapper(`
  <h2 style="color: #dc2626; font-size: 18px;">⚠️ Attendance Alert</h2>
  <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
    Hi ${name}, your attendance in <strong>${subjectName}</strong> has dropped to
    <strong style="color: #dc2626;">${percentage}%</strong>, which is below the
    required 75% threshold.
  </p>
  <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-top: 16px;">
    <p style="color: #991b1b; font-size: 13px; margin: 0;">
      Please attend upcoming classes regularly to recover your attendance percentage.
    </p>
  </div>
`);

//Template 3: Gemini AI risk prediction alert 
const aiRiskAlertTemplate = ({ name, overallRisk, overallSummary, immediateAction }) => baseWrapper(`
  <h2 style="color: #7c3aed; font-size: 18px;">🤖 AI Risk Alert</h2>
  <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
    Hi ${name}, Gemini AI has analyzed your attendance trend and flagged your
    risk level as <strong style="color: #7c3aed; text-transform: capitalize;">${overallRisk}</strong>.
  </p>
  <div style="background: #f5f3ff; border-radius: 8px; padding: 16px; margin-top: 16px;">
    <p style="color: #5b21b6; font-size: 13px; margin: 0 0 8px 0;">${overallSummary}</p>
    <p style="color: #5b21b6; font-size: 13px; margin: 0; font-weight: 600;">
      ⚡ ${immediateAction}
    </p>
  </div>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
    View your full subject-wise breakdown in the AI Risk Prediction page on SmartPresence.
  </p>
`);

module.exports = { accountCreatedTemplate, lowAttendanceTemplate, aiRiskAlertTemplate };