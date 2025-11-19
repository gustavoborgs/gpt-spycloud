import { Express } from 'express';
import { logger } from '../../config/logger';

// Import module routes
import { devicesRoutes } from '../../modules/devices/presentation/http/devices.routes';
import { ingestRoutes } from '../../modules/ingest/presentation/http/ingest.routes';
// Add more module routes as they are created
// import { telemetryRoutes } from '../../modules/telemetry/presentation/http/telemetry.routes';

export function setupRoutes(app: Express): void {
  // API routes
  app.use('/api/devices', devicesRoutes);
  app.use('/api/ingest', ingestRoutes);
  // app.use('/api/telemetry', telemetryRoutes);

  logger.info('Routes configured');
}

