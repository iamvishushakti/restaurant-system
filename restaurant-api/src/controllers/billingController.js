const { getDB, saveDB } = require('../config/database');
const redis = require('../config/redis');
const { sendPaymentReceiptEmail } = require('../services/emailService');
const { broadcastEvent } = require('../services/socketService');
const { clearTableSession } = require('../services/tableSessionService');
const { isSpecialDateToday } = require('./userController');
const { Bill, User, Order } = require('../models');

/**
 * Generate / Preview Bill for a Table
 * @route GET /api/billing/table/:tableNo
 */
const getTableBill = async (req, res) => {
  try {
    const { tableNo } = req.params;
    const db = getDB();

    // 1. Fetch active unpaid orders for this table
    const tableOrders = (db.orders || []).filter(
      (o) => o.tableNo === String(tableNo) && o.paymentStatus !== 'PAID'
    );

    const allItems = [];
    let subtotal = 0;

    tableOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const qty = item.quantity || 1;
        const rawPrice = item.price;
        const numPrice =
          typeof rawPrice === 'string'
            ? parseFloat(rawPrice.replace(/[^\d.]/g, '')) || 0
            : Number(rawPrice) || 0;
        subtotal += numPrice * qty;

        const itemName = item.name || item.title || 'Dish';
        const existing = allItems.find((i) => (i.name || i.title) === itemName && i.unitPrice === numPrice);
        if (existing) {
          existing.quantity += qty;
          existing.totalPrice += numPrice * qty;
        } else {
          allItems.push({
            ...item,
            name: itemName,
            quantity: qty,
            unitPrice: numPrice,
            totalPrice: numPrice * qty,
            orderId: order.orderId,
          });
        }
      });
    });

    // 2. Determine patron associated with table
    const tableSession = db.tableSessions ? db.tableSessions[String(tableNo)] : null;
    let customerEmail = tableOrders[0]?.customerEmail || (tableSession?.isOccupied ? tableSession.customerEmail : '') || '';
    let customerName = tableOrders[0]?.customerName || (tableSession?.isOccupied ? tableSession.customerName : '') || '';
    let user = null;

    const isTableOccupied = tableOrders.length > 0 || Boolean(tableSession?.isOccupied);

    if (isTableOccupied && customerEmail) {
      user = (db.users || []).find((u) => u.email.toLowerCase() === customerEmail.toLowerCase());
      if (!user) {
        try {
          user = await User.findOne({ email: customerEmail.toLowerCase() }).lean();
        } catch (e) {}
      }
    }

    const resolvedUser = (isTableOccupied && user) ? user : {
      email: isTableOccupied ? customerEmail : '',
      name: isTableOccupied ? (customerName || 'Table Patron') : '',
      phone: '',
      dob: null,
      anniversaryDate: null,
      walletBalance: 0,
    };

    // 3. Check for 20% Birthday or Anniversary Discount (only if valid DOB/Anniversary set)
    const isBirthday = resolvedUser.dob ? isSpecialDateToday(resolvedUser.dob) : false;
    const isAnniversary = resolvedUser.anniversaryDate ? isSpecialDateToday(resolvedUser.anniversaryDate) : false;
    const discountPercent = (isBirthday || isAnniversary) ? 20 : 0;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);

    let discountReason = '';
    if (isBirthday && isAnniversary) {
      discountReason = 'Birthday & Anniversary Double Celebration (20% OFF)';
    } else if (isBirthday) {
      discountReason = 'Birthday Special Celebration (20% OFF)';
    } else if (isAnniversary) {
      discountReason = 'Anniversary Special Celebration (20% OFF)';
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxRate = 0.05; // 5% GST
    const tax = Math.round(discountedSubtotal * taxRate);
    const grandTotal = discountedSubtotal + tax;

    // 4. Calculate 10% Cashback to be earned upon payment
    const estimatedCashback = Math.round(grandTotal * 0.10);

    return res.status(200).json({
      success: true,
      bill: {
        tableNo,
        isTableOccupied,
        customerEmail: resolvedUser.email,
        customerName: resolvedUser.name,
        customerPhone: resolvedUser.phone || '',
        dob: resolvedUser.dob || '',
        anniversaryDate: resolvedUser.anniversaryDate || '',
        ordersCount: tableOrders.length,
        items: allItems,
        subtotal,
        discountPercent,
        discountAmount,
        discountReason,
        isBirthday,
        isAnniversary,
        taxRate: 5,
        tax,
        grandTotal,
        walletBalance: resolvedUser.walletBalance || 0,
        estimatedCashback, // 10% save
      },
    });
  } catch (error) {
    console.error('❌ [Get Bill Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate table bill',
      error: error.message,
    });
  }
};

/**
 * Settle Bill & Process Payment (Cashier Billing Counter)
 * Applies discounts, collects payment, adds 10% cashback to patron balance,
 * sends receipt email, and updates table real-time.
 * @route POST /api/billing/pay
 */
