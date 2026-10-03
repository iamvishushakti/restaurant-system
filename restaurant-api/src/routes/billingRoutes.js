const express = require('express');
const router = express.Router();
const { getTableBill, processPayment, getBillingHistory } = require('../controllers/billingController');

router.get('/table/:tableNo', getTableBill);
router.post('/pay', processPayment);
router.get('/history', getBillingHistory);

module.exports = router;
