const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../controllers/authController');
const { getUserProfile, updateUserProfile, staffOverrideProfile } = require('../controllers/userController');

// Route: Send OTP to email (/api/user/send-otp)
router.post('/send-otp', sendOtp);

// Route: Verify OTP from Redis (/api/user/verify-otp)
router.post('/verify-otp', verifyOtp);

// Route: Get current user profile (/api/user/profile)
router.get('/profile', getUserProfile);

// Route: Update profile (Client self-service: 1-time DOB & Anniversary lock rule)
router.put('/update-profile', updateUserProfile);

// Route: Staff Billing Counter Override (Can override locked DOB & Anniversary)
router.post('/staff-override', staffOverrideProfile);

module.exports = router;
