export interface IdempotencyStore {
  get(key: string): Promise<string | undefined>;
  set(key: string, requestId: string, ttlSeconds: number): Promise<void>;
}

interface Entry {
  requestId: string;
  expiresAt: number;
}

// In-process store, adequate for a single-instance demo/dev deployment.
// For multi-instance production, back this with the DynamoDB table (the
// idempotencyKey can be stored as a GSI on GradingRequestRecord) so all
// instances share state — swap is a single-class change since callers
// only depend on this interface.
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly entries = new Map<string, Entry>();

  async get(key: string): Promise<string | undefined> {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.requestId;
  }

  async set(key: string, requestId: string, ttlSeconds: number): Promise<void> {
    this.entries.set(key, { requestId, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}
