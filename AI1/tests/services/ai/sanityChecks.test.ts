import { describe, it, expect } from 'vitest';
import { runSanityChecks } from '../../../src/services/ai/sanityChecks.js';
import type { DetectionResult } from '../../../src/schemas/grading-report.schema.js';

describe('runSanityChecks', () => {
  it('validates uploaded view matching and normalizes case', () => {
    const report: DetectionResult = {
      damages: [
        {
          type: 'scratch',
          severity: 'Minor',
          view: 'FRONT',
          location: 'upper screen',
          description: 'micro scratch',
          confidence: 0.9,
          source: 'visual',
        },
      ],
      itemMatchesCategory: true,
      visibilityIssues: [],
      imageQualityScore: 0.9,
    };
    const result = runSanityChecks(report, ['front', 'back']);
    expect(result.valid).toBe(true);
    expect(report.damages[0]!.view).toBe('front');
  });

  it('flags damage referencing an un-uploaded view', () => {
    const report: DetectionResult = {
      damages: [
        {
          type: 'scratch',
          severity: 'Minor',
          view: 'unknown_view_123',
          location: 'somewhere',
          description: 'scratch',
          confidence: 0.9,
          source: 'visual',
        },
      ],
      itemMatchesCategory: true,
      visibilityIssues: [],
      imageQualityScore: 0.9,
    };
    const result = runSanityChecks(report, ['front', 'back']);
    expect(result.valid).toBe(false);
  });
});
