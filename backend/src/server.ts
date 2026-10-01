import http from 'node:http';
import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';

const server = http.createServer(app);

const start = async () => {
  try {
    // Retries are for production only. Locally and in tests a bad URI should
    // fail fast; on a hosted Atlas cluster a paused or failing-over node is
    // normal and recoverable, so retry rather than crash-loop the deploy.
    await connectDatabase(env.MONGODB_URI, {
      retries: env.isProduction ? 4 : 0,
      retryDelayMs: 5000,
    });

    await connectDatabase();

    server.listen(env.PORT, () => {
      logger.info(
        `Server running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode (API: ${env.API_PREFIX})`,
      );
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await disconnectDatabase();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', err);
      process.exit(1);
    }
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

void start();
