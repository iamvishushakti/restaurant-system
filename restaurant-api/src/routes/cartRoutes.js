const express = require('express');
const router = express.Router();
const { getCart, syncCart, clearCart } = require('../controllers/cartController');

router.get('/', getCart);
router.post('/sync', syncCart);
router.delete('/clear', clearCart);

module.exports = router;
