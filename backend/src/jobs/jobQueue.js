import { logger } from '../utils/logger.js';
import { jobsRepository } from '../repositories/jobs/jobsRepository.js';

const handlers = new Map();
const queue = [];
let processing = false;
const MAX_CONCURRENT = 2;
let activeCount = 0;

export function registerWorker(jobType, handler) {
  handlers.set(jobType, handler);
  logger.info('jobQueue:worker_registered', { jobType });
}

export function enqueue(job) {
  const handler = handlers.get(job.tipo);

  if (!handler) {
    logger.error('jobQueue:no_handler', { jobType: job.tipo });
    return;
  }

  queue.push({ job, handler });
  processNext();
}

async function processNext() {
  if (activeCount >= MAX_CONCURRENT || queue.length === 0) {
    return;
  }

  const { job, handler } = queue.shift();
  activeCount++;

  try {
    await handler(job);
  } catch (error) {
    logger.error('jobQueue:worker_unhandled_error', {
      jobId: job.id,
      jobType: job.tipo,
      error: error.message
    });
  } finally {
    activeCount--;
    processNext();
  }
}

export function getQueueStats() {
  return {
    pending: queue.length,
    active: activeCount,
    registeredWorkers: Array.from(handlers.keys())
  };
}

export async function recoverZombieJobs() {
  try {
    const recovered = await jobsRepository.markZombiesAsFailed();
    if (recovered > 0) {
      logger.warn('jobQueue:zombie_recovery', { recoveredCount: recovered });
    } else {
      logger.info('jobQueue:zombie_recovery', { recoveredCount: 0 });
    }
  } catch (error) {
    logger.error('jobQueue:zombie_recovery_failed', { error: error.message });
  }
}
