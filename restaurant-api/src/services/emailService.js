const transporter = require('../config/email');
const otpTemplate = require('../templates/otpTemplate');
const paymentReceiptTemplate = require('../templates/paymentReceiptTemplate');

/**
 * Send OTP Verification Email
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6 digit OTP string
 */
const sendOtpEmail = async (toEmail, otp) => {
  const { subject, html, text } = otpTemplate(otp);

  const mailOptions = {
    from: process.env.MAIL_FROM || `"The Daily Culinary Chronicle" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [Email Sent]: OTP to ${toEmail} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Email Send Error]:', error.message);
    console.log(`\n📢 [DEV Fallback OTP]: Verification code for ${toEmail} is 👉 [ ${otp} ]\n`);
    return { success: false, error: error.message };
  }
};

/**
 * Send Payment Receipt & 10% Cashback Email Notification
 * @param {string} toEmail - Recipient patron email
 * @param {Object} receiptData - Bill receipt payload
 */
const sendPaymentReceiptEmail = async (toEmail, receiptData) => {
  const { subject, html, text } = paymentReceiptTemplate(receiptData);

  const mailOptions = {
    from: process.env.MAIL_FROM || `"The Daily Culinary Chronicle" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [Payment Email Sent]: Receipt dispatched to ${toEmail} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Payment Email Error]:', error.message);
    console.log(`\n📢 [DEV Fallback Receipt]: Sent to ${toEmail} for ₹${receiptData.finalPaid} (+₹${receiptData.cashbackEarned} cashback)\n`);
    return { success: false, error: error.message };
  }
};

/**
 * Send Password Reset & Security Notification Email
 * @param {string} toEmail - Recipient email address
 * @param {Object} passData - { name, role, newPasscode, resetTime }
 */
