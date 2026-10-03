/**
 * OTP Verification Email Template
 * @param {string} otp - 6 digit verification code
 * @param {string} appName - Restaurant / Brand Name
 * @returns {object} { subject, html, text }
 */
const otpTemplate = (otp, appName = 'Foodie Palace Restaurant') => {
  const subject = `🔐 Your Verification Code: ${otp} - ${appName}`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f6f8;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      .container {
        max-width: 520px;
        margin: 30px auto;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        border: 1px solid #eaeaea;
      }
      .header {
        background: linear-gradient(135deg, #e63946 0%, #d90429 100%);
        padding: 28px 20px;
        text-align: center;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .header p {
        margin: 6px 0 0;
        font-size: 13px;
        opacity: 0.9;
      }
      .body-content {
        padding: 30px 25px;
        color: #333333;
        line-height: 1.6;
      }
      .otp-box {
        background: #f8f9fa;
        border: 2px dashed #e63946;
        border-radius: 10px;
        text-align: center;
        padding: 20px;
        margin: 25px 0;
      }
      .otp-code {
        font-size: 34px;
        font-weight: 800;
        letter-spacing: 10px;
        color: #1d3557;
        margin: 0;
      }
      .note {
        font-size: 13px;
        color: #6c757d;
        text-align: center;
        margin: 10px 0 0;
      }
      .footer {
        background: #fafafa;
        padding: 18px 20px;
        text-align: center;
        border-top: 1px solid #eeeeee;
        font-size: 12px;
        color: #8d99ae;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🍽️ ${appName}</h1>
        <p>Security & Account Verification</p>
      </div>
      <div class="body-content">
        <h3 style="margin-top: 0; color: #1d3557;">Verify Your Email Address</h3>
        <p>Hi there,</p>
        <p>Please use the following One-Time Password (OTP) to complete your verification process:</p>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <p class="note">⏳ Valid for <strong>5 minutes</strong> only</p>
        </div>

        <p style="font-size: 14px; color: #555;">If you did not request this verification code, please ignore this email or contact support if you suspect unauthorized activity.</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.<br/>
        This is an automated system message, please do not reply directly.
      </div>
    </div>
  </body>
  </html>
  `;

  const text = `Your verification OTP for ${appName} is: ${otp}. It will expire in 5 minutes.`;

  return { subject, html, text };
};

module.exports = otpTemplate;
