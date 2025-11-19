import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { httpConfig } from '../../config/http';
import { logger } from '../../config/logger';
import { errorHandler } from './middlewares/error-handler';
import { requestLogger } from './middlewares/request-logger';
import { setupRoutes } from './routes';

export async function createHttpServer(): Promise<Express> {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors(httpConfig.cors));

  // Body parsing
  app.use(express.json({ limit: httpConfig.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: httpConfig.bodyLimit }));

  // Logging
  app.use(requestLogger);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Routes
  setupRoutes(app);

  // Error handler (must be last)
  app.use(errorHandler);

  logger.info(`HTTP server configured on port ${httpConfig.port}`);

  return app;
}