const sendPasswordResetEmail = async (toEmail, passData) => {
  const { name = 'Staff Member', role = 'staff', newPasscode, resetTime = new Date() } = passData;

  const subject = `[SECURITY NOTICE] Passcode Updated for ${role.toUpperCase()} Station`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Courier New', Courier, monospace; background-color: #f7f3eb; color: #1a1612; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #fffdf9; border: 3px solid #1a1612; padding: 24px; border-radius: 8px; box-shadow: 4px 4px 0px #1a1612; }
          .header { text-align: center; border-bottom: 2px solid #1a1612; padding-bottom: 12px; margin-bottom: 18px; }
          .headline { font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 0; color: #1a1612; }
          .badge { display: inline-block; background: #1a1612; color: #f59e0b; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px; }
          .box { background: #eee7d7; border: 2px solid #1a1612; padding: 16px; border-radius: 6px; margin: 16px 0; }
          .passcode { font-size: 28px; font-weight: 900; color: #854d0e; letter-spacing: 4px; text-align: center; margin: 10px 0; }
          .footer { font-size: 11px; color: #71695f; text-align: center; border-top: 1px solid #d1c7b7; padding-top: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">★ THE DAILY CHRONICLE OS SECURITY ★</span>
            <h1 class="headline">Passcode Reset Notice</h1>
            <p style="font-size: 11px; color: #71695f; margin: 4px 0 0 0;">Station Security & Credential Notification</p>
          </div>

          <p>Dear <strong>${name}</strong> (${role.toUpperCase()}),</p>
          <p>Your authentication duty passcode for <strong>The Daily Culinary Chronicle</strong> workstation has been successfully updated on <strong>${new Date(resetTime).toLocaleString()}</strong>.</p>

          <div class="box">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #554e45; text-align: center;">Your New Station Passcode:</div>
            <div class="passcode">${newPasscode}</div>
            <div style="font-size: 10px; color: #71695f; text-align: center;">Use this passcode along with <strong>${toEmail}</strong> to log in.</div>
          </div>

          <p style="font-size: 11px; color: #554e45;">If you did not initiate this passcode change, please notify your General Manager or the Company CEO immediately.</p>

          <div class="footer">
            <p>© ${new Date().getFullYear()} The Daily Culinary Chronicle • Internal Station Operating System</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `The Daily Chronicle - Passcode Reset\n\nDear ${name} (${role}),\nYour duty passcode has been reset to: [ ${newPasscode} ] on ${new Date(resetTime).toLocaleString()}.\n\nIf you did not request this, please notify Management immediately.`;

  const mailOptions = {
    from: process.env.MAIL_FROM || `"The Daily Culinary Chronicle" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [Password Reset Email Sent]: Dispatched to ${toEmail} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Password Reset Email Error]:', error.message);
    console.log(`\n📢 [DEV Fallback Passcode Reset]: New passcode for ${toEmail} is 👉 [ ${newPasscode} ]\n`);
    return { success: false, error: error.message };
  }
};

/**
 * Send Staff Login Passcode Email
 * @param {string} toEmail - Recipient email address
 * @param {Object} data - { code, name }
 */
const sendStaffLoginCodeEmail = async (toEmail, { code, name = 'Staff Member' }) => {
  const subject = `[STAFF ACCESS PASSCODE] ${code} • Restaurant OS Login Code`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Courier New', Courier, monospace; background-color: #f7f3eb; color: #1a1612; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #fffdf9; border: 3px solid #1a1612; padding: 24px; border-radius: 8px; box-shadow: 5px 5px 0px #1a1612; }
          .header { text-align: center; border-bottom: 2px solid #1a1612; padding-bottom: 12px; margin-bottom: 18px; }
          .headline { font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 0; color: #1a1612; }
          .badge { display: inline-block; background: #1a1612; color: #f59e0b; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px; }
          .box { background: #eee7d7; border: 2px solid #1a1612; padding: 18px; border-radius: 6px; margin: 18px 0; text-align: center; }
          .passcode { font-size: 34px; font-weight: 900; color: #854d0e; letter-spacing: 6px; text-align: center; margin: 8px 0; }
          .footer { font-size: 11px; color: #71695f; text-align: center; border-top: 1px solid #d1c7b7; padding-top: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">★ RESTAURANT COMMAND STATION SECURITY ★</span>
            <h1 class="headline">Staff Duty Access Code</h1>
            <p style="font-size: 11px; color: #71695f; margin: 4px 0 0 0;">Unified Dashboard & Kitchen Control</p>
          </div>

          <p>Hello <strong>${name}</strong>,</p>
          <p>Here is your single-use security passcode to log into the <strong>Restaurant Command & Food Control Station</strong>:</p>

          <div class="box">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #554e45;">Your 4-Digit Login Passcode:</div>
            <div class="passcode">${code}</div>
            <div style="font-size: 10.5px; color: #71695f;">Valid for 10 minutes • Keep this passcode confidential</div>
          </div>

          <p style="font-size: 11px; color: #554e45;">This code grants immediate access to the Main Operations Dashboard, Tables Billing, and Chef Food Control.</p>

          <div class="footer">
            <p>© ${new Date().getFullYear()} The Daily Culinary Chronicle • Internal Restaurant Operating System</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `The Daily Culinary Chronicle - Staff Login Code\n\nYour 4-digit staff duty login passcode is: [ ${code} ]\n\nEnter this code on the staff login screen to access the Dashboard & Food Control.`;

  const mailOptions = {
    from: process.env.MAIL_FROM || `"The Daily Culinary Chronicle" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [Staff Login Code Sent]: Dispatched to ${toEmail} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Staff Login Code Error]:', error.message);
    console.log(`\n📢 [DEV Fallback Staff Passcode]: Login code for ${toEmail} is 👉 [ ${code} ]\n`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOtpEmail,
  sendPaymentReceiptEmail,
  sendPasswordResetEmail,
  sendStaffLoginCodeEmail,
};
