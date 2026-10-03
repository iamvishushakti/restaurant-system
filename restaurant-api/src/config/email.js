const nodemailer = require('nodemailer');

// Nodemailer SMTP Transporter configuration with connection timeouts
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
  connectionTimeout: 4000,
  greetingTimeout: 4000,
  socketTimeout: 5000,
});

module.exports = transporter;
