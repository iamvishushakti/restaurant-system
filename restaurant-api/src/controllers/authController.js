const redis = require('../config/redis');
const generateOtp = require('../utils/generateOtp');
const { sendOtpEmail } = require('../services/emailService');

const OTP_EXPIRY = Number(process.env.OTP_EXPIRY_SECONDS) || 300; // 5 minutes in seconds

/**
 * @desc    Send OTP to email (Checks if OTP already exists in Redis, re-sends same OTP if present, else generates new)
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email format (e.g. user@example.com)',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const redisKey = `otp:${normalizedEmail}`;

    // 2. Check if OTP already exists in Redis
    let otp = await redis.get(redisKey);
    let remainingTtl = 0;

    if (otp) {
      // Pehle se OTP present hai, remaining time check karte hain
      remainingTtl = await redis.ttl(redisKey);
      console.log(`ℹ️ [Redis]: Existing OTP found for ${normalizedEmail} (Expires in ${remainingTtl}s). Resending...`);
    } else {
      // Naya OTP generate karte hain
      otp = generateOtp();
      // Redis me store karte hain with Expiry time (EX)
      await redis.set(redisKey, otp, 'EX', OTP_EXPIRY);
      remainingTtl = OTP_EXPIRY;
      console.log(`🆕 [Redis]: New OTP generated and stored in Redis for ${normalizedEmail}`);
    }

    // 3. User ke email par OTP bhejte hain
    const emailResult = await sendOtpEmail(normalizedEmail, otp);

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${normalizedEmail}`,
      data: {
        email: normalizedEmail,
        expiresInSeconds: remainingTtl,
        emailDelivered: emailResult.success,
      },
    });
  } catch (error) {
    console.error('❌ [Send OTP Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error while sending OTP',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify OTP from Redis
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // 1. Validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and otp',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const redisKey = `otp:${normalizedEmail}`;

    // 2. Fetch OTP from Redis
    const storedOtp = await redis.get(redisKey);

    // 3. Check if OTP exists or expired
    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired or does not exist. Please request a new OTP.',
      });
    }

    // 4. Match OTP
    if (storedOtp !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check the code and try again.',
      });
    }

    // 5. Successful verification -> Delete OTP from Redis so it cannot be used again
    await redis.del(redisKey);
    console.log(`✅ [Redis]: OTP verified and deleted for ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! 🎉',
      data: {
        email: normalizedEmail,
        isVerified: true,
        name: "Vishal Kumar",
        mobile: "8956367864",
        dob: "2006-12-25",
        anniversaryDate: "2024-11-11",

      },
    });
  } catch (error) {
    console.error('❌ [Verify OTP Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error while verifying OTP',
      error: error.message,
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};
