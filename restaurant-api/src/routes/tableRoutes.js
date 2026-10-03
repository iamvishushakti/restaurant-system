const express = require('express');
const router = express.Router();
const {
  checkIn,
  markWaterAttended,
  getTableStatus,
  clearTable,
} = require('../controllers/tableController');

router.post('/checkin', checkIn);
router.post('/attend-water/:tableNo', markWaterAttended);
router.get('/status', getTableStatus);
router.post('/clear/:tableNo', clearTable);

module.exports = router;
