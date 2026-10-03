const { getDB, saveDB } = require('../config/database');
const { broadcastEvent } = require('../services/socketService');
const { attendWaterAlert } = require('../services/tableSessionService');
const { WaiterCall } = require('../models');

/**
 * Get Recent Waiter Calls
 * @route GET /api/waiter/calls
 */
const getCalls = async (req, res) => {
  try {
    const db = getDB();
    const calls = db.waiterCalls || [];
    return res.status(200).json({
      success: true,
      count: calls.length,
      calls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve waiter calls',
      error: error.message,
    });
  }
};

/**
 * Trigger / Create Waiter Call
 * @route POST /api/waiter/call
 */
const createCall = async (req, res) => {
  try {
    const {
      tableNo = '4',
      requestType = 'water',
      requestLabel = 'Water Please',
      note = '',
      customerEmail = '',
    } = req.body;
    const db = getDB();

    const callId = `CALL-${Date.now()}`;
    const newCall = {
      callId,
      tableNo: String(tableNo),
      requestType,
      requestLabel,
      note,
      customerEmail,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    db.waiterCalls = db.waiterCalls || [];
    db.waiterCalls.unshift(newCall);
    if (db.waiterCalls.length > 100) db.waiterCalls = db.waiterCalls.slice(0, 100);
    saveDB();

    // Persist to Mongoose
    try {
      await WaiterCall.create(newCall);
    } catch (mErr) {}

    // Broadcast Real-time event + Bell Chime to all staff
    broadcastEvent('waiter_alert', {
      ...newCall,
      sound: 'bell_ring',
      alertMessage: `🔔 TABLE ${tableNo}: ${requestLabel}`,
    });

    console.log(`🛎️ [REST Call Waiter]: Table ${tableNo} requested [${requestLabel}] in Mongoose`);

    return res.status(201).json({
      success: true,
      message: `Waiter alert triggered for Table ${tableNo}`,
      call: newCall,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to trigger waiter call',
      error: error.message,
    });
  }
};

/**
 * Update Waiter Call Status (Mark Attending or Resolved)
 * @route PUT /api/waiter/calls/:callId/status
 */
const updateCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, staffName = 'Floor Server' } = req.body;

    const db = getDB();
    const call = (db.waiterCalls || []).find((c) => c.callId === callId);

    if (!call) {
      return res.status(404).json({ success: false, message: 'Waiter call not found' });
    }

    call.status = status;
    call.handledBy = staffName;
    call.updatedAt = new Date().toISOString();
    saveDB();

    // Update in Mongoose
    try {
      await WaiterCall.findOneAndUpdate(
        { callId },
        { status, handledBy: staffName, updatedAt: new Date() },
        { upsert: true }
      );
    } catch (mErr) {}

    // Synchronize Table Seating Session
    if (call.tableNo) {
      try {
        attendWaterAlert(call.tableNo, staffName);
      } catch (e) {}
    }

    broadcastEvent('waiter_call_updated', call);

    return res.status(200).json({
      success: true,
      message: `Call status updated to ${status}`,
      call,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update call status',
      error: error.message,
    });
  }
};

module.exports = {
  getCalls,
  createCall,
  updateCallStatus,
};
