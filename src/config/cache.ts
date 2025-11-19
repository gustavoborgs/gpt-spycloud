import { env } from './env';

export const cacheConfig = {
  url: env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  ttl: {
    default: 3600, // 1 hour
    short: 300, // 5 minutes
    long: 86400, // 24 hours
  },
};

