const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const billingRoutes = require('./routes/billingRoutes');
const waiterRoutes = require('./routes/waiterRoutes');
const systemRoutes = require('./routes/systemRoutes');
const staffRoutes = require('./routes/staffRoutes');
const tableRoutes = require('./routes/tableRoutes');
const couponRoutes = require('./routes/couponRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check / welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🗞️ The Daily Culinary Chronicle - Restaurant System API',
    version: '2.0.0',
    features: [
      'Staff Authentication & Multi-Role Login System',
      'Redis 5-Minute Bulk Database Persistence',
      'Real-time WebSocket Kitchen & Waiter Bell Alert System',
      '10% Payment Cashback & Wallet Loyalty System',
      '20% Birthday & Anniversary Special Discount Engine',
      'Cashier Billing Machine & Staff Profile Override',
      'Restaurant Geofence & Dining Zone Verification',
      'Live Table Check-In & 5-Minute Proactive Water Service Monitor',
      'Dynamic Coupon Management & 10%/20% Permanent Offers',
    ],
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/user', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/waiter', waiterRoutes);
app.use('/api/system', systemRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found - ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
