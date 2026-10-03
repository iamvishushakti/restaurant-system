/**
 * Newspaper Style Payment Receipt & Loyalty Reward Email Template
 * @param {Object} data
 * @param {string} data.customerName
 * @param {string} data.billId
 * @param {string} data.tableNo
 * @param {number} data.subtotal
 * @param {number} data.discountAmount
 * @param {string} data.discountReason
 * @param {number} data.tax
 * @param {number} data.finalPaid
 * @param {number} data.cashbackEarned (10%)
 * @param {number} data.currentWalletBalance
 * @param {Array} data.items
 * @param {string} data.paymentMethod
 * @param {string} data.timestamp
 * @param {string} appName
 */
const paymentReceiptTemplate = (data, appName = 'The Daily Culinary Chronicle') => {
  const {
    customerName = 'Esteemed Patron',
    billId = `CHRONICLE-${Math.floor(1000 + Math.random() * 9000)}`,
    tableNo = '4',
    subtotal = 0,
    discountAmount = 0,
    discountReason = '',
    tax = 0,
    finalPaid = 0,
    cashbackEarned = Math.round(finalPaid * 0.1),
    currentWalletBalance = 0,
    items = [],
    paymentMethod = 'UPI / Card',
    transactionId = '',
    timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  } = data;

  const subject = `📰 Special Gazette: ₹${finalPaid} Payment Settled + ₹${cashbackEarned} Reward Credited! [${billId}]`;

  const itemsHtml = items.length > 0 
    ? items.map(item => `
        <tr style="border-bottom: 1px dashed #d1c7b7;">
          <td style="padding: 8px 4px; font-size: 13px; color: #1a1612; font-family: 'Courier New', Courier, monospace;">
            <strong>${item.name || item.title || 'Special Dish'}</strong> <span style="color:#776e65;">x${item.quantity || 1}</span>
          </td>
          <td style="padding: 8px 4px; text-align: right; font-size: 13px; font-weight: bold; color: #1a1612; font-family: 'Courier New', Courier, monospace;">
            ₹${(item.price ? (typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : item.price) * (item.quantity || 1) : 0).toFixed(2)}
          </td>
        </tr>
      `).join('')
    : `
        <tr style="border-bottom: 1px dashed #d1c7b7;">
          <td style="padding: 8px 4px; font-size: 13px; color: #1a1612; font-family: 'Courier New', Courier, monospace;">Dining Service Charges</td>
          <td style="padding: 8px 4px; text-align: right; font-size: 13px; font-weight: bold; color: #1a1612; font-family: 'Courier New', Courier, monospace;">₹${subtotal.toFixed(2)}</td>
        </tr>
      `;

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
        background-color: #ede6d6;
        font-family: 'Georgia', serif;
        color: #1a1612;
      }
      .newspaper-wrap {
        max-width: 580px;
        margin: 25px auto;
        background: #fdfbf7;
        border: 4px solid #1a1612;
        padding: 24px;
        box-shadow: 6px 6px 0px #1a1612;
      }
      .header-title {
        text-align: center;
        border-bottom: 3px double #1a1612;
        padding-bottom: 12px;
        margin-bottom: 16px;
      }
      .header-title h1 {
        margin: 0;
        font-size: 26px;
        letter-spacing: 2px;
        text-transform: uppercase;
        font-weight: 900;
      }
      .header-title p {
        margin: 4px 0 0;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        letter-spacing: 1px;
        color: #554e45;
      }
      .headline-box {
        background: #1a1612;
        color: #f7f3eb;
        padding: 10px;
        text-align: center;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        font-weight: bold;
        letter-spacing: 1px;
        margin-bottom: 20px;
      }
      .receipt-meta {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.6;
        margin-bottom: 18px;
        border-bottom: 1px solid #1a1612;
        padding-bottom: 12px;
      }
      .reward-banner {
        background-color: #fff4d4;
        border: 2px dashed #b45309;
        padding: 14px;
        margin: 20px 0;
        text-align: center;
        border-radius: 4px;
      }
      .reward-title {
        font-size: 14px;
        font-weight: bold;
        color: #92400e;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 0 0 6px;
      }
      .reward-amount {
        font-size: 22px;
        font-weight: 900;
        color: #78350f;
        font-family: 'Courier New', monospace;
      }
      .balance-pill {
        display: inline-block;
        background: #1a1612;
        color: #fef08a;
        font-size: 12px;
        padding: 4px 12px;
        font-weight: bold;
        margin-top: 8px;
      }
      .footer-note {
        text-align: center;
        font-size: 11px;
        color: #71695f;
        font-style: italic;
        margin-top: 24px;
        border-top: 1px solid #d1c7b7;
        padding-top: 12px;
      }
    </style>
  </head>
  <body>
    <div class="newspaper-wrap">
      <div class="header-title">
        <h1>🗞️ ${appName}</h1>
        <p>OFFICIAL BILLING GAZETTE • TABLE #${tableNo} • ${timestamp}</p>
      </div>

      <div class="headline-box">
        ★ OFFICIAL DINING FOLIO & FISCAL RECEIPT ★
      </div>

      <div class="receipt-meta">
        <strong>Patron:</strong> ${customerName}<br/>
        <strong>Invoice Folio:</strong> #${billId}<br/>
        ${transactionId ? `<strong>Transaction Ref / UTR:</strong> <span style="font-family: monospace; background:#eee; padding:1px 4px; border-radius:3px;">#${transactionId}</span><br/>` : ''}
        <strong>Payment Method:</strong> ${paymentMethod} (Verified Instant)<br/>
        <strong>Date & Time:</strong> ${timestamp}
      </div>

      <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
        <thead>
          <tr style="border-bottom: 2px solid #1a1612; text-align: left; font-family: 'Courier New', monospace; font-size: 11px;">
            <th style="padding: 6px 4px; text-transform: uppercase;">Dishes & Provisions</th>
            <th style="padding: 6px 4px; text-align: right; text-transform: uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Summary Table -->
      <table width="100%" cellspacing="0" cellpadding="4" style="font-family: 'Courier New', Courier, monospace; font-size: 13px;">
        <tr>
          <td style="color: #554e45;">Subtotal:</td>
          <td style="text-align: right; font-weight: bold;">₹${subtotal.toFixed(2)}</td>
        </tr>
        ${discountAmount > 0 ? `
        <tr style="color: #991b1b;">
          <td>Discount Applied (${discountReason || 'Promotional'}):</td>
          <td style="text-align: right; font-weight: bold;">-₹${discountAmount.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="color: #554e45;">GST / Taxes (5%):</td>
          <td style="text-align: right;">₹${tax.toFixed(2)}</td>
        </tr>
        <tr style="border-top: 2px solid #1a1612; font-size: 16px;">
          <td style="padding-top: 10px; font-weight: 900; color: #1a1612;">TOTAL SETTLED:</td>
          <td style="padding-top: 10px; text-align: right; font-weight: 900; color: #1a1612;">₹${finalPaid.toFixed(2)}</td>
        </tr>
      </table>

      <!-- 10% Cashback / Loyalty Reward Box -->
      <div class="reward-banner">
        <div class="reward-title">✨ 10% DINING CASHBACK CREDITED! ✨</div>
        <div class="reward-amount">+₹${cashbackEarned} Added to Your Wallet</div>
        <div class="balance-pill">
          YOUR CURRENT BALANCE: ₹${currentWalletBalance}
        </div>
        <p style="margin: 8px 0 0; font-size: 11px; color: #78350f; font-family: 'Courier New', monospace;">
          You can redeem this balance during your next visit at any billing counter!
        </p>
      </div>

      <div class="footer-note">
        "Thank you for dining with us! We look forward to your next visit at ${appName}."<br/>
        For any billing queries, present Press Folio <strong>#${billId}</strong> at the Front Cashier Desk.
      </div>
    </div>
  </body>
  </html>
  `;

  const text = `
--------------------------------------------------
${appName} - PAYMENT RECEIPT & REWARDS
--------------------------------------------------
Folio ID: ${billId}
Patron: ${customerName}
Table: ${tableNo}
Date: ${timestamp}
--------------------------------------------------
Total Paid: ₹${finalPaid}
10% Cashback Earned: ₹${cashbackEarned}
Your Current Wallet Balance: ₹${currentWalletBalance}
--------------------------------------------------
Thanks for coming! We hope to serve you again soon.
--------------------------------------------------
`;

  return { subject, html, text };
};

module.exports = paymentReceiptTemplate;
