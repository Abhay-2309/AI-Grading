import { describe, it, expect } from 'vitest';
import { voteMergeDamages, calculateSeverityMedian } from '../../../src/services/ai/voting.js';
import type { DetectionResult, DetectedDamage } from '../../../src/schemas/grading-report.schema.js';

describe('N-Run Self-Consistency Voting Layer', () => {
  it('correctly computes severity median with even-count round-up rule', () => {
    expect(calculateSeverityMedian(['Minor', 'Moderate', 'High'])).toBe('Moderate');
    // Even count tie [Moderate, High] -> takes higher middle element High
    expect(calculateSeverityMedian(['Moderate', 'High'])).toBe('High');
    expect(calculateSeverityMedian(['Minor', 'Critical'])).toBe('Critical');
  });

  it('short-circuits N=1 with zero overhead', () => {
    const singleRun: DetectionResult = {
      damages: [
        {
          type: 'scratch',
          severity: 'Minor',
          view: 'front',
          location: 'center screen',
          description: 'micro scratch',
          confidence: 0.9,
          source: 'visual',
        },
      ],
      itemMatchesCategory: true,
      visibilityIssues: [],
      imageQualityScore: 0.95,
    };

    const res = voteMergeDamages([singleRun], { runs: 1 });
    expect(res.votingRuns).toBe(1);
    expect(res.votedDamages).toHaveLength(1);
    expect(res.votedDamages[0]!.agreementRate).toBe(1.0);
    expect(res.damagesDroppedByVoting).toHaveLength(0);
  });

  it('keeps damage appearing in 2 of 3 runs and drops damage appearing in 1 of 3 runs', () => {
    const damageA: DetectedDamage = {
      type: 'crack',
      severity: 'High',
      view: 'front',
      location: 'screen center',
      description: 'deep glass crack across screen',
      confidence: 0.9,
      source: 'visual',
    };

    const damageB: DetectedDamage = {
      type: 'stain',
      severity: 'Minor',
      view: 'back',
      location: 'camera ring edge',
      description: 'temporary dust smudge',
      confidence: 0.5,
      source: 'visual',
    };

    const run1: DetectionResult = { damages: [damageA, damageB], itemMatchesCategory: true, visibilityIssues: [], imageQualityScore: 0.9 };
    const run2: DetectionResult = { damages: [damageA], itemMatchesCategory: true, visibilityIssues: [], imageQualityScore: 0.9 };
    const run3: DetectionResult = { damages: [], itemMatchesCategory: true, visibilityIssues: [], imageQualityScore: 0.9 };

    const res = voteMergeDamages([run1, run2, run3], { runs: 3 });
    expect(res.votingRuns).toBe(3);
    expect(res.votedDamages).toHaveLength(1); // damageA kept (2/3)
    expect(res.votedDamages[0]!.type).toBe('crack');
    expect(res.votedDamages[0]!.agreementRate).toBe(0.67);

    expect(res.damagesDroppedByVoting).toHaveLength(1); // damageB dropped (1/3)
    expect(res.damagesDroppedByVoting[0]!.type).toBe('stain');
  });

  it('customer_reported damages bypass voting and are kept', () => {
    const reported: DetectedDamage = {
      type: 'functional',
      severity: 'High',
      view: 'front',
      location: 'internal battery',
      description: 'battery drains fast',
      confidence: 0.6,
      source: 'customer_reported',
    };

    const run1: DetectionResult = { damages: [reported], itemMatchesCategory: true, visibilityIssues: [], imageQualityScore: 0.9 };

    const res = voteMergeDamages([run1], { runs: 3 });
    expect(res.votedDamages).toHaveLength(1);
    expect(res.votedDamages[0]!.source).toBe('customer_reported');
  });
});
