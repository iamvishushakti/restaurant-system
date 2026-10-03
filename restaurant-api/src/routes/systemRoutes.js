const express = require('express');
const router = express.Router();
const {
  verifyLocation,
  getSyncTelemetry,
  forceSync,
  getDevicePasscode,
  verifyDevicePasscode,
  updateDevicePasscode,
} = require('../controllers/systemController');

router.post('/verify-location', verifyLocation);
router.get('/sync-status', getSyncTelemetry);
router.post('/force-sync', forceSync);
router.get('/device-passcode', getDevicePasscode);
router.post('/verify-device-passcode', verifyDevicePasscode);
router.put('/device-passcode', updateDevicePasscode);

module.exports = router;

