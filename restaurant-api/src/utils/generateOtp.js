/**
 * Generate a 6-digit numeric OTP code as string
 * @returns {string} e.g. "582914"
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = generateOtp;
