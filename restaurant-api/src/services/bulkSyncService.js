const redis = require('../config/redis');
const { getDB, saveDB } = require('../config/database');
const { Order, User, Bill } = require('../models');

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
let lastSyncTimestamp = new Date().toISOString();
let syncTimer = null;
let syncCounter = 0;
let isSyncing = false;

/**
 * Flush active states into persistent Database in bulk (Mongoose + DB)
 */
const executeBulkSync = async (triggeredBy = 'AUTO_CRON') => {
  if (isSyncing) {
    return { success: false, message: 'Sync already in progress' };
  }

  isSyncing = true;
  const startTime = Date.now();
  syncCounter += 1;
  console.log(`\n🔄 [Bulk Sync #${syncCounter}]: Starting 5-Minute Bulk Sync [Trigger: ${triggeredBy}]...`);

  try {
    const db = getDB();
    let syncedOrdersCount = 0;

    // 1. Fetch pending orders from Redis hash `orders:active`
    try {
      const activeOrderEntries = await redis.hgetall('orders:active');
      if (activeOrderEntries) {
        for (const [orderId, orderJson] of Object.entries(activeOrderEntries)) {
          try {
            const orderData = JSON.parse(orderJson);
            const existingIdx = db.orders.findIndex(o => o.orderId === orderId);
            if (existingIdx >= 0) {
              db.orders[existingIdx] = { ...db.orders[existingIdx], ...orderData, updatedAt: new Date().toISOString() };
            } else {
              db.orders.push(orderData);
            }

            // Persist to Mongoose Order collection if Mongo is reachable
            try {
              await Order.findOneAndUpdate(
                { orderId },
                { ...orderData, updatedAt: new Date() },
                { upsert: true, new: true }
              );
            } catch (moErr) {}

            syncedOrdersCount += 1;
          } catch (e) {
            console.error(`Error parsing order ${orderId}:`, e.message);
          }
        }
      }
    } catch (orderErr) {
      console.warn('⚠️ [Bulk Sync]: Error syncing active orders from Redis:', orderErr.message);
    }

    // 2. Update sync timestamps
    lastSyncTimestamp = new Date().toISOString();
    db.lastBulkSyncAt = lastSyncTimestamp;

    // 3. Save to persistent file
    saveDB();

    const duration = Date.now() - startTime;
    console.log(`✅ [Bulk Sync #${syncCounter}]: Completed in ${duration}ms (Mongoose + DB) | Orders: ${syncedOrdersCount}`);

    return {
      success: true,
      syncCount: syncCounter,
      durationMs: duration,
      syncedOrdersCount,
      lastSyncAt: lastSyncTimestamp,
    };
  } catch (error) {
    console.error(`❌ [Bulk Sync #${syncCounter}]: Error during bulk sync:`, error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    isSyncing = false;
  }
};

/**
 * Initialize 5-minute interval timer for automated bulk sync
 */
const initBulkSyncEngine = () => {
  if (syncTimer) clearInterval(syncTimer);

  console.log(`⏰ [Bulk Sync Engine]: Initialized (Schedule: Every 5 minutes / ${SYNC_INTERVAL_MS / 1000}s)`);

  syncTimer = setInterval(() => {
    executeBulkSync('AUTO_5MIN_INTERVAL');
  }, SYNC_INTERVAL_MS);

  // Initial dry run sync on startup
  setTimeout(() => {
    executeBulkSync('STARTUP_INITIAL_SYNC');
  }, 3000);
};

const getSyncStatus = () => {
  return {
    intervalSeconds: SYNC_INTERVAL_MS / 1000,
    lastSyncAt: lastSyncTimestamp,
    syncCount: syncCounter,
    isSyncing,
    nextSyncInSeconds: Math.max(0, Math.round((SYNC_INTERVAL_MS - (Date.now() - new Date(lastSyncTimestamp).getTime())) / 1000)),
  };
};

module.exports = {
  initBulkSyncEngine,
  executeBulkSync,
  getSyncStatus,
};
