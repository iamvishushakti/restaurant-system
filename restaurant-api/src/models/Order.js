const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String, required: true },
    price: { type: mongoose.Schema.Types.Mixed, default: 0 },
    quantity: { type: Number, default: 1 },
    category: { type: String, default: 'Dish' },
    unitPrice: { type: Number },
    totalPrice: { type: Number },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    tableNo: { type: String, required: true, index: true },
    roundNumber: { type: Number, default: 1 },
    items: [OrderItemSchema],
    totalCount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    specialNote: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    prepMinutes: { type: Number, default: 15 },
    assignedChefs: [{ type: String }],
    chefLabel: { type: String, default: 'Gourmet Kitchen Brigade' },
    chefName: { type: String, default: 'Master Chef' },
    orderedAt: { type: Date, default: Date.now },
    prepStartedAt: { type: Date },
    readyAt: { type: Date },
    completedAt: { type: Date },
    paidAt: { type: Date },
    status: {
      type: String,
      enum: ['Pending', 'In Preparation', 'Ready to Serve', 'Completed', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID'],
      default: 'UNPAID',
      index: true,
    },
    billId: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

module.exports = Order;
