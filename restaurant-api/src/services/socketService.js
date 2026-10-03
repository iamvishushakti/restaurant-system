const { Server } = require('socket.io');
const { getDB, saveDB } = require('../config/database');
const redis = require('../config/redis');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`⚡ [WebSocket]: Client connected (${socket.id})`);

    // 1. Join specific room (e.g. 'staff', 'kitchen', 'cashier', 'table_4')
    socket.on('join_room', (roomName) => {
      socket.join(roomName);
      console.log(`🚪 [WebSocket]: Socket ${socket.id} joined room [${roomName}]`);
    });

    // 2. Customer calls Waiter (Water, Cutlery, Bill, Help, etc.)
    socket.on('call_waiter', async (payload) => {
      try {
        const { tableNo = '4', requestType = 'help', requestLabel = 'General Assistance', note = '', customerEmail = '' } = payload;
        const callId = `CALL-${Date.now()}`;
        const callRecord = {
          callId,
          tableNo,
          requestType,
          requestLabel,
          note,
          customerEmail,
          status: 'PENDING', // PENDING, ATTENDING, RESOLVED
          createdAt: new Date().toISOString(),
        };

        // Save to DB and Redis
        const db = getDB();
        db.waiterCalls = db.waiterCalls || [];
        db.waiterCalls.unshift(callRecord);
        if (db.waiterCalls.length > 100) db.waiterCalls = db.waiterCalls.slice(0, 100);
        saveDB();

        try {
          await redis.lpush('waiter_calls:recent', JSON.stringify(callRecord));
          await redis.ltrim('waiter_calls:recent', 0, 49);
        } catch (rErr) {
          // Non-blocking
        }

        console.log(`🛎️ [Waiter Bell Ringing!]: Table ${tableNo} requested [${requestLabel}]`);

        // Broadcast to all staff, waiters, cashiers, and managers
        io.emit('waiter_alert', {
          ...callRecord,
          sound: 'bell_ring',
          alertMessage: `🔔 TABLE ${tableNo}: ${requestLabel}`,
        });

        // Acknowledge back to sender
        socket.emit('call_waiter_ack', {
          success: true,
          callId,
          message: `Waiter alert successfully dispatched for Table ${tableNo}`,
        });
      } catch (err) {
        console.error('Error handling call_waiter:', err);
      }
    });

    // 3. Waiter / Staff acknowledges or resolves call
    socket.on('update_call_status', (payload) => {
      try {
        const { callId, status, staffName = 'Floor Server' } = payload;
        const db = getDB();
        const call = (db.waiterCalls || []).find(c => c.callId === callId);
        if (call) {
          call.status = status;
          call.handledBy = staffName;
          call.updatedAt = new Date().toISOString();
          saveDB();

          io.emit('waiter_call_updated', call);
          console.log(`✅ [Waiter Call Updated]: ${callId} -> ${status} by ${staffName}`);
        }
      } catch (err) {
        console.error('Error updating call status:', err);
      }
    });

    // 4. Kitchen Order Status updates (In Preparation, Ready to Serve, Completed)
    socket.on('update_order_status', (payload) => {
      try {
        const { orderId, status, chefName = 'Master Chef', tableNo } = payload;
        const db = getDB();
        const order = (db.orders || []).find(o => o.orderId === orderId);
        if (order) {
          order.status = status;
          order.updatedAt = new Date().toISOString();
          if (status === 'In Preparation') {
            order.prepStartedAt = new Date().toISOString();
          } else if (status === 'Ready to Serve') {
            order.readyAt = new Date().toISOString();
          }
          saveDB();

          // Broadcast to kitchen, waiter, and customer table
          io.emit('order_status_changed', {
            ...order,
            chefName,
            sound: status === 'Ready to Serve' ? 'food_ready_chime' : null,
          });

          console.log(`👨‍🍳 [KDS Status]: Order ${orderId} is now [${status}] (Chef: ${chefName})`);
        }
      } catch (err) {
        console.error('Error updating order status:', err);
      }
    });

    // 5. Real-time Customer Profile update
    socket.on('client_profile_updated', (userData) => {
      io.emit('patron_profile_refreshed', userData);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [WebSocket]: Client disconnected (${socket.id})`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

const broadcastEvent = (eventName, data) => {
  if (io) {
    io.emit(eventName, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  broadcastEvent,
};
