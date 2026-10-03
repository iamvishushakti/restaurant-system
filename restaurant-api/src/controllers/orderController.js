const { getDB, saveDB } = require('../config/database');
const redis = require('../config/redis');
const { broadcastEvent } = require('../services/socketService');
const { notifyOrderPlacedForTable } = require('../services/tableSessionService');
const { Order } = require('../models');

/**
 * Place Kitchen / Table Order
 * @route POST /api/orders/place
 */
const placeOrder = async (req, res) => {
  try {
    const {
      tableNo = '4',
      items = [],
      totalCount = 0,
      totalAmount = 0,
      specialNote = '',
      customerEmail = '',
      customerName = '',
      prepMinutes = 15,
      assignedChefs = ['Chef Mario', 'Chef Luigi'],
      chefLabel = 'Gourmet Kitchen Brigade',
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items cannot be empty' });
    }

    const db = getDB();
    let resolvedName = customerName;
    if (customerEmail && !resolvedName) {
      const u = (db.users || []).find((usr) => usr.email?.toLowerCase() === customerEmail.toLowerCase());
      if (u && u.name) resolvedName = u.name;
    }

    const roundNumber = (db.orders || []).filter((o) => o.tableNo === tableNo).length + 1;
    const orderId = `PRESS-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    const newOrder = {
      orderId,
      roundNumber,
      tableNo: String(tableNo),
      items,
      totalCount,
      totalAmount: Number(totalAmount) || 0,
      specialNote,
      customerEmail: customerEmail || '',
      customerName: resolvedName || '',
      prepMinutes: Number(prepMinutes) || 15,
      assignedChefs,
      chefLabel,
      orderedAt: now.toISOString(),
      readyAt: new Date(now.getTime() + (Number(prepMinutes) || 15) * 60000).toISOString(),
      status: 'Pending',
      paymentStatus: 'UNPAID',
    };

    // 1. Save to Persistent DB
    db.orders = db.orders || [];
    db.orders.unshift(newOrder);
    saveDB();

    // 2. Save to Mongoose MongoDB
    try {
      await Order.create(newOrder);
    } catch (mErr) {}

    // 3. Cache in Redis
    try {
      await redis.hset('orders:active', orderId, JSON.stringify(newOrder));
    } catch (rErr) {}

    // 4. Clear customer cart in Redis once order is placed
    try {
      const cartId = customerEmail ? `user_${customerEmail}` : `table_${tableNo}`;
      await redis.del(`cart:${cartId}`);
      await redis.srem('sync:pending_carts', `cart:${cartId}`);
    } catch (e) {}

    // 5. Update Table Session (marks table ordered and cooking)
    try {
      notifyOrderPlacedForTable(tableNo);
    } catch (e) {}

    // 6. Real-time WebSocket Broadcast to KDS, Manager & Waiters
    broadcastEvent('new_kitchen_order', {
      ...newOrder,
      sound: 'order_incoming_chime',
      alertMessage: `🔔 NEW ORDER for Table #${tableNo} (${totalCount} dishes)`,
    });

    console.log(`🛎️ [Order Placed]: Order ${orderId} in Mongoose + Redis for Table ${tableNo} (Total: ₹${totalAmount})`);

    return res.status(201).json({
      success: true,
      message: 'Order dispatched to kitchen brigade!',
      order: newOrder,
    });
  } catch (error) {
    console.error('❌ [Place Order Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: error.message,
    });
  }
};

/**
 * Get All Active / Kitchen Orders
 * @route GET /api/orders
 */
const getOrders = async (req, res) => {
  try {
    const tableNo = req.query.tableNo;
    const status = req.query.status;

    const db = getDB();
    let ordersList = [...(db.orders || [])];

    if (tableNo) {
      ordersList = ordersList.filter((o) => o.tableNo === String(tableNo));
    }
    if (status) {
      ordersList = ordersList.filter((o) => o.status === status);
    }

    return res.status(200).json({
      success: true,
      count: ordersList.length,
      orders: ordersList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: error.message,
    });
  }
};

/**
 * Update Order Status (Chef Kitchen Display System)
 * @route PUT /api/orders/:orderId/status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, chefName = 'Master Chef' } = req.body;

    const db = getDB();
    const orderIndex = (db.orders || []).findIndex((o) => o.orderId === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = db.orders[orderIndex];
    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.chefName = chefName;

    if (status === 'In Preparation') {
      order.prepStartedAt = new Date().toISOString();
    } else if (status === 'Ready to Serve') {
      order.readyAt = new Date().toISOString();
    } else if (status === 'Completed') {
      order.completedAt = new Date().toISOString();
      try {
        await redis.hdel('orders:active', orderId);
      } catch (e) {}
    }

    saveDB();

    // Update in Mongoose
    try {
      await Order.findOneAndUpdate(
        { orderId },
        { ...order, updatedAt: new Date() },
        { upsert: true }
      );
    } catch (mErr) {}

    // Update Redis hash
    if (status !== 'Completed') {
      try {
        await redis.hset('orders:active', orderId, JSON.stringify(order));
      } catch (e) {}
    }

    // Broadcast Real-time event to clients & staff
    broadcastEvent('order_status_changed', {
      ...order,
      sound: status === 'Ready to Serve' ? 'food_ready_chime' : 'status_tick',
      alertMessage:
        status === 'Ready to Serve'
          ? `🍲 DISH READY: Table #${order.tableNo} order is prepared and ready to serve!`
          : `👨‍🍳 Order #${order.orderId} status is now: ${status}`,
    });

    // If Food is Cooked & Ready, alert Waiter Station immediately
    if (status === 'Ready to Serve') {
      const waiterAlertPayload = {
        callId: `ready_${order.orderId}`,
        tableNo: String(order.tableNo),
        requestType: 'food_ready',
        requestLabel: `🍲 ORDER #${order.orderId} COOKED & READY!`,
        note: `Kitchen has cooked all dishes. Waiter please serve to Table #${order.tableNo}.`,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      };

      // Add to waiterCalls in DB
      db.waiterCalls = db.waiterCalls || [];
      db.waiterCalls.unshift(waiterAlertPayload);
      saveDB();

      broadcastEvent('waiter_alert', waiterAlertPayload);
    }

    console.log(`👨‍🍳 [Order Status Updated]: ${orderId} -> ${status} in Mongoose by ${chefName}`);

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

module.exports = {
  placeOrder,
  getOrders,
  updateOrderStatus,
};
