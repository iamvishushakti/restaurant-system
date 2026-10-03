const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: 'Esteemed Patron' },
    phone: { type: String, default: '' },
    dob: { type: String, default: '' }, // 'YYYY-MM-DD'
    anniversaryDate: { type: String, default: '' }, // 'YYYY-MM-DD'
    dobLocked: { type: Boolean, default: false },
    anniversaryLocked: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 }, // 10% cashback accumulates here
    totalSpent: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation in development
const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;
