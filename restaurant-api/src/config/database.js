const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'restaurant_db.json');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/restaurant_system';

let isMongoConnected = false;

// Ensure local data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Seed Data
const defaultData = {
  users: [
    {
      id: 'usr_vishal',
      email: 'vkshakti.office@gmail.com',
      name: 'Vishal Kumar',
      phone: '8956367864',
      dob: '2006-12-25',
      anniversaryDate: '2024-11-11',
      dobLocked: true,
      anniversaryLocked: true,
      walletBalance: 120,
      totalSpent: 1200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  orders: [],
  bills: [],
  waiterCalls: [],
  tableSessions: {},
  lastBulkSyncAt: new Date().toISOString(),
};

let dbState = null;

const loadDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      dbState = JSON.parse(content);
    } else {
      dbState = { ...defaultData };
      saveDB();
    }
  } catch (error) {
    dbState = { ...defaultData };
  }
  return dbState;
};

const saveDB = () => {
  try {
    if (!dbState) return;
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ [DB Save Error]:', error.message);
  }
};

loadDB();

/**
 * Connect to MongoDB using Mongoose
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    console.log(`🍃 [Mongoose Status]: Connected to MongoDB Database: ${conn.connection.name} (${conn.connection.host})`);

    // Sync seed users into MongoDB if empty
    try {
      const { User } = require('../models');
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        await User.insertMany(dbState.users);
        console.log('🌱 [Mongoose]: Default patron seed synced to MongoDB User collection');
      }
    } catch (sErr) {
      console.warn('Seed sync note:', sErr.message);
    }

    return conn;
  } catch (error) {
    isMongoConnected = false;
    console.warn(`⚠️ [Mongoose Status]: MongoDB server not reachable at ${MONGODB_URI} (${error.message})`);
    console.log(`ℹ️ [Mongoose Fallback]: Running in persistent JSON & Redis tier mode`);
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.log('🍃 [Mongoose]: Disconnected from MongoDB');
});

const getDB = () => {
  if (!dbState) loadDB();
  return dbState;
};

const getMongoStatus = () => {
  return {
    connected: isMongoConnected || mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    uri: MONGODB_URI,
    database: mongoose.connection.name || 'restaurant_system',
  };
};

module.exports = {
  connectDB,
  getDB,
  saveDB,
  loadDB,
  getMongoStatus,
  mongoose,
};
