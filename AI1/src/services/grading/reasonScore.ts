import { deductionFor } from './damageTable.js';
import type { DetectedDamage } from '../../schemas/grading-report.schema.js';

export const REASON_BANDS = {
  SAFETY: {
    score: 5,
    keywords: ['fire', 'smoke', 'burning', 'spark', 'shock', 'leak', 'exploded', 'hazard', 'melted'],
  },
  MAJOR_FAILURE: {
    score: 25,
    keywords: [
      "won't turn on",
      'wont turn on',
      'dead',
      "doesn't work",
      'does not work',
      'not working',
      'stopped working',
      "won't charge",
      'unusable',
      'totally broken',
      'completely broken',
    ],
  },
  PARTIAL_FAILURE: {
    score: 47,
    keywords: [
      'broken',
      'malfunctioning',
      "doesn't charge properly",
      'intermittent',
      'sometimes',
      'one side',
      'missing',
      'defective',
      'faulty',
    ],
  },
  MINOR_FUNCTIONAL: {
    score: 67,
    keywords: ['noisy', 'loud', 'battery drains', 'weak battery', 'loose', 'wobbly', 'slow', 'heats up', 'stitch'],
  },
  COSMETIC: {
    score: 85,
    keywords: ['scratch', 'scuff', 'mark', 'stain', 'color', 'colour', 'faded', 'dent', 'packaging damaged', 'box damaged'],
  },
  NO_DEFECT: {
    score: 97,
    keywords: [
      'changed mind',
      'wrong size',
      "didn't like",
      "don't like",
      'ordered by mistake',
      'gift',
      'duplicate order',
      'better price',
    ],
  },
} as const;

export type ReasonBandKey = keyof typeof REASON_BANDS;

export function computeReasonScore(
  returnReason: string,
  sanitizedNotes: string,
  customerReportedDamages: DetectedDamage[]
): { reasonScore: number; band: string } {
  const combinedText = `${returnReason} ${sanitizedNotes}`.toLowerCase();

  // Evaluate bands from MOST severe to LEAST severe
  const bandsOrder: ReasonBandKey[] = [
    'SAFETY',
    'MAJOR_FAILURE',
    'PARTIAL_FAILURE',
    'MINOR_FUNCTIONAL',
    'COSMETIC',
    'NO_DEFECT',
  ];

  let matchedBand: ReasonBandKey = 'NO_DEFECT';
  for (const bandKey of bandsOrder) {
    const band = REASON_BANDS[bandKey];
    const match = band.keywords.some((kw) => combinedText.includes(kw));
    if (match) {
      matchedBand = bandKey;
      break;
    }
  }

  const bandScore = REASON_BANDS[matchedBand].score;

  // customer_reported damages calculations
  let finalScore: number = bandScore;
  if (customerReportedDamages.length > 0) {
    const totalDeduction = customerReportedDamages.reduce(
      (sum, d) => sum + deductionFor(d.type, d.severity),
      0
    );
    const crScore = Math.max(0, Math.min(100, Math.round(100 - totalDeduction)));
    finalScore = Math.min(bandScore, crScore);
  }

  return {
    reasonScore: finalScore,
    band: matchedBand,
  };
}
