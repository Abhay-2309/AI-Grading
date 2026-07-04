import type { Damage } from '../../schemas/grading-report.schema.js';

export const HUMAN_REVIEW_CONFIDENCE_FLOOR = 0.65;

/**
 * min(component confidences) x imageQualityFactor, not an average. A single
 * very uncertain damage detection should drag the whole report's confidence
 * down, because the final grade depends on it — averaging would hide that
 * weakness.
 */
export function computeOverallConfidence(
  modelConfidence: number,
  damages: Damage[],
  imageQualityScore: number
): number {
  const componentConfidences = [modelConfidence, ...damages.map((d) => d.confidence)];
  const minComponent = Math.min(...componentConfidences);
  const combined = minComponent * imageQualityScore;
  return Math.max(0, Math.min(1, combined));
}

export function requiresHumanReview(overallConfidence: number): boolean {
  return overallConfidence < HUMAN_REVIEW_CONFIDENCE_FLOOR;
}
