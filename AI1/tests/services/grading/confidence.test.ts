import { describe, it, expect } from 'vitest';
import { computeOverallConfidence, requiresHumanReview, HUMAN_REVIEW_CONFIDENCE_FLOOR } from '../../../src/services/grading/confidence.js';
import type { Damage } from '../../../src/schemas/grading-report.schema.js';

function damage(confidence: number): Damage {
  return { type: 'scratch', view: 'front', severity: 'Low', description: 'x', confidence, source: 'visual' };
}

describe('computeOverallConfidence', () => {
  it('takes the minimum component confidence, not the average', () => {
    const result = computeOverallConfidence(0.9, [damage(0.95), damage(0.3)], 1.0);
    // min(0.9, 0.95, 0.3) * 1.0 = 0.3 — an average would give ~0.72
    expect(result).toBeCloseTo(0.3, 5);
  });

  it('is scaled down by poor image quality', () => {
    const good = computeOverallConfidence(0.9, [], 1.0);
    const poor = computeOverallConfidence(0.9, [], 0.5);
    expect(poor).toBeLessThan(good);
    expect(poor).toBeCloseTo(0.45, 5);
  });

  it('stays within [0,1]', () => {
    const result = computeOverallConfidence(1, [], 1);
    expect(result).toBeLessThanOrEqual(1);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('requiresHumanReview', () => {
  it('flags confidence below the floor', () => {
    expect(requiresHumanReview(HUMAN_REVIEW_CONFIDENCE_FLOOR - 0.01)).toBe(true);
  });

  it('does not flag confidence at or above the floor', () => {
    expect(requiresHumanReview(HUMAN_REVIEW_CONFIDENCE_FLOOR)).toBe(false);
    expect(requiresHumanReview(0.9)).toBe(false);
  });
});
