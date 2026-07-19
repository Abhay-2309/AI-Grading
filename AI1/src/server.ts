import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { buildApp } from './app.js';
import { startSweeper, stopSweeper } from './services/grading/sweeper.js';

async function start(): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info(`Server listening on port ${config.PORT}`);
    logger.info(
      { modelTimeoutMs: config.MODEL_TIMEOUT_MS, sweeperStuckThresholdMs: config.SWEEPER_STUCK_THRESHOLD_MS },
      'effective AI timeout config'
    );
    startSweeper();
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }

  // Graceful shutdown: stop accepting new requests, let in-flight requests
  // finish, then exit. Without this, every deploy strands ANALYZING
  // requests for the sweeper instead of letting them complete cleanly.
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    stopSweeper();
    try {
      await app.close();
      logger.info('Server closed cleanly.');
      process.exit(0);
    } catch (err) {
      logger.error(err, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

start();
