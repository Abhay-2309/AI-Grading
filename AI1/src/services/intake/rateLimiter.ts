import { RateLimitError } from '../../utils/errors.js';

interface Bucket {
  count: number;
  windowStart: number;
}

// Fixed-window per-customer rate limiter. Vision calls are the dominant
// cost, so this exists primarily to stop one buggy/malicious client from
// draining Gemini quota and pushing every other customer onto the Gemma
// fallback (which grades slightly differently — see AI layer notes).
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly max: number,
    private readonly windowSeconds: number
  ) {}

  check(key: string): void {
    const now = Date.now();
    const windowMs = this.windowSeconds * 1000;
    const bucket = this.buckets.get(key);

    if (!bucket || now - bucket.windowStart >= windowMs) {
      this.buckets.set(key, { count: 1, windowStart: now });
      return;
    }

    if (bucket.count >= this.max) {
      throw new RateLimitError('Too many requests. Please slow down.', {
        limit: this.max,
        windowSeconds: this.windowSeconds,
        retryAfterMs: windowMs - (now - bucket.windowStart),
      });
    }

    bucket.count += 1;
  }
}
