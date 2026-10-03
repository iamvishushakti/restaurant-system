const { getDB, saveDB } = require('../config/database');
const { Coupon } = require('../models');

const DEFAULT_COUPONS = [
  {
    id: 'coup_royal10',
    code: 'ROYAL10',
    title: 'Royal 10% All-Round Dining',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    description: 'Flat 10% discount on all culinary orders across all dining tables.',
    isPermanent: true,
    isActive: true,
    validTill: '2099-12-31',
    badge: 'ALWAYS ACTIVE 🌟',
    usageCount: 142,
  },
  {
    id: 'coup_feast20',
    code: 'FEAST20',
    title: 'Grand Feast 20% Royal Courtesy',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmount: 899,
    maxDiscountAmount: 500,
    description: 'Special 20% discount for grand family feasts and dining orders above ₹899.',
    isPermanent: true,
    isActive: true,
    validTill: '2099-12-31',
    badge: 'PERMANENT 20% 👑',
    usageCount: 98,
  },
  {
    id: 'coup_welcome10',
    code: 'WELCOME10',
    title: 'New Guest Welcome 10% OFF',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 299,
    maxDiscountAmount: 200,
    description: '10% discount courtesy for all patrons and first-time diners.',
    isPermanent: true,
    isActive: true,
    validTill: '2099-12-31',
    badge: 'WELCOME 10% 🎉',
    usageCount: 215,
  },
  {
    id: 'coup_celebrate20',
    code: 'CELEBRATE20',
    title: 'Anniversary & Birthday Celebration 20% OFF',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmount: 0,
    maxDiscountAmount: 1000,
    description: 'Special 20% celebration courtesy for birthdays, anniversaries, and milestone feasts.',
    isPermanent: true,
    isActive: true,
    validTill: '2099-12-31',
    badge: 'CELEBRATION 🎂',
    usageCount: 67,
  },
  {
    id: 'coup_news40',
    code: 'NEWS40',
    title: 'Front Page Headline 40% OFF',
    discountType: 'PERCENTAGE',
    discountValue: 40,
    minOrderAmount: 399,
    maxDiscountAmount: 300,
    description: 'Enjoy 40% discount on all Tandoori & Biryani dispatches on orders above ₹399.',
    isPermanent: false,
    isActive: true,
    validTill: '2026-12-31',
    badge: 'HOT DEAL 🔥',
    usageCount: 84,
  },
  {
    id: 'coup_royal150',
    code: 'ROYAL150',
    title: "Nawab's Imperial ₹150 Voucher",
    discountType: 'FLAT',
    discountValue: 150,
    minOrderAmount: 699,
    maxDiscountAmount: 150,
    description: 'Direct ₹150 cash deduction on total bill for family feasts & multi-course dinners.',
    isPermanent: false,
    isActive: true,
    validTill: '2026-12-31',
    badge: 'FEAST VOUCHER 💵',
    usageCount: 53,
  },
];

const ensureCouponsSeeded = () => {
  const db = getDB();
  db.coupons = db.coupons || [];

  DEFAULT_COUPONS.forEach((defC) => {
    const existing = db.coupons.find((c) => c.code.toUpperCase() === defC.code.toUpperCase());
    if (!existing) {
      db.coupons.push(defC);
    } else if (defC.isPermanent) {
      existing.isPermanent = true;
      existing.isActive = true;
    }
  });

  saveDB();
};

/**
 * Get all Coupons
 * @route GET /api/coupons
 */
const getCoupons = async (req, res) => {
  try {
    ensureCouponsSeeded();
    const db = getDB();
    const { activeOnly } = req.query;

    let coupons = db.coupons || [];
    if (activeOnly === 'true') {
      coupons = coupons.filter((c) => c.isActive !== false);
    }

    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons',
      error: error.message,
    });
  }
};

