export type CircuitState = 'closed' | 'open';

/**
 * During a real Gemini outage, paying a full timeout on every request
 * before falling back would tank p99 latency. The breaker skips the
 * known-dead hop for a cooldown window after enough consecutive failures.
 */
export class CircuitBreaker {
  private consecutiveFailures = 0;
  private openedAt = 0;

  constructor(
    private readonly failureThreshold: number,
    private readonly cooldownMs: number
  ) {}

  get state(): CircuitState {
    if (this.consecutiveFailures < this.failureThreshold) return 'closed';
    if (Date.now() - this.openedAt >= this.cooldownMs) return 'closed'; // half-open -> allow a probe
    return 'open';
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = 0;
  }

  recordFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.openedAt = Date.now();
    }
  }

  reset(): void {
    this.consecutiveFailures = 0;
    this.openedAt = 0;
  }
}
