import { describe, it, expect } from 'vitest';
import { applyGradingRules, computeGrade } from '../../../src/services/grading/engine.js';
import type { DetectionResult } from '../../../src/schemas/grading-report.schema.js';

const noNotes = { sanitizedNotes: '', functionalIssueReported: false };

describe('applyGradingRules & computeGrade', () => {
  it('computes Grade A+ for clean items with 0 damages', () => {
    const report: DetectionResult = {
      damages: [],
      itemMatchesCategory: true,
      visibilityIssues: [],
      imageQualityScore: 1.0,
    };

    const result = applyGradingRules(report, noNotes, 'gemini');
    expect(result.grade).toBe('A+');
    expect(result.overallScore).toBe(100);
    expect(result.condition).toBe('New');
  });

  it('computes Grade D/F for items with Critical damage', () => {
    const report: DetectionResult = {
      damages: [
        {
          type: 'crack',
          severity: 'Critical',
          view: 'front',
          location: 'display',
          description: 'shattered screen',
          confidence: 0.95,
          source: 'visual',
        },
      ],
      itemMatchesCategory: true,
      visibilityIssues: [],
      imageQualityScore: 0.9,
    };

    const result = applyGradingRules(report, noNotes, 'gemini');
    expect(result.scoreCeilingApplied).toBe(true);
    expect(result.overallScore).toBe(28);
    expect(['D', 'F']).toContain(result.grade);
  });
});
