import { describe, it, expect, beforeAll } from 'vitest';
import { config } from '../../src/config/config.js';

/**
 * Requires `docker compose up dynamodb-local minio minio-init` plus a table
 * created via `npx tsx scripts/local-setup.ts`. Skips cleanly (rather than
 * failing the suite) when those local services aren't reachable, since this
 * is the one part of the test pyramid that needs real infra — see Phase 8
 * of the build plan for why unit tests can't substitute for this.
 */
async function isReachable(url: string | undefined, timeoutMs = 1000): Promise<boolean> {
  if (!url) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

const dynamoUp = await isReachable(config.DYNAMODB_ENDPOINT);
const minioUp = await isReachable(config.S3_ENDPOINT);
const infraUp = dynamoUp && minioUp;

if (!infraUp) {
  // eslint-disable-next-line no-console
  console.warn(
    '[integration/storage.test.ts] Skipping: local DynamoDB/MinIO not reachable. ' +
      'Run `docker compose up -d` and `npx tsx scripts/local-setup.ts` to enable this suite.'
  );
}

describe.skipIf(!infraUp)('storage integration (local DynamoDB + MinIO)', () => {
  let gradingRepository: typeof import('../../src/services/db/repository.js')['gradingRepository'];
  let uploadOriginal: typeof import('../../src/services/storage/s3.js')['uploadOriginal'];
  let metadataToRecord: typeof import('../../src/services/db/schema.js')['metadataToRecord'];

  beforeAll(async () => {
    ({ gradingRepository } = await import('../../src/services/db/repository.js'));
    ({ uploadOriginal } = await import('../../src/services/storage/s3.js'));
    ({ metadataToRecord } = await import('../../src/services/db/schema.js'));
  });

  it('creates a record, transitions it through the legal state machine, and persists statusHistory', async () => {
    const requestId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const record = metadataToRecord(
      requestId,
      {
        customerId: 'cust-integration',
        category: 'electronics',
        returnReason: 'test',
        customerNotes: '',
      },
      new Date().toISOString()
    );

    await gradingRepository.create(record);
    await gradingRepository.transitionStatus(requestId, 'UPLOADED', 'VALIDATED');
    await gradingRepository.transitionStatus(requestId, 'VALIDATED', 'ANALYZING');
    await gradingRepository.transitionStatus(requestId, 'ANALYZING', 'GRADED');
    await gradingRepository.transitionStatus(requestId, 'GRADED', 'COMPLETED');

    const final = await gradingRepository.get(requestId);
    expect(final.status).toBe('COMPLETED');
    expect(final.statusHistory.map((h) => h.status)).toEqual([
      'UPLOADED',
      'VALIDATED',
      'ANALYZING',
      'GRADED',
      'COMPLETED',
    ]);
  });

  it('rejects an illegal state transition via the conditional write', async () => {
    const requestId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const record = metadataToRecord(
      requestId,
      { customerId: 'cust-integration', category: 'electronics', returnReason: 'test', customerNotes: '' },
      new Date().toISOString()
    );
    await gradingRepository.create(record);

    await expect(
      gradingRepository.transitionStatus(requestId, 'COMPLETED', 'ANALYZING')
    ).rejects.toThrow();
  });

  it('uploads an object to S3/MinIO and reads it back', async () => {
    const requestId = `test-${Date.now()}`;
    const key = await uploadOriginal(requestId, 'front', Buffer.from('fake-jpeg-bytes'), 'image/jpeg');
    expect(key).toContain(requestId);
  });
});
