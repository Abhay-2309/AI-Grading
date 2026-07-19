import { config } from '../../config/config.js';
import { logger } from '../../utils/logger.js';
import { gradingRepository } from '../db/repository.js';

/**
 * Without this, a crashed worker mid-ANALYZING leaves a request spinning
 * forever and the frontend polls into infinity. Runs on an interval and
 * marks anything stuck past the threshold as FAILED.
 */
export async function sweepStuckRequests(): Promise<number> {
  let stuck;
  try {
    stuck = await gradingRepository.findStuckAnalyzing(config.SWEEPER_STUCK_THRESHOLD_MS);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errDetails = String((err as any)?.details?.cause || '');
    const isAccessDenied = 
      errMsg.includes('AccessDenied') || 
      errMsg.includes('not authorized') ||
      errDetails.includes('AccessDenied') ||
      errDetails.includes('not authorized');

    if (isAccessDenied) {
      logger.warn('Stuck-request sweeper lacks DynamoDB Scan/Query permissions; disabling background sweeper.');
      stopSweeper();
      return 0;
    }
    throw err;
  }

  let swept = 0;
  for (const record of stuck) {
    try {
      await gradingRepository.transitionStatus(record.requestId, 'ANALYZING', 'FAILED', {
        failureReason: `Stuck in ANALYZING for longer than ${config.SWEEPER_STUCK_THRESHOLD_MS}ms; likely a crashed worker.`,
        failureCode: 'MODEL_UNAVAILABLE',
      });
      swept += 1;
      logger.warn({ requestId: record.requestId }, 'swept stuck ANALYZING request to FAILED');
    } catch (err) {
      logger.error({ requestId: record.requestId, err }, 'failed to sweep stuck request');
    }
  }

  return swept;
}

let intervalHandle: NodeJS.Timeout | undefined;

export function startSweeper(): void {
  if (intervalHandle) return;
  intervalHandle = setInterval(() => {
    sweepStuckRequests().catch((err) => logger.error({ err }, 'sweeper run failed'));
  }, config.SWEEPER_INTERVAL_MS);
  intervalHandle.unref();
  logger.info({ intervalMs: config.SWEEPER_INTERVAL_MS }, 'stuck-request sweeper started');
}

export function stopSweeper(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = undefined;
  }
}
