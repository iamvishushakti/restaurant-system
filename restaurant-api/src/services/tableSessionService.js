const { getDB, saveDB } = require('../config/database');
const redis = require('../config/redis');
const { broadcastEvent } = require('./socketService');

const TABLES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const WATER_ALERT_THRESHOLD_MS = 5 * 60 * 1000; // 5 Minutes (300,000ms)

/**
 * Check-in / Seat a customer at a table (Upon login or table assignment)
 */
const checkInTable = async ({ tableNo = '4', customerEmail = '', customerName = '', customerPhone = '' }) => {
  const tStr = String(tableNo);
  const db = getDB();
  db.tableSessions = db.tableSessions || {};

  const existingSession = db.tableSessions[tStr];
  const now = new Date().toISOString();

  // Find active orders for this table
  const tableOrders = (db.orders || []).filter(
    (o) => String(o.tableNo) === tStr && o.paymentStatus !== 'PAID'
  );
  const hasOrdered = tableOrders.length > 0;
  const isCooking = tableOrders.some((o) => o.status === 'In Preparation' || o.status === 'Pending');
  const isReady = tableOrders.some((o) => o.status === 'Ready to Serve');

  let orderStatus = 'NONE';
  if (isReady) orderStatus = 'READY_TO_SERVE';
  else if (isCooking) orderStatus = 'IN_PREPARATION';
  else if (hasOrdered) orderStatus = 'ORDERED';

  let finalName = customerName || existingSession?.customerName;
  let finalPhone = customerPhone || existingSession?.customerPhone;

  if (customerEmail) {
    const existingUser = (db.users || []).find((u) => u.email.toLowerCase() === customerEmail.toLowerCase().trim());
    if (existingUser) {
      if (!finalName || finalName === 'Seated Guest' || finalName === 'Patron') finalName = existingUser.name || finalName;
      if (!finalPhone) finalPhone = existingUser.phone || finalPhone;
    }
  }

  if (!finalName) {
    finalName = customerEmail ? customerEmail.split('@')[0] : 'Seated Guest';
  }

  const session = {
    tableNo: tStr,
    isOccupied: true,
    customerEmail: customerEmail || existingSession?.customerEmail || '',
    customerName: finalName,
    customerPhone: finalPhone || '',
    seatedAt: existingSession?.seatedAt || now,
    lastActivityAt: now,
    hasOrdered,
    orderStatus,
    orderCount: tableOrders.length,
    waterAlertSent: existingSession?.waterAlertSent || false,
    isWaterAttended: existingSession?.isWaterAttended || false,
    waterAttendedBy: existingSession?.waterAttendedBy || '',
    attendedAt: existingSession?.attendedAt || null,
  };

  db.tableSessions[tStr] = session;
  saveDB();

  // Store in Redis
  try {
    await redis.set(`table_session:${tStr}`, JSON.stringify(session), 'EX', 86400);
  } catch (e) {}

  console.log(`🪑 [Table Check-In]: Table #${tStr} is now OCCUPIED by ${session.customerName} at ${session.seatedAt}`);

  // Broadcast to all staff consoles
  broadcastEvent('table_session_updated', {
    tableNo: tStr,
    session,
    allSessions: getComputedTableStatus(),
  });

  return session;
};

/**
 * Mark water alert / waiter assistance attended for a table
 */
const attendWaterAlert = (tableNo, staffName = 'Floor Server') => {
  const tStr = String(tableNo);
  const db = getDB();
  db.tableSessions = db.tableSessions || {};

  if (!db.tableSessions[tStr]) {
    db.tableSessions[tStr] = {
      tableNo: tStr,
      isOccupied: true,
      seatedAt: new Date().toISOString(),
    };
  }

  const session = db.tableSessions[tStr];
  session.isWaterAttended = true;
  session.waterAttendedBy = staffName;
  session.attendedAt = new Date().toISOString();
  session.waterAlertSent = true; // Prevents re-triggering

  // Also mark all pending waiter calls for this table as ATTENDING or RESOLVED
  if (db.waiterCalls && Array.isArray(db.waiterCalls)) {
    db.waiterCalls.forEach((c) => {
      if (String(c.tableNo) === tStr && c.status === 'PENDING') {
        c.status = 'ATTENDING';
        c.handledBy = staffName;
        c.updatedAt = new Date().toISOString();
      }
    });
  }

  saveDB();

  try {
    redis.set(`table_session:${tStr}`, JSON.stringify(session), 'EX', 86400);
  } catch (e) {}

  console.log(`💧 [Water Alert Attended]: Table #${tStr} marked as ATTENDED by ${staffName}`);

  broadcastEvent('table_session_updated', {
    tableNo: tStr,
    session,
    allSessions: getComputedTableStatus(),
  });

  return session;
};

