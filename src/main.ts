import { createHttpServer } from './infra/http/express-app';
import { createGsmServer } from './infra/tcp/gsmServer';
import { initDb, closeDb } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';
import { GsmSocketHandler } from './modules/ingest/presentation/tcp/gsmSocketHandler';

async function bootstrap() {
  try {
    // Initialize database FIRST - before any routes or handlers are created
    await initDb();
    logger.info('✅ Database initialized');

    // Create GSM socket handler (after DB is initialized)
    const gsmHandler = new GsmSocketHandler();

    // Create and start HTTP server (after DB is initialized)
    const httpApp = await createHttpServer();
    const httpServer = httpApp.listen(env.HTTP_PORT, () => {
      logger.info(`🚀 HTTP server running on port ${env.HTTP_PORT}`);
    });

    // Create and start GSM TCP server
    const gsmServer = createGsmServer(async (message) => {
      await gsmHandler.handleMessage(message);
    });

    gsmServer.listen(env.GSM_PORT, env.GSM_HOST, () => {
      logger.info(`📡 GSM TCP server running on ${env.GSM_HOST}:${env.GSM_PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      httpServer.close(() => {
        logger.info('HTTP server closed');
      });

      gsmServer.close(() => {
        logger.info('GSM server closed');
      });

      await closeDb();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    logger.info('✅ Application started successfully');
  } catch (error) {
    logger.error({ error }, '❌ Fatal error during bootstrap');
    process.exit(1);
  }
}

bootstrap();

