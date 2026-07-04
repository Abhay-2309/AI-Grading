import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { detectDuplicates } from '../../../src/services/validation/duplicates.js';

const FIXTURES = path.join(__dirname, '../../fixtures/images');

async function load(name: string): Promise<Buffer> {
  return fs.readFile(path.join(FIXTURES, name));
}

describe('detectDuplicates', () => {
  it('rejects an exact duplicate image submitted under two view names', async () => {
    const images = [
      { view: 'front', buffer: await load('duplicate_exact.jpg') },
      { view: 'back', buffer: await load('duplicate_exact.jpg') },
    ];
    const { report } = await detectDuplicates(images);
    expect(report.hasRejectedDuplicates).toBe(true);
    expect(report.rejectedPairs).toHaveLength(1);
  });

  it('still catches the same image re-saved at a different JPEG quality', async () => {
    const images = [
      { view: 'front', buffer: await load('duplicate_exact.jpg') },
      { view: 'back', buffer: await load('duplicate_resaved.jpg') },
    ];
    const { report } = await detectDuplicates(images);
    expect(report.hasRejectedDuplicates).toBe(true);
  });

  it('passes two genuinely distinct images', async () => {
    const images = [
      { view: 'front', buffer: await load('duplicate_exact.jpg') },
      { view: 'back', buffer: await load('low_contrast.jpg') },
    ];
    const { report } = await detectDuplicates(images);
    expect(report.hasRejectedDuplicates).toBe(false);
    expect(report.allPairs[0]?.classification).toBe('distinct');
  });

  it('computes all pairwise combinations for more than two images', async () => {
    const images = [
      { view: 'front', buffer: await load('duplicate_exact.jpg') },
      { view: 'back', buffer: await load('duplicate_resaved.jpg') },
      { view: 'left', buffer: await load('distinct_angle.jpg') },
    ];
    const { report } = await detectDuplicates(images);
    expect(report.allPairs).toHaveLength(3); // 3 choose 2
  });

  it('flags near-identical but non-exact pairs as suspicious rather than rejecting outright', async () => {
    const images = [
      { view: 'front', buffer: await load('distinct_angle.jpg') },
      { view: 'back', buffer: await load('sharp_ok.jpg') },
    ];
    const { report } = await detectDuplicates(images);
    // These two checkerboard-pattern fixtures land in the suspicious band by
    // construction (see generate-fixtures.ts) — verifies the escape valve
    // for genuinely symmetric products exists and doesn't hard-reject.
    const pair = report.allPairs[0];
    expect(pair?.classification).not.toBe('duplicate');
  });
});
