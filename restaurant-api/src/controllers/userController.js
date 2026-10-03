const { getDB, saveDB } = require('../config/database');
const redis = require('../config/redis');
const { broadcastEvent } = require('../services/socketService');
const { User } = require('../models');

/**
 * Helper to check if a date matches today (Month and Day match)
 * @param {string} dateString 'YYYY-MM-DD'
 */
const isSpecialDateToday = (dateString) => {
  if (!dateString) return false;
  try {
    const target = new Date(dateString);
    if (isNaN(target.getTime())) return false;
    const today = new Date();
    return target.getUTCDate() === today.getUTCDate() && target.getUTCMonth() === today.getUTCMonth();
  } catch (e) {
    return false;
  }
};

/**
 * Get User Profile by Email or Session
 * @route GET /api/user/profile
 */
const getUserProfile = async (req, res) => {
  try {
    const email = (req.query.email || req.headers['x-user-email'] || 'vkshakti.office@gmail.com').toLowerCase().trim();
    const redisKey = `user:${email}`;

    // 1. Try Redis cache first
    let cachedUser = null;
    try {
      const raw = await redis.get(redisKey);
      if (raw) cachedUser = JSON.parse(raw);
    } catch (rErr) {}

    // 2. Try Mongoose MongoDB
    let mongoUser = null;
    try {
      mongoUser = await User.findOne({ email }).lean();
    } catch (mErr) {}

    const db = getDB();
    let user = cachedUser || mongoUser || db.users.find((u) => u.email.toLowerCase() === email);

    if (!user) {
      // Create new patron profile if not existing
      user = {
        id: `usr_${Date.now()}`,
        email,
        name: email.split('@')[0],
        phone: '',
        dob: '',
        anniversaryDate: '',
        dobLocked: false,
        anniversaryLocked: false,
        walletBalance: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(user);
      saveDB();

      try {
        await User.create(user);
      } catch (e) {}
    }

    // Check Birthday & Anniversary special status
    const isBirthdayToday = isSpecialDateToday(user.dob);
    const isAnniversaryToday = isSpecialDateToday(user.anniversaryDate);
    const discountPercent = (isBirthdayToday || isAnniversaryToday) ? 20 : 0;
    let discountReason = null;
    if (isBirthdayToday && isAnniversaryToday) {
      discountReason = 'Double Celebration: Birthday & Anniversary (20% OFF)';
    } else if (isBirthdayToday) {
      discountReason = 'Birthday Special Celebration (20% OFF)';
    } else if (isAnniversaryToday) {
      discountReason = 'Anniversary Special Celebration (20% OFF)';
    }

    const responseData = {
      ...user,
      isBirthdayToday,
      isAnniversaryToday,
      discountPercent,
      discountReason,
    };

    // Keep Redis cache fresh
    try {
      await redis.set(redisKey, JSON.stringify(responseData), 'EX', 86400);
    } catch (e) {}

    return res.status(200).json({
      success: true,
      user: responseData,
    });
  } catch (error) {
    console.error('❌ [Get Profile Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message,
    });
  }
};

