import { env } from './env';

export const httpConfig = {
  port: env.HTTP_PORT,
  timeout: 30000, // 30s
  bodyLimit: '10mb',
  cors: {
    origin: env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN?.split(',') || [] : '*',
    credentials: true,
  },
};

