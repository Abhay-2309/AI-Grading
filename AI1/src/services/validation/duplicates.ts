import { createRequire } from 'node:module';
import { logger } from '../../utils/logger.js';
import { DUPLICATE_THRESHOLD, SUSPICIOUS_THRESHOLD } from '../../config/duplicate-thresholds.js';
import type { DuplicatePair, DuplicateReport } from '../../schemas/duplicate-report.schema.js';

// sharp-phash ships CommonJS with a hand-written ESM-style .d.ts that
// TypeScript's NodeNext resolution can't unwrap correctly (resolves the
// default import as the whole module namespace). Load via createRequire
// to sidestep the type-resolution mismatch entirely — it's a type-checker
// quirk, not a runtime issue.
const require = createRequire(import.meta.url);
const phash = require('sharp-phash') as (image: Buffer) => Promise<string>;
const phashDistance = require('sharp-phash/distance.js') as (a: string, b: string) => number;

export async function computePHash(buffer: Buffer): Promise<string> {
  return phash(buffer);
}

function classify(distance: number): DuplicatePair['classification'] {
  if (distance <= DUPLICATE_THRESHOLD) return 'duplicate';
  if (distance <= SUSPICIOUS_THRESHOLD) return 'suspicious';
  return 'distinct';
}

export async function detectDuplicates(
  images: { view: string; buffer: Buffer }[]
): Promise<{ report: DuplicateReport; hashes: Map<string, string> }> {
  const hashes = new Map<string, string>();
  for (const img of images) {
    hashes.set(img.view, await computePHash(img.buffer));
  }

  const allPairs: DuplicatePair[] = [];
  const views = images.map((i) => i.view);

  for (let i = 0; i < views.length; i++) {
    for (let j = i + 1; j < views.length; j++) {
      const viewA = views[i] as string;
      const viewB = views[j] as string;
      const distance = phashDistance(hashes.get(viewA) as string, hashes.get(viewB) as string);
      const classification = classify(distance);
      allPairs.push({ viewA, viewB, hammingDistance: distance, classification });
    }
  }

  const rejectedPairs = allPairs.filter((p) => p.classification === 'duplicate');
  const suspiciousPairs = allPairs.filter((p) => p.classification === 'suspicious');

  logger.info(
    { event: 'duplicatePairwiseDistances', pairs: allPairs.map((p) => ({ ...p })) },
    'duplicate detection computed'
  );

  return {
    report: {
      hasRejectedDuplicates: rejectedPairs.length > 0,
      rejectedPairs,
      suspiciousPairs,
      allPairs,
    },
    hashes,
  };
}
