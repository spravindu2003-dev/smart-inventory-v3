const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

if (config.smtpHost) {
  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
}

async function sendPasswordResetEmail(to, username, resetToken) {
  const resetUrl = `${config.appUrl}/reset-password/${resetToken}`;

  if (!transporter) {
    console.log('========================================');
    console.log('DEV MODE: Password reset link');
    console.log(`  To: ${to}`);
    console.log(`  URL: ${resetUrl}`);
    console.log(`  Token: ${resetToken}`);
    console.log('========================================');
    return;
  }

  await transporter.sendMail({
    from: config.smtpFrom,
    to,
    subject: 'Smart Inventory - Password Reset',
    html: `
      <h2>Password Reset</h2>
      <p>Hello ${username},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
