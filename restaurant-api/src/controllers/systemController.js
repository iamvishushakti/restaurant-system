const { executeBulkSync, getSyncStatus } = require('../services/bulkSyncService');
const redis = require('../config/redis');
const { getDB, saveDB } = require('../config/database');

// Default Restaurant Coordinates (New Delhi Connaught Place Heritage dining)
const RESTAURANT_LAT = parseFloat(process.env.RESTAURANT_LAT) || 28.6315;
const RESTAURANT_LNG = parseFloat(process.env.RESTAURANT_LNG) || 77.2167;
const MAX_ALLOWED_DISTANCE_METERS = parseInt(process.env.RESTAURANT_MAX_RADIUS_METERS) || 200; // 200 meters dining boundary

/**
 * Haversine formula to calculate distance in meters between two GPS coordinates
 */
const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

/**
 * Check Geofencing / In-Restaurant Dining Status
 * @route POST /api/system/verify-location
 */
const verifyLocation = async (req, res) => {
  try {
    const { latitude, longitude, bypassDemo = false, tableNo = '4' } = req.body;

    if (bypassDemo || (!latitude && !longitude)) {
      // Demo fallback allowed so testing is smooth
      return res.status(200).json({
        success: true,
        inRestaurant: true,
        isDemoMode: true,
        message: `Verified via Restaurant Table #${tableNo} Dining Access Point`,
        restaurantLocation: {
          name: 'The Daily Culinary Chronicle - Heritage Hall',
          lat: RESTAURANT_LAT,
          lng: RESTAURANT_LNG,
          maxRadiusMeters: MAX_ALLOWED_DISTANCE_METERS,
        },
      });
    }

    const distance = calculateDistanceInMeters(
      parseFloat(latitude),
      parseFloat(longitude),
      RESTAURANT_LAT,
      RESTAURANT_LNG
    );

    const inRestaurant = distance <= MAX_ALLOWED_DISTANCE_METERS;

    return res.status(200).json({
      success: true,
      inRestaurant,
      distanceMeters: distance,
      maxAllowedMeters: MAX_ALLOWED_DISTANCE_METERS,
      message: inRestaurant
        ? `✅ Inside Restaurant Dining Zone (${distance}m from center)`
        : `⚠️ Outside Dining Boundary (${distance}m away, max allowed ${MAX_ALLOWED_DISTANCE_METERS}m)`,
      restaurantLocation: {
        name: 'The Daily Culinary Chronicle - Heritage Hall',
        lat: RESTAURANT_LAT,
        lng: RESTAURANT_LNG,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify dining location',
      error: error.message,
    });
  }
};

/**
 * Bulk Sync Telemetry & Health Status
 * @route GET /api/system/sync-status
 */
const getSyncTelemetry = async (req, res) => {
  try {
    const syncStatus = getSyncStatus();
    let redisConnected = false;
    let pendingCartsCount = 0;

    try {
      const ping = await redis.ping();
      redisConnected = ping === 'PONG';
      const pendingKeys = await redis.smembers('sync:pending_carts');
      pendingCartsCount = pendingKeys?.length || 0;
    } catch (e) {
      redisConnected = false;
    }

    const db = getDB();

    return res.status(200).json({
      success: true,
      sync: {
        ...syncStatus,
        pendingCartsInRedis: pendingCartsCount,
      },
      services: {
        redis: {
          connected: redisConnected,
          activeOrdersKey: 'orders:active',
          bulkSyncSet: 'sync:pending_carts',
        },
        database: {
          persistedOrdersCount: (db.orders || []).length,
          persistedBillsCount: (db.bills || []).length,
          persistedUsersCount: (db.users || []).length,
          lastSyncAt: db.lastBulkSyncAt || syncStatus.lastSyncAt,
        },
      },
      settings: {
        deviceMasterPasscode: db.settings?.deviceMasterPasscode || '1234',
      },
      recentLogs: (db.systemLogs || []).slice(0, 10),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve sync status',
      error: error.message,
    });
  }
};

/**
 * Manually Force Flush Bulk Sync from Redis to Database
 * @route POST /api/system/force-sync
 */
const forceSync = async (req, res) => {
  try {
    const result = await executeBulkSync('MANUAL_OPERATOR_TRIGGER');
    return res.status(200).json({
      success: true,
      message: 'Manual bulk sync completed successfully',
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to execute manual bulk sync',
      error: error.message,
    });
  }
};

/**
 * Get Master Device Passcode (For Manager Overview)
 * @route GET /api/system/device-passcode
 */
const getDevicePasscode = async (req, res) => {
  try {
    const db = getDB();
    const passcode = db.settings?.deviceMasterPasscode || '1234';
    return res.status(200).json({
      success: true,
      passcode,
      message: 'Master device passcode retrieved',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve device passcode',
      error: error.message,
    });
  }
};

/**
 * Verify Master Device Passcode from Client Table Device
 * @route POST /api/system/verify-device-passcode
 */
const verifyDevicePasscode = async (req, res) => {
  try {
    const { passcode } = req.body;
    const db = getDB();
    const actualPasscode = (db.settings?.deviceMasterPasscode || '1234').toString().trim();

    if (!passcode) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Passcode is required',
      });
    }

    const isValid = passcode.toString().trim() === actualPasscode;

    if (!isValid) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Invalid Master Device Passcode. Please check with General Manager.',
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      message: 'Authorization Successful. Table selection unlocked for waiter.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message,
    });
  }
};

/**
 * Update Master Device Passcode (Manager Only)
 * @route PUT /api/system/device-passcode
 */
const updateDevicePasscode = async (req, res) => {
  try {
    const { newPasscode, managerEmail = 'manager@chronicle.com' } = req.body;

    if (!newPasscode || newPasscode.toString().trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Master passcode must be at least 3 characters/digits',
      });
    }

    const db = getDB();
    db.settings = db.settings || {};
    db.settings.deviceMasterPasscode = newPasscode.toString().trim();
    db.settings.updatedAt = new Date().toISOString();
    db.settings.updatedBy = managerEmail;

    db.systemLogs = db.systemLogs || [];
    db.systemLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DEVICE_PASSCODE_CHANGED',
      details: `Master device passcode updated by ${managerEmail}`,
    });

    saveDB();

    try {
      await redis.set('settings:device_master_passcode', newPasscode.toString().trim());
    } catch (e) {}

    console.log(`🔐 [Master Passcode Updated]: New device PIN set to [${newPasscode}] by ${managerEmail}`);

    return res.status(200).json({
      success: true,
      message: `Master Device Passcode successfully updated to ${newPasscode}`,
      passcode: newPasscode,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update device passcode',
      error: error.message,
    });
  }
};

module.exports = {
  verifyLocation,
  getSyncTelemetry,
  forceSync,
  getDevicePasscode,
  verifyDevicePasscode,
  updateDevicePasscode,
};