/**
 * Update session state when an order is placed
 */
const notifyOrderPlacedForTable = (tableNo) => {
  const tStr = String(tableNo);
  const db = getDB();
  db.tableSessions = db.tableSessions || {};

  if (!db.tableSessions[tStr]) {
    db.tableSessions[tStr] = {
      tableNo: tStr,
      isOccupied: true,
      seatedAt: new Date().toISOString(),
      waterAlertSent: false,
    };
  }

  db.tableSessions[tStr].hasOrdered = true;
  db.tableSessions[tStr].isWaterAttended = true;
  db.tableSessions[tStr].orderStatus = 'IN_PREPARATION';
  db.tableSessions[tStr].lastActivityAt = new Date().toISOString();
  saveDB();

  broadcastEvent('table_session_updated', {
    tableNo: tStr,
    session: db.tableSessions[tStr],
    allSessions: getComputedTableStatus(),
  });
};

/**
 * Clear a table session (upon payment settlement or cashier manual clear)
 */
const clearTableSession = (tableNo) => {
  const tStr = String(tableNo);
  const db = getDB();
  if (db.tableSessions && db.tableSessions[tStr]) {
    delete db.tableSessions[tStr];
    saveDB();
  }

  try {
    redis.del(`table_session:${tStr}`);
  } catch (e) {}

  console.log(`🧹 [Table Cleared]: Table #${tStr} session cleared and available.`);

  broadcastEvent('table_session_updated', {
    tableNo: tStr,
    session: null,
    allSessions: getComputedTableStatus(),
  });
};

/**
 * Get computed status for all 12 tables
 */
const getComputedTableStatus = () => {
  const db = getDB();
  db.tableSessions = db.tableSessions || {};
  const now = Date.now();

  return TABLES.map((t) => {
    const session = db.tableSessions[t];
    const tableOrders = (db.orders || []).filter(
      (o) => String(o.tableNo) === String(t) && o.paymentStatus !== 'PAID'
    );

    const hasOrders = tableOrders.length > 0;
    const isReady = tableOrders.some((o) => o.status === 'Ready to Serve');
    const isCooking = tableOrders.some((o) => o.status === 'In Preparation' || o.status === 'Pending');
    const billTotal = tableOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const orderItemsCount = tableOrders.reduce((sum, o) => sum + (o.totalCount || o.items?.length || 1), 0);

    const isOccupied = Boolean(session?.isOccupied || hasOrders);
    const seatedAt = session?.seatedAt || (tableOrders[0]?.createdAt || (isOccupied ? new Date().toISOString() : null));

    let sittingMinutes = 0;
    if (seatedAt) {
      sittingMinutes = Math.max(0, Math.floor((now - new Date(seatedAt).getTime()) / 60000));
    }

    const hasOrdered = hasOrders || Boolean(session?.hasOrdered);
    const isWaterAttended = Boolean(session?.isWaterAttended);
    const isIdleOver5Min = isOccupied && !hasOrdered && sittingMinutes >= 5 && !isWaterAttended;

    let stage = 'AVAILABLE';
    if (isReady) stage = 'READY';
    else if (isCooking) stage = 'COOKING';
    else if (hasOrders) stage = 'ORDERED';
    else if (isIdleOver5Min) stage = 'IDLE_ALERT';
    else if (isWaterAttended && !hasOrdered) stage = 'WATER_ATTENDED';
    else if (isOccupied) stage = 'SEATED_IDLE';

    return {
      tableNo: t,
      isOccupied,
      stage, // 'AVAILABLE', 'SEATED_IDLE', 'WATER_ATTENDED', 'IDLE_ALERT', 'COOKING', 'READY', 'ORDERED'
      customerName: session?.customerName || tableOrders[0]?.customerName || (session?.customerEmail ? session.customerEmail.split('@')[0] : (isOccupied ? 'Guest' : '')),
      customerEmail: session?.customerEmail || tableOrders[0]?.customerEmail || '',
      customerPhone: session?.customerPhone || tableOrders[0]?.customerPhone || '',
      seatedAt,
      sittingMinutes,
      hasOrdered,
      isWaterAttended,
      waterAttendedBy: session?.waterAttendedBy || '',
      attendedAt: session?.attendedAt || null,
      orderCount: tableOrders.length,
      orderItemsCount,
      billTotal,
      waterAlertSent: Boolean(session?.waterAlertSent),
      isIdleOver5Min,
      tableOrders,
    };
  });
};

