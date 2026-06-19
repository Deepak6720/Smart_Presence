'use strict';
const nodemailer = require('nodemailer');
let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      pool: true,          
      maxConnections: 3,   
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return _transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER or EMAIL_PASS is not set in environment variables');
    }

    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"SmartPresence" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error(`Email failed for ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;