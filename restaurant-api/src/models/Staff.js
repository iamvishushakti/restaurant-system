const mongoose = require('mongoose');

const SalaryPaymentSchema = new mongoose.Schema({
  month: { type: String, required: true },
  amount: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now },
  paidBy: { type: String, default: 'Admin' },
  paidByName: { type: String, default: 'Administrator' },
  transactionRef: { type: String, default: () => `PAY-${Date.now().toString().slice(-6)}` },
  notes: { type: String, default: 'Monthly regular salary disbursement' },
});

const StaffSchema = new mongoose.Schema(
  {
    staffId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passcode: { type: String, default: '1234' },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['root', 'manager', 'chef', 'cashier', 'waiter', 'carrier'],
      required: true,
      index: true,
    },
    allowedRoles: [{ type: String }],
    department: { type: String, default: 'Floor Operations' },
    phone: { type: String, default: '9876543210' },
    avatar: { type: String, default: '👨‍💼' },
    salary: { type: Number, default: 25000 },
    salaryStatus: { type: String, enum: ['PAID', 'PENDING', 'PROCESSING'], default: 'PENDING' },
    lastPaidDate: { type: Date, default: null },
    salaryHistory: [SalaryPaymentSchema],
    hiredBy: { type: String, default: 'manager@chronicle.com' },
    hiredByName: { type: String, default: 'General Manager' },
    hiredAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const Staff = mongoose.models.Staff || mongoose.model('Staff', StaffSchema);

module.exports = Staff;


