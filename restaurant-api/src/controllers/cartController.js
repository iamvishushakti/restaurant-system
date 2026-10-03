const redis = require('../config/redis');

/**
 * Get Cart for Table or Patron directly from Redis
 * @route GET /api/cart
 */
const getCart = async (req, res) => {
  try {
    const tableNo = req.query.tableNo || '4';
    const email = req.query.email || '';
    const cartId = email ? `user_${email.toLowerCase().trim()}` : `table_${tableNo}`;
    const redisKey = `cart:${cartId}`;

    let cart = null;

    try {
      const raw = await redis.get(redisKey);
      if (raw) cart = JSON.parse(raw);
    } catch (err) {
      console.warn('Redis cart fetch note:', err.message);
    }

    return res.status(200).json({
      success: true,
      cartId,
      cart: cart?.items || cart || {},
      tableNo,
      storedIn: 'Redis Fast In-Memory Cache',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: error.message,
    });
  }
};

/**
 * Sync / Save Cart directly to Redis with TTL
 * @route POST /api/cart/sync
 */
const syncCart = async (req, res) => {
  try {
    const { tableNo = '4', email = '', items = {}, totalCount = 0, totalAmount = 0 } = req.body;
    const cartId = email ? `user_${email.toLowerCase().trim()}` : `table_${tableNo}`;
    const redisKey = `cart:${cartId}`;

    const cartPayload = {
      cartId,
      tableNo,
      email,
      items,
      totalCount,
      totalAmount,
      updatedAt: new Date().toISOString(),
    };

    // Store in Redis with 2-hour TTL (7200 seconds)
    try {
      await redis.set(redisKey, JSON.stringify(cartPayload), 'EX', 7200);
    } catch (err) {
      console.warn('Redis cart save note:', err.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Cart synced to Redis in-memory store',
      cartId,
      itemsCount: totalCount,
      totalAmount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to sync cart',
      error: error.message,
    });
  }
};

/**
 * Clear Cart from Redis
 * @route DELETE /api/cart/clear
 */
const clearCart = async (req, res) => {
  try {
    const tableNo = req.query.tableNo || req.body.tableNo || '4';
    const email = req.query.email || req.body.email || '';
    const cartId = email ? `user_${email.toLowerCase().trim()}` : `table_${tableNo}`;
    const redisKey = `cart:${cartId}`;

    try {
      await redis.del(redisKey);
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully from Redis',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  syncCart,
  clearCart,
};

