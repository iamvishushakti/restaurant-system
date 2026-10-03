const {
  checkInTable,
  attendWaterAlert,
  clearTableSession,
  getComputedTableStatus,
} = require('../services/tableSessionService');

/**
 * Check-in / Seat customer at table upon login or table assignment
 * POST /api/tables/checkin
 */
const checkIn = async (req, res) => {
  try {
    const { tableNo = '4', customerEmail = '', customerName = '', customerPhone = '' } = req.body;
    const session = await checkInTable({
      tableNo: String(tableNo),
      customerEmail,
      customerName,
      customerPhone,
    });

    return res.status(200).json({
      success: true,
      message: `Table #${tableNo} successfully registered as OCCUPIED for ${session.customerName}.`,
      session,
      allTables: getComputedTableStatus(),
    });
  } catch (error) {
    console.error('Error in table checkin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register table check-in session.',
    });
  }
};

/**
 * Mark water alert / table attended directly
 * POST /api/tables/attend-water/:tableNo
 */
const markWaterAttended = async (req, res) => {
  try {
    const { tableNo } = req.params;
    const { staffName = 'Floor Server' } = req.body;
    const session = attendWaterAlert(tableNo, staffName);

    return res.status(200).json({
      success: true,
      message: `Table #${tableNo} water alert marked as ATTENDED by ${staffName}.`,
      session,
      allTables: getComputedTableStatus(),
    });
  } catch (error) {
    console.error('Error marking water attended:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark water attended.',
    });
  }
};

/**
 * Get live status & occupancy details of all 12 tables
 * GET /api/tables/status
 */
const getTableStatus = async (req, res) => {
  try {
    const tables = getComputedTableStatus();
    return res.status(200).json({
      success: true,
      tables,
      occupiedCount: tables.filter((t) => t.isOccupied).length,
      idleAlertCount: tables.filter((t) => t.isIdleOver5Min).length,
    });
  } catch (error) {
    console.error('Error fetching table status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch table occupancy status.',
    });
  }
};

/**
 * Clear table session manually by staff/cashier
 * POST /api/tables/clear/:tableNo
 */
const clearTable = async (req, res) => {
  try {
    const { tableNo } = req.params;
    clearTableSession(tableNo);

    return res.status(200).json({
      success: true,
      message: `Table #${tableNo} cleared and marked AVAILABLE.`,
      allTables: getComputedTableStatus(),
    });
  } catch (error) {
    console.error('Error clearing table session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear table session.',
    });
  }
};

module.exports = {
  checkIn,
  markWaterAttended,
  getTableStatus,
  clearTable,
};
