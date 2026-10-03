const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema(
  {
    billId: { type: String, required: true, unique: true, index: true },
    tableNo: { type: String, required: true, index: true },
    customerEmail: { type: String, required: true, index: true },
    customerName: { type: String, default: 'Esteemed Patron' },
    items: { type: Array, default: [] },
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    discountReason: { type: String, default: '' },
    tax: { type: Number, default: 0 },
    redeemWalletAmount: { type: Number, default: 0 },
    finalPaid: { type: Number, required: true },
    cashbackEarned: { type: Number, default: 0 }, // 10%
    patronWalletBalanceAfter: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'UPI' },
    transactionId: { type: String, default: '', index: true },
    staffCashier: { type: String, default: 'Chief Cashier Desk' },
    settledAt: { type: Date, default: Date.now },
    status: { type: String, default: 'SETTLED' },
  },
  {
    timestamps: true,
  }
);

const Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);

module.exports = Bill;
