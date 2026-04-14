import { createApp } from './app/createApp.js';
import { closeDbPool } from './config/database.js';
import { env } from './config/env.js';
import { closeRedisClient } from './config/redis.js';
import { registerExportWorker } from './jobs/workers/exportWorker.js';
import { recoverZombieJobs } from './jobs/jobQueue.js';
import { jobsRepository } from './repositories/jobs/jobsRepository.js';
import { logger } from './utils/logger.js';

// Register async job workers
registerExportWorker();

// Startup maintenance: recover zombie jobs and clean up old records
await recoverZombieJobs();
await jobsRepository.cleanupOldJobs(7)
  .then((deleted) => logger.info('jobs:cleanup', { deleted }))
  .catch((err) => logger.warn('jobs:cleanup_failed', { error: err.message }));

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info('server:started', {
    port: env.port,
    environment: env.nodeEnv,
    pid: process.pid
  });
});

function gracefulShutdown(signal) {
  logger.info('server:shutdown', { signal });
  server.close(() => {
    Promise.all([closeDbPool(), closeRedisClient()])
      .then(() => {
        logger.info('server:closed', { signal });
        process.exit(0);
      })
      .catch((err) => {
        logger.error('server:shutdown_error', { signal, error: err.message });
        process.exit(1);
      });
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