/**
 * Create a new custom Coupon
 * @route POST /api/coupons
 */
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      title,
      discountType = 'PERCENTAGE',
      discountValue,
      minOrderAmount = 0,
      maxDiscountAmount = 0,
      description = '',
      isPermanent = false,
      isActive = true,
      validTill = '2099-12-31',
      badge = 'SPECIAL OFFER ✨',
    } = req.body;

    if (!code || !title || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code, title, and discount value are required',
      });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const db = getDB();
    db.coupons = db.coupons || [];

    const existing = db.coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code "${cleanCode}" already exists`,
      });
    }

    const newCoupon = {
      id: `coup_${Date.now()}`,
      code: cleanCode,
      title,
      discountType: discountType === 'FLAT' ? 'FLAT' : 'PERCENTAGE',
      discountValue: Number(discountValue) || 0,
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      description,
      isPermanent: Boolean(isPermanent),
      isActive: Boolean(isActive),
      validTill: validTill || '2099-12-31',
      badge: badge || 'SPECIAL OFFER ✨',
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.coupons.unshift(newCoupon);
    saveDB();

    try {
      await Coupon.create(newCoupon);
    } catch (mErr) {}

    return res.status(201).json({
      success: true,
      message: `Coupon "${cleanCode}" successfully registered`,
      coupon: newCoupon,
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create coupon',
      error: error.message,
    });
  }
};

/**
 * Update an existing Coupon
 * @route PUT /api/coupons/:id
 */
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const db = getDB();
    db.coupons = db.coupons || [];

    const couponIndex = db.coupons.findIndex((c) => c.id === id || c.code.toUpperCase() === id.toUpperCase());
    if (couponIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    // Do not allow deactivating permanent 10% or 20% offers
    if (db.coupons[couponIndex].isPermanent && updates.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Permanent 10% and 20% offers cannot be deactivated.',
      });
    }

    const updated = {
      ...db.coupons[couponIndex],
      ...updates,
      code: updates.code ? updates.code.toUpperCase().trim() : db.coupons[couponIndex].code,
      updatedAt: new Date().toISOString(),
    };

    db.coupons[couponIndex] = updated;
    saveDB();

    try {
      await Coupon.findOneAndUpdate({ code: updated.code }, updated, { upsert: true });
    } catch (mErr) {}

    return res.status(200).json({
      success: true,
      message: `Coupon "${updated.code}" updated successfully`,
      coupon: updated,
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update coupon',
      error: error.message,
    });
  }
};

/**
 * Delete a Coupon
 * @route DELETE /api/coupons/:id
 */
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    db.coupons = db.coupons || [];

    const coupon = db.coupons.find((c) => c.id === id || c.code.toUpperCase() === id.toUpperCase());
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    if (coupon.isPermanent) {
      return res.status(400).json({
        success: false,
        message: 'Permanent 10% & 20% offers are perpetual and cannot be deleted.',
      });
    }

    db.coupons = db.coupons.filter((c) => c.id !== id && c.code.toUpperCase() !== id.toUpperCase());
    saveDB();

    try {
      await Coupon.findOneAndDelete({ code: coupon.code });
    } catch (mErr) {}

    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete coupon',
      error: error.message,
    });
  }
};

/**
 * Validate and Apply Coupon
 * @route POST /api/coupons/apply
 */
const applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount = 0 } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    ensureCouponsSeeded();
    const db = getDB();
    const cleanCode = String(code).trim().toUpperCase();
    const coupon = (db.coupons || []).find((c) => c.code.toUpperCase() === cleanCode && c.isActive !== false);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: `Invalid or expired coupon code "${cleanCode}".`,
      });
    }

    const subtotal = Number(orderAmount) || 0;
    if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${coupon.code}" requires minimum order of ₹${coupon.minOrderAmount}. Current subtotal is ₹${subtotal}.`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount > 0) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = Math.min(subtotal, Number(coupon.discountValue) || 0);
    }

    return res.status(200).json({
      success: true,
      message: `🎉 Coupon "${coupon.code}" applied! You save ₹${discount}.`,
      coupon: {
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
      },
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply coupon',
      error: error.message,
    });
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  DEFAULT_COUPONS,
};
