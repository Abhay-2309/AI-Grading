import { config } from '../../config/config.js';
import { logger } from '../../utils/logger.js';
import { ModelOutputError, ModelQuotaError, ModelUnavailableError } from '../../utils/errors.js';
import { repairAndValidate } from './repair.js';
import { CircuitBreaker } from './circuitBreaker.js';
import type { DetectionResult } from '../../schemas/grading-report.schema.js';
import type { SingleViewDetectionInput, VisionGrader } from './clients/types.js';

export interface SingleViewOrchestrationResult {
  result: DetectionResult;
  modelUsed: 'gemini' | 'gemma';
  view: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffWithJitter(attempt: number): number {
  const base = 500 * 2 ** attempt;
  return base + Math.random() * base * 0.3;
}

async function detectSingleViewWithRepair(
  client: VisionGrader,
  input: SingleViewDetectionInput
): Promise<DetectionResult> {
  const raw = await client.detectSingleView(input);

  let attempt = repairAndValidate(raw.text);
  if (!attempt.success) {
    logger.warn(
      { event: 'repairAttempt', model: client.name, requestId: input.requestId, view: input.image.view },
      're-prompting model after validation failure'
    );
    const reprompted = await client.detectSingleView({
      ...input,
      priorAttemptErrors: attempt.errors ?? 'unknown validation error',
    });
    attempt = repairAndValidate(reprompted.text);
  }

  if (!attempt.success || !attempt.report) {
    throw new ModelOutputError(
      `${client.name} produced invalid detection output for view '${input.image.view}' after repair and re-prompt.`,
      { errors: attempt.errors }
    );
  }

  return attempt.report;
}

async function detectSingleViewWithInternalRetry(
  client: VisionGrader,
  input: SingleViewDetectionInput,
  internalRetries: number
): Promise<DetectionResult> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= internalRetries; attempt++) {
    try {
      return await detectSingleViewWithRepair(client, input);
    } catch (err) {
      lastErr = err;
      const retryable = err instanceof ModelUnavailableError;
      if (!retryable || attempt === internalRetries) break;
      await sleep(backoffWithJitter(attempt));
    }
  }
  throw lastErr;
}

export class FallbackOrchestrator {
  private readonly breaker: CircuitBreaker;

  constructor(
    private readonly primary: VisionGrader,
    private readonly fallback: VisionGrader,
    breaker?: CircuitBreaker
  ) {
    this.breaker =
      breaker ??
      new CircuitBreaker(
        config.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        config.CIRCUIT_BREAKER_COOLDOWN_MS
      );
  }

  async detectSingleView(input: SingleViewDetectionInput): Promise<SingleViewOrchestrationResult> {
    const log = logger.child({ requestId: input.requestId, view: input.image.view });

    if (this.breaker.state === 'closed') {
      try {
        const result = await detectSingleViewWithInternalRetry(this.primary, input, 1);
        this.breaker.recordSuccess();
        return { result, modelUsed: this.primary.name, view: input.image.view };
      } catch (err) {
        if (
          err instanceof ModelQuotaError ||
          err instanceof ModelUnavailableError ||
          err instanceof ModelOutputError
        ) {
          this.breaker.recordFailure();
          log.warn({ event: 'primaryModelFailed', model: this.primary.name, err: String(err) }, 'falling back');
        } else {
          throw err;
        }
      }
    } else {
      log.warn({ event: 'circuitBreakerOpen', model: this.primary.name }, 'skipping primary, breaker open');
    }

    try {
      const result = await detectSingleViewWithInternalRetry(this.fallback, input, 1);
      return { result, modelUsed: this.fallback.name, view: input.image.view };
    } catch (err) {
      log.error({ event: 'fallbackModelFailed', model: this.fallback.name, err: String(err) }, 'both models failed');
      throw err;
    }
  }
}
