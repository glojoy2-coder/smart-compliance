// ============================================================
// email.js — Nodemailer (works with Gmail SMTP)
// ============================================================
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendWelcomeEmail({ to, name, agencyName }) {
  await transporter.sendMail({
    from:    `"Smart Compliance" <${process.env.FROM_EMAIL}>`,
    to,
    subject: `Welcome to Smart Compliance, ${name}!`,
    html: `
      <h2>Welcome aboard, ${name}!</h2>
      <p>Your account for <strong>${agencyName}</strong> has been created.</p>
      <p>Complete the two agreement signatures and select your plan to activate your tool.</p>
      <p><a href="${process.env.APP_URL}/onboarding">Continue Onboarding</a></p>
    `,
  });
}

async function sendActivationEmail({ to, name, plan, token }) {
  await transporter.sendMail({
    from:    `"Smart Compliance" <${process.env.FROM_EMAIL}>`,
    to,
    subject: `Your Smart Compliance Account is Live!`,
    html: `
      <h2>You are fully activated, ${name}!</h2>
      <p>Plan: <strong>${plan}</strong></p>
      <p>Your embed token: <code>${token}</code></p>
      <p><a href="${process.env.APP_URL}/dashboard">Go to Your Dashboard</a></p>
    `,
  });
}

async function sendPaymentFailedEmail({ to, name }) {
  await transporter.sendMail({
    from:    `"Smart Compliance" <${process.env.FROM_EMAIL}>`,
    to,
    subject: `Action Required — Smart Compliance Payment Failed`,
    html: `
      <h2>Hi ${name}, your payment did not go through.</h2>
      <p>Your tool access has been paused until payment is updated.</p>
      <p><a href="${process.env.APP_URL}/billing">Update Payment Method</a></p>
    `,
  });
}

module.exports = { sendWelcomeEmail, sendActivationEmail, sendPaymentFailedEmail };