/**
 * Background Monitor: Checks for tables seated > 5 minutes without placing any order.
 * Dispatches an automatic proactive Water / Order Service Bell.
 */
let monitorInterval = null;

const startTableInactivityMonitor = () => {
  if (monitorInterval) return;

  console.log('💧 [Monitor]: Proactive 5-Minute Seated Table Inactivity & Water Bell Service started.');

  monitorInterval = setInterval(async () => {
    try {
      const db = getDB();
      db.tableSessions = db.tableSessions || {};
      const now = Date.now();

      for (const t of TABLES) {
        const session = db.tableSessions[t];
        if (!session || !session.isOccupied) continue;

        // If already ordered or water already attended, skip
        if (session.hasOrdered || session.isWaterAttended) continue;

        // Check if table has active orders
        const tableOrders = (db.orders || []).filter(
          (o) => String(o.tableNo) === String(t) && o.paymentStatus !== 'PAID'
        );

        if (tableOrders.length > 0) {
          session.hasOrdered = true;
          continue;
        }

        // Table is occupied but has NO order
        if (!session.hasOrdered && session.seatedAt) {
          const seatedTime = new Date(session.seatedAt).getTime();
          const elapsed = now - seatedTime;

          if (elapsed >= WATER_ALERT_THRESHOLD_MS && !session.waterAlertSent) {
            // TRIGGER PROACTIVE WATER BELL!
            session.waterAlertSent = true;
            saveDB();

            const callId = `AUTO_WATER_${t}_${Date.now()}`;
            const callRecord = {
              callId,
              tableNo: String(t),
              requestType: 'water_service_auto',
              requestLabel: `💧 Water & Order Assistance (Seated > 5m Without Order)`,
              note: `Table #${t} guest (${session.customerName || 'Patron'}) has been seated for 5+ minutes with NO order placed. Waiter please serve water and take order.`,
              customerEmail: session.customerEmail || '',
              status: 'PENDING',
              isAutoGenerated: true,
              createdAt: new Date().toISOString(),
            };

            db.waiterCalls = db.waiterCalls || [];
            db.waiterCalls.unshift(callRecord);
            if (db.waiterCalls.length > 100) db.waiterCalls = db.waiterCalls.slice(0, 100);
            saveDB();

            try {
              await redis.lpush('waiter_calls:recent', JSON.stringify(callRecord));
            } catch (e) {}

            console.log(`🛎️ [PROACTIVE WATER BELL DISPATCHED]: Table #${t} seated > 5 mins with 0 orders! (Guest: ${session.customerName})`);

            // Broadcast sound and alert to all staff
            broadcastEvent('waiter_alert', {
              ...callRecord,
              sound: 'bell_ring',
              alertMessage: `🔔 TABLE #${t}: 💧 Water Service & Order Check (Seated > 5m Idle)`,
            });

            broadcastEvent('table_session_updated', {
              tableNo: String(t),
              session,
              allSessions: getComputedTableStatus(),
            });
          }
        }
      }
    } catch (err) {
      console.error('Error in table inactivity monitor:', err);
    }
  }, 10000); // Check every 10 seconds
};

module.exports = {
  checkInTable,
  attendWaterAlert,
  notifyOrderPlacedForTable,
  clearTableSession,
  getComputedTableStatus,
  startTableInactivityMonitor,
};
