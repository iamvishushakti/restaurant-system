const Redis = require('ioredis');

// Redis URL (redis://localhost:6379) support
const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const redis = new Redis(redisUrl, {
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('🔴 [Redis]: Connecting to Redis server at ' + redisUrl);
});

redis.on('ready', () => {
  console.log('✅ [Redis]: Successfully connected and ready to use!');
});

redis.on('error', (err) => {
  console.error('❌ [Redis Error]:', err.message);
});

module.exports = redis;
