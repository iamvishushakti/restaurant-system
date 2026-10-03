const express = require('express');
const router = express.Router();
const { placeOrder, getOrders, updateOrderStatus } = require('../controllers/orderController');

router.post('/place', placeOrder);
router.get('/', getOrders);
router.put('/:orderId/status', updateOrderStatus);

module.exports = router;