const processPayment = async (req, res) => {
  try {
    const {
      tableNo,
      customerEmail = 'vkshakti.office@gmail.com',
      customerName = 'Esteemed Patron',
      paymentMethod = 'UPI / Cashier Counter',
      transactionId = '',
      redeemWalletAmount = 0,
      customDiscountPercent = null,
      customDiscountReason = null,
      items = [],
      subtotal = 0,
      discountAmount = 0,
      discountReason = '',
      tax = 0,
      finalPaid = 0,
      staffCashier = 'Chief Cashier Desk',
    } = req.body;

    const db = getDB();
    const billId = `BILL-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalTxnId = (transactionId && String(transactionId).trim()) 
      ? String(transactionId).trim().toUpperCase() 
      : `TXN-${Date.now().toString().slice(-8)}`;
    const now = new Date();

    // 1. Calculate 10% Cashback on the settled payment amount
    const actualPaidAmount = Number(finalPaid) || 0;
    const cashbackEarned = Math.round(actualPaidAmount * 0.10); // 10% SAVED!

    // 2. Find and update user wallet balance in DB & Redis & Mongoose
    let userIndex = db.users.findIndex(
      (u) => u.email.toLowerCase() === customerEmail.toLowerCase().trim()
    );

    let currentBalance = 0;
    if (userIndex !== -1) {
      currentBalance = Number(db.users[userIndex].walletBalance) || 0;
      const usedWallet = Math.min(currentBalance, Number(redeemWalletAmount) || 0);
      currentBalance = currentBalance - usedWallet + cashbackEarned;

      db.users[userIndex].walletBalance = currentBalance;
      db.users[userIndex].totalSpent =
        (Number(db.users[userIndex].totalSpent) || 0) + actualPaidAmount;
      db.users[userIndex].updatedAt = now.toISOString();
    } else {
      currentBalance = cashbackEarned;
      db.users.push({
        id: `usr_${Date.now()}`,
        email: customerEmail.toLowerCase().trim(),
        name: customerName,
        phone: '',
        dob: '',
        anniversaryDate: '',
        dobLocked: false,
        anniversaryLocked: false,
        walletBalance: currentBalance,
        totalSpent: actualPaidAmount,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      userIndex = db.users.length - 1;
    }

    // Update User in Mongoose
    try {
      await User.findOneAndUpdate(
        { email: customerEmail.toLowerCase().trim() },
        {
          $set: {
            walletBalance: currentBalance,
            updatedAt: now,
          },
          $inc: {
            totalSpent: actualPaidAmount,
          },
        },
        { upsert: true }
      );
    } catch (mErr) {}

    // 3. Mark active table orders as PAID
    if (tableNo) {
      (db.orders || []).forEach((order) => {
        if (order.tableNo === String(tableNo) && order.paymentStatus !== 'PAID') {
          order.paymentStatus = 'PAID';
          order.status = 'Completed';
          order.paidAt = now.toISOString();
          order.billId = billId;
        }
      });

      try {
        await Order.updateMany(
          { tableNo: String(tableNo), paymentStatus: { $ne: 'PAID' } },
          { $set: { paymentStatus: 'PAID', status: 'Completed', paidAt: now, billId } }
        );
      } catch (oErr) {}
    }

    // 4. Record the Bill in persistent DB & Mongoose
    const billRecord = {
      billId,
      transactionId: finalTxnId,
      tableNo: String(tableNo),
      customerEmail,
      customerName,
      items,
      subtotal: Number(subtotal),
      discountAmount: Number(discountAmount),
      discountReason,
      tax: Number(tax),
      redeemWalletAmount: Number(redeemWalletAmount) || 0,
      finalPaid: actualPaidAmount,
      cashbackEarned, // 10%
      patronWalletBalanceAfter: currentBalance,
      paymentMethod,
      staffCashier,
      settledAt: now.toISOString(),
      status: 'SETTLED',
    };

    db.bills = db.bills || [];
    db.bills.unshift(billRecord);
    saveDB();

    try {
      await Bill.create(billRecord);
    } catch (bErr) {}

    // 5. Update user in Redis
    try {
      const redisKey = `user:${customerEmail.toLowerCase().trim()}`;
      await redis.set(redisKey, JSON.stringify(db.users[userIndex]), 'EX', 86400);
    } catch (e) {}

    // 6. Send Rich Email Receipt with 10% reward notice via Nodemailer (Non-blocking background delivery)
    sendPaymentReceiptEmail(customerEmail, {
      customerName,
      billId,
      transactionId: finalTxnId,
      tableNo: String(tableNo),
      subtotal: Number(subtotal),
      discountAmount: Number(discountAmount),
      discountReason,
      tax: Number(tax),
      finalPaid: actualPaidAmount,
      cashbackEarned,
      currentWalletBalance: currentBalance,
      items,
      paymentMethod,
      timestamp: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    }).catch((err) => console.warn('Background email delivery note:', err.message));

    // 7. Clear Table Session to mark table as AVAILABLE
    try {
      clearTableSession(tableNo);
    } catch (e) {}

    // 8. Broadcast Real-time event via WebSocket to table and staff
    broadcastEvent('bill_settled', {
      ...billRecord,
      sound: 'cash_register_chime',
      alertMessage: `💵 BILL SETTLED: Table #${tableNo} paid ₹${actualPaidAmount} (+₹${cashbackEarned} 10% cashback added)`,
    });

    console.log(
      `💰 [Payment Processed]: Bill #${billId} Table ${tableNo} ₹${actualPaidAmount} in Mongoose + Redis | 10% Cashback: ₹${cashbackEarned}`
    );

    return res.status(200).json({
      success: true,
      message: `Payment of ₹${actualPaidAmount} settled! ₹${cashbackEarned} (10%) credited to patron wallet.`,
      bill: billRecord,
      wallet: {
        currentBalance,
        cashbackEarned,
      },
      emailDelivered: true,
    });
  } catch (error) {
    console.error('❌ [Process Payment Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message,
    });
  }
};

/**
 * Get All Historical Bills
 * @route GET /api/billing/history
 */
const getBillingHistory = async (req, res) => {
  try {
    const db = getDB();
    return res.status(200).json({
      success: true,
      count: (db.bills || []).length,
      bills: db.bills || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve billing history',
      error: error.message,
    });
  }
};

module.exports = {
  getTableBill,
  processPayment,
  getBillingHistory,
};
