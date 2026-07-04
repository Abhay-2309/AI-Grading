import { describe, it, expect } from 'vitest';
import { computeOverallScore } from '../../../src/services/grading/scoring.js';
import type { Damage } from '../../../src/schemas/grading-report.schema.js';

function damage(type: string, severity: Damage['severity']): Damage {
  return { type, view: 'front', severity, description: type, confidence: 0.8, source: 'visual' };
}

describe('computeOverallScore — additive deduction (pre-existing behavior)', () => {
  it('returns 100 for zero damages', () => {
    expect(computeOverallScore([]).overallScore).toBe(100);
  });

  it('deducts more for higher severity of the same damage type', () => {
    const low = computeOverallScore([damage('scuff', 'Low')]).overallScore;
    const high = computeOverallScore([damage('scuff', 'High')]).overallScore;
    expect(high).toBeLessThan(low);
  });

  it('deducts more for a more severe damage type at the same severity', () => {
    const scratch = computeOverallScore([damage('scratch', 'Moderate')]).overallScore;
    const dent = computeOverallScore([damage('dent', 'Moderate')]).overallScore;
    expect(dent).toBeLessThan(scratch);
  });

  it('never goes below 0 via additive deduction alone', () => {
    const damages = Array.from({ length: 20 }, () => damage('missing_part', 'High'));
    expect(computeOverallScore(damages).overallScore).toBe(0);
  });

  it('is reproducible for the same input', () => {
    const damages = [damage('scuff', 'Low'), damage('dent', 'Moderate')];
    expect(computeOverallScore(damages).overallScore).toBe(computeOverallScore(damages).overallScore);
  });
});

describe('computeOverallScore — score ceilings for catastrophic damage', () => {
  // Regression case: this is the exact real-world mismatch that motivated
  // ceilings — an F-grade, "Unusable" phone with a shattered screen scored
  // 82 under pure additive deduction (crack=4 x High-multiplier=4, plus a
  // Moderate scratch). Ceilings ensure a catastrophic single defect can't be
  // diluted like that.
  it('regression: shattered screen + minor scratch scores at or below the crack ceiling', () => {
    const result = computeOverallScore([damage('crack', 'High'), damage('scratch', 'Moderate')]);
    expect(result.overallScore).toBeLessThanOrEqual(35);
    expect(result.scoreCeilingApplied).toBe(true);
    expect(result.ceilingReasons.some((r) => r.type === 'crack' && r.severity === 'High')).toBe(true);
  });

  it('a single High-severity crack dominates the score even with nothing else wrong', () => {
    const result = computeOverallScore([damage('crack', 'High')]);
    expect(result.overallScore).toBeLessThanOrEqual(35);
    expect(result.scoreCeilingApplied).toBe(true);
  });

  it('multiple catastrophic damages: the lowest ceiling wins', () => {
    // Additive score for these two (crack High + water damage High) is 28 —
    // already below crack's own ceiling (35), so water damage's ceiling
    // (15) is the one that actually binds and gets recorded. This mirrors
    // rules.ts's capReasons convention exactly: only a rule that strictly
    // improves on the current running value gets recorded as "applied".
    const result = computeOverallScore([damage('crack', 'High'), damage('water damage', 'High')]);
    expect(result.overallScore).toBeLessThanOrEqual(15);
    expect(result.scoreCeilingApplied).toBe(true);
    expect(result.ceilingReasons.some((r) => r.type === 'water damage' && r.ceiling === 15)).toBe(true);
  });

  it('purely cosmetic damage is untouched by ceiling logic', () => {
    const additiveOnly = computeOverallScore([damage('scratch', 'Low'), damage('scuff', 'Low')]);
    expect(additiveOnly.scoreCeilingApplied).toBe(false);
    expect(additiveOnly.ceilingReasons).toHaveLength(0);
  });

  it('a ceiling never raises a score that additive deduction already pushed below it', () => {
    const heavyDamage = Array.from({ length: 8 }, () => damage('missing_part', 'High')); // 8 * 5 * 4 = 160 deduction
    const additiveOnly = computeOverallScore(heavyDamage).overallScore;
    const withCrack = computeOverallScore([...heavyDamage, damage('crack', 'High')]);
    // Additive score is already 0 (clamped) — the 35 crack ceiling must not lift it back up.
    expect(additiveOnly).toBe(0);
    expect(withCrack.overallScore).toBe(0);
    expect(withCrack.scoreCeilingApplied).toBe(false);
  });

  it('clamps to >= 0 under absurd damage accumulation', () => {
    const damages = Array.from({ length: 50 }, () => damage('water_damage', 'High'));
    const result = computeOverallScore(damages);
    expect(result.overallScore).toBe(0);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});