/**
 * Update User Profile (Client Self-Service)
 * RULE: DOB & Anniversary can only be updated ONCE by the client. Once updated, they become locked.
 * Further edits can only be done from Billing Counter / Staff module.
 * @route PUT /api/user/update-profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const email = (req.body.email || req.headers['x-user-email'] || 'vkshakti.office@gmail.com').toLowerCase().trim();
    const { name, phone, dob, anniversaryDate } = req.body;

    const db = getDB();
    let userIndex = db.users.findIndex((u) => u.email.toLowerCase() === email);

    if (userIndex === -1) {
      const newUser = {
        id: `usr_${Date.now()}`,
        email,
        name: name || email.split('@')[0],
        phone: phone || '',
        dob: dob || '',
        anniversaryDate: anniversaryDate || '',
        dobLocked: !!dob,
        anniversaryLocked: !!anniversaryDate,
        walletBalance: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      userIndex = db.users.length - 1;
    }

    const currentRecord = db.users[userIndex];

    // Client Permission Validation: Check if DOB or Anniversary are locked
    let updatedDob = currentRecord.dob;
    let updatedDobLocked = currentRecord.dobLocked || false;

    if (dob !== undefined) {
      if (currentRecord.dobLocked && dob !== currentRecord.dob) {
        return res.status(403).json({
          success: false,
          message: 'Date of Birth is locked after initial registration. Please request front billing counter cashier to modify.',
          user: currentRecord,
        });
      }
      if (dob) {
        updatedDob = dob;
        updatedDobLocked = true; // Lock after first save
      }
    }

    let updatedAnniversary = currentRecord.anniversaryDate;
    let updatedAnniversaryLocked = currentRecord.anniversaryLocked || false;

    if (anniversaryDate !== undefined) {
      if (currentRecord.anniversaryLocked && anniversaryDate !== currentRecord.anniversaryDate) {
        return res.status(403).json({
          success: false,
          message: 'Anniversary Date is locked after initial registration. Please request front billing counter cashier to modify.',
          user: currentRecord,
        });
      }
      if (anniversaryDate) {
        updatedAnniversary = anniversaryDate;
        updatedAnniversaryLocked = true; // Lock after first save
      }
    }

    const updatedData = {
      name: name !== undefined ? name : currentRecord.name,
      phone: phone !== undefined ? phone : currentRecord.phone,
      dob: updatedDob,
      anniversaryDate: updatedAnniversary,
      dobLocked: updatedDobLocked,
      anniversaryLocked: updatedAnniversaryLocked,
      updatedAt: new Date().toISOString(),
    };

    // Apply updates to DB
    db.users[userIndex] = {
      ...currentRecord,
      ...updatedData,
    };
    saveDB();

    // Apply updates to Mongoose MongoDB
    try {
      await User.findOneAndUpdate(
        { email },
        { ...updatedData, email },
        { upsert: true, new: true }
      );
    } catch (mErr) {}

    const updatedUser = db.users[userIndex];
    const isBirthdayToday = isSpecialDateToday(updatedUser.dob);
    const isAnniversaryToday = isSpecialDateToday(updatedUser.anniversaryDate);
    const discountPercent = (isBirthdayToday || isAnniversaryToday) ? 20 : 0;

    const responsePayload = {
      ...updatedUser,
      isBirthdayToday,
      isAnniversaryToday,
      discountPercent,
    };

    // Update Redis cache immediately
    try {
      await redis.set(`user:${email}`, JSON.stringify(responsePayload), 'EX', 86400);
    } catch (e) {}

    // Broadcast update via WebSocket
    broadcastEvent('patron_profile_refreshed', responsePayload);

    console.log(`👤 [Profile Updated]: ${email} in Mongoose + Redis (DOB locked: ${updatedDobLocked}, Anniv locked: ${updatedAnniversaryLocked})`);

    return res.status(200).json({
      success: true,
      message: 'Profile successfully updated',
      user: responsePayload,
    });
  } catch (error) {
    console.error('❌ [Update Profile Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

/**
 * Staff Billing Counter Machine Override for Patron Profile
 * Staff can modify any field (including unlocked/locked DOB and Anniversary)
 * @route POST /api/user/staff-override
 */
const staffOverrideProfile = async (req, res) => {
  try {
    const { email, name, phone, dob, anniversaryDate, unlockFields = false } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Patron email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDB();
    let userIndex = db.users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

    if (userIndex === -1) {
      const newUser = {
        id: `usr_${Date.now()}`,
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        phone: phone || '',
        dob: dob || '',
        anniversaryDate: anniversaryDate || '',
        dobLocked: !unlockFields,
        anniversaryLocked: !unlockFields,
        walletBalance: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      userIndex = db.users.length - 1;
    }

    const currentRecord = db.users[userIndex];

    const overrideData = {
      name: name !== undefined ? name : currentRecord.name,
      phone: phone !== undefined ? phone : currentRecord.phone,
      dob: dob !== undefined ? dob : currentRecord.dob,
      anniversaryDate: anniversaryDate !== undefined ? anniversaryDate : currentRecord.anniversaryDate,
      dobLocked: unlockFields ? false : (dob ? true : currentRecord.dobLocked),
      anniversaryLocked: unlockFields ? false : (anniversaryDate ? true : currentRecord.anniversaryLocked),
      updatedAt: new Date().toISOString(),
    };

    db.users[userIndex] = {
      ...currentRecord,
      ...overrideData,
    };
    saveDB();

    // Update in Mongoose
    try {
      await User.findOneAndUpdate(
        { email: normalizedEmail },
        { ...overrideData, email: normalizedEmail },
        { upsert: true, new: true }
      );
    } catch (mErr) {}

    const updatedUser = db.users[userIndex];
    const isBirthdayToday = isSpecialDateToday(updatedUser.dob);
    const isAnniversaryToday = isSpecialDateToday(updatedUser.anniversaryDate);

    const responsePayload = {
      ...updatedUser,
      isBirthdayToday,
      isAnniversaryToday,
      discountPercent: (isBirthdayToday || isAnniversaryToday) ? 20 : 0,
    };

    try {
      await redis.set(`user:${normalizedEmail}`, JSON.stringify(responsePayload), 'EX', 86400);
    } catch (e) {}

    // Broadcast update via WebSocket
    broadcastEvent('patron_profile_refreshed', responsePayload);

    console.log(`💼 [Staff Profile Override]: Updated patron ${normalizedEmail} in Mongoose + Redis from Billing Counter`);

    return res.status(200).json({
      success: true,
      message: 'Patron dossier successfully updated by Billing Counter',
      user: responsePayload,
    });
  } catch (error) {
    console.error('❌ [Staff Override Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to override patron profile',
      error: error.message,
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  staffOverrideProfile,
  isSpecialDateToday,
};
