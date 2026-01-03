// src/lib/redis.js
// Redis client for session management, rate limiting, and temporary caching
// This is optional but recommended for production environments

import redis from 'redis';
import { logger } from '../utils/logger.js';

let redisClient;

export const initializeRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    await redisClient.connect();
    logger.info('✓ Redis connected successfully');
    return redisClient;
  } catch (error) {
    logger.warn('Redis not available, running without cache:', error.message);
    return null;
  }
};

export const getRedisClient = () => redisClient;

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('✓ Redis connection closed');
  }
};

export default redisClient;
