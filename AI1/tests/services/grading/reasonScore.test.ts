import { describe, it, expect } from 'vitest';
import { computeReasonScore, REASON_BANDS } from '../../../src/services/grading/reasonScore.js';
import type { DetectedDamage } from '../../../src/schemas/grading-report.schema.js';

describe('computeReasonScore keyword band matching', () => {
  it('identifies SAFETY keyword correctly', () => {
    const res = computeReasonScore('It started to smoke', 'nothing else', []);
    expect(res.band).toBe('SAFETY');
    expect(res.reasonScore).toBe(5);
  });

  it('identifies MAJOR_FAILURE keyword and prefers it over cosmetic', () => {
    const res = computeReasonScore('stopped working but it has a minor scratch', '', []);
    expect(res.band).toBe('MAJOR_FAILURE');
    expect(res.reasonScore).toBe(25);
  });

  it('identifies PARTIAL_FAILURE keyword', () => {
    const res = computeReasonScore('accessory is missing', 'none', []);
    expect(res.band).toBe('PARTIAL_FAILURE');
    expect(res.reasonScore).toBe(47);
  });

  it('identifies MINOR_FUNCTIONAL keyword', () => {
    const res = computeReasonScore('battery drains fast', 'stitch is coming off', []);
    expect(res.band).toBe('MINOR_FUNCTIONAL');
    expect(res.reasonScore).toBe(67);
  });

  it('identifies COSMETIC keyword', () => {
    const res = computeReasonScore('packaging damaged', 'scuff mark on back', []);
    expect(res.band).toBe('COSMETIC');
    expect(res.reasonScore).toBe(85);
  });

  it('defaults to NO_DEFECT when no keyword matched', () => {
    const res = computeReasonScore('changed mind', 'perfect condition', []);
    expect(res.band).toBe('NO_DEFECT');
    expect(res.reasonScore).toBe(97);
  });

  it('tightens score when customer reported damages are present', () => {
    const damages: DetectedDamage[] = [
      {
        type: 'scratch',
        severity: 'Critical',
        view: 'front',
        description: 'deep scratch',
        confidence: 0.9,
        source: 'customer_reported',
      },
    ];
    // Critical scratch deduction is 25 (deductions logic: TYPE_WEIGHTS * SEVERITY_MULTIPLIER)
    // Let's assert min of NO_DEFECT (97) and (100 - deduction)
    const res = computeReasonScore('changed mind', '', damages);
    expect(res.band).toBe('NO_DEFECT');
    expect(res.reasonScore).toBeLessThan(97);
  });
});
