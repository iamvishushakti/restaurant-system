const http = require('http');
const dotenv = require('dotenv');

// 1. Load environment variables first
dotenv.config();

const app = require('./app');
const redis = require('./config/redis');
const { connectDB } = require('./config/database');
const { initSocket } = require('./services/socketService');
const { initBulkSyncEngine } = require('./services/bulkSyncService');
const { startTableInactivityMonitor } = require('./services/tableSessionService');

const PORT = process.env.PORT || 5000;

// Create HTTP server for Express + WebSocket
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Redis health check function
const checkServices = async () => {
  // Connect Mongoose to MongoDB
  await connectDB();

  try {
    const response = await redis.ping();
    if (response === 'PONG') {
      console.log('✅ [Redis Status]: Redis is connected and ACTIVE! (PONG received)');
    }
  } catch (error) {
    console.error('❌ [Redis Status]: Redis is NOT reachable. Please check if Redis server is running.');
    console.error(`   Details: ${error.message}`);
  }
};

// Start Express Server
server.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`📰 [Chronicle Server]: Restaurant API is running on http://localhost:${PORT}`);
  console.log(`🍃 [Database]: Mongoose MongoDB Integration Active`);
  console.log(`📡 [Environment]: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ [WebSocket]: Real-time Socket.io active on ws://localhost:${PORT}`);
  console.log(`⏳ [Bulk Sync]: 5-Minute batch sync to persistent Database active`);
  console.log(`💰 [Rewards]: 10% Payment Cashback & 20% DOB/Anniversary discount enabled`);
  console.log(`======================================================\n`);

  // Check Redis & Mongoose health immediately on startup
  await checkServices();

  // Start 5-Minute Automated Bulk Sync Engine
  initBulkSyncEngine();

  // Start 5-Minute Proactive Table Inactivity & Water Service Bell Engine
  startTableInactivityMonitor();
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 [Server]: Shutting down gracefully...');
  try {
    await redis.quit();
    console.log('🔴 [Redis]: Disconnected cleanly.');
  } catch (err) {
    console.error('Error disconnecting Redis:', err.message);
  }

  server.close(() => {
    console.log('✅ [Server]: Closed.');
    process.exit(0);
  });
});
