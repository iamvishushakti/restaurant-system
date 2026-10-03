const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    title: { type: String, required: true },
    discountType: { type: String, enum: ['PERCENTAGE', 'FLAT'], default: 'PERCENTAGE' },
    discountValue: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: 0 }, // 0 = unlimited
    description: { type: String, default: '' },
    isPermanent: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    validTill: { type: String, default: '2099-12-31' },
    usageCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

module.exports = Coupon;
