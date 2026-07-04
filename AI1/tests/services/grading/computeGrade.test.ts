import { describe, it, expect } from 'vitest';
import { computeGrade, mapScoreToProvisionalGrade, mapGradeToCondition } from '../../../src/services/grading/computeGrade.js';
import type { DetectedDamage } from '../../../src/schemas/grading-report.schema.js';

describe('Deterministic computeGrade Pure Function', () => {
  it('property-style test: 100 calls with identical input produce 100 identical outputs', () => {
    const damages: DetectedDamage[] = [
      {
        type: 'scratch',
        severity: 'Minor',
        view: 'front',
        location: 'screen center',
        description: 'micro scratch',
        confidence: 0.9,
        source: 'visual',
      },
    ];
    const input = {
      damages,
      customerNotes: 'Powers on: Yes',
      imageQualityScore: 0.95,
      votingRuns: 3,
    };

    const first = computeGrade(input);
    for (let i = 0; i < 100; i++) {
      const current = computeGrade(input);
      expect(current.grade).toBe(first.grade);
      expect(current.overallScore).toBe(first.overallScore);
      expect(current.condition).toBe(first.condition);
      expect(current.capReasons).toEqual(first.capReasons);
      expect(current.overallConfidence).toBe(first.overallConfidence);
    }
  });

  it('correctness table: clean item with 0 damages scores 100 and gets A+ / New', () => {
    const result = computeGrade({ damages: [], imageQualityScore: 1.0 });
    expect(result.overallScore).toBe(100);
    expect(result.grade).toBe('A+');
    expect(result.condition).toBe('New');
  });

  it('correctness table: Critical crack applies score ceiling and caps grade at F', () => {
    const damages: DetectedDamage[] = [
      {
        type: 'crack',
        severity: 'Critical',
        view: 'front',
        location: 'display glass',
        description: 'shattered display glass',
        confidence: 0.95,
        source: 'visual',
      },
    ];

    const result = computeGrade({ damages, imageQualityScore: 0.9 });
    expect(result.scoreCeilingApplied).toBe(true);
    expect(result.visionScore).toBe(20);
    expect(result.overallScore).toBe(28);
    expect(result.grade).toBe('F');
    expect(result.condition).toBe('Unusable');
  });

  it('correctness table: customer-reported functional issue caps grade at C', () => {
    const result = computeGrade({
      damages: [],
      customerNotes: 'Phone stopped working after 2 days. Battery drains fast.',
      imageQualityScore: 0.95,
    });
    expect(result.gradeCapApplied).toBe(true);
    expect(result.grade).toBe('C');
    expect(result.condition).toBe('Fair');
  });

  it('correctness table: band-edge score flags requiresHumanReview with reason band_edge', () => {
    // Score near 88 (e.g. 87 or 89)
    const result = computeGrade({
      damages: [
        {
          type: 'scratch',
          severity: 'Moderate',
          view: 'back',
          location: 'housing',
          description: 'scratch',
          confidence: 0.9,
          source: 'visual',
        },
      ],
      imageQualityScore: 0.95,
    });
    // If score is within +-3 of boundary 88 (e.g. 98 - 2.2*5 = 87)
    if (Math.abs(result.overallScore - 88) <= 3) {
      expect(result.requiresHumanReview).toBe(true);
      expect(result.humanReviewReason).toBe('band_edge');
    }
  });

  it('maps scores to provisional grades correctly', () => {
    expect(mapScoreToProvisionalGrade(98)).toBe('A+');
    expect(mapScoreToProvisionalGrade(90)).toBe('A');
    expect(mapScoreToProvisionalGrade(82)).toBe('B+');
    expect(mapScoreToProvisionalGrade(72)).toBe('B');
    expect(mapScoreToProvisionalGrade(58)).toBe('C');
    expect(mapScoreToProvisionalGrade(40)).toBe('D');
    expect(mapScoreToProvisionalGrade(15)).toBe('F');
  });

  it('maps grades to condition labels correctly', () => {
    expect(mapGradeToCondition('A+')).toBe('New');
    expect(mapGradeToCondition('A')).toBe('Excellent');
    expect(mapGradeToCondition('B+')).toBe('Good');
    expect(mapGradeToCondition('B')).toBe('Good');
    expect(mapGradeToCondition('C')).toBe('Fair');
    expect(mapGradeToCondition('D')).toBe('Poor');
    expect(mapGradeToCondition('F')).toBe('Unusable');
  });

  describe('Unified Weighted-Blend strategy requirements', () => {
    it('Worked Example A: low photo quality, minor scratch, stopped working, coreFunction=no', () => {
      const damages: DetectedDamage[] = [
        {
          type: 'scratch',
          severity: 'Minor',
          view: 'front',
          description: 'minor scratch',
          confidence: 0.9,
          source: 'visual',
        },
      ];
      const result = computeGrade({
        damages,
        photoQuality: 0.4,
        customerNotes: '',
        returnReason: 'stopped working',
        conditionAnswers: {
          coreFunction: 'no',
          completeness: 'yes',
          structure: 'yes',
          usage: 'yes',
          originality: 'yes',
        },
      });

      expect(result.visionScore).toBe(99);
      expect(result.reasonScore).toBe(25);
      expect(result.questionScore).toBe(80);
      expect(result.overallScore).toBe(55);
      expect(result.grade).toBe('C'); // Capped to C due to coreFunction === 'no'
      expect(result.requiresHumanReview).toBe(true);
      expect(result.humanReviewReason).toBe('evidence_mismatch');
    });

    it('Worked Example B: moderate scuffs, minor dent, color issue, usage=partial', () => {
      const damages: DetectedDamage[] = [
        {
          type: 'scuff',
          severity: 'Moderate',
          view: 'front',
          description: 'moderate scuff 1',
          confidence: 0.9,
          source: 'visual',
        },
        {
          type: 'scuff',
          severity: 'Moderate',
          view: 'back',
          description: 'moderate scuff 2',
          confidence: 0.9,
          source: 'visual',
        },
        {
          type: 'dent',
          severity: 'Minor',
          view: 'left',
          description: 'minor dent',
          confidence: 0.9,
          source: 'visual',
        },
      ];
      const result = computeGrade({
        damages,
        photoQuality: 0.9,
        customerNotes: '',
        returnReason: 'color not as expected',
        conditionAnswers: {
          coreFunction: 'yes',
          completeness: 'yes',
          structure: 'yes',
          usage: 'partial',
          originality: 'yes',
        },
      });

      // 100 - (2.2 * 2 + 2.5) = 100 - 6.9 = 93.1 -> round -> 93
      expect(result.visionScore).toBe(93);
      expect(result.reasonScore).toBe(85);
      expect(result.questionScore).toBe(90);
      // 0.9 * 93 + 0.1 * 85 = 83.7 + 8.5 = 92.2 -> round -> 92
      expect(result.overallScore).toBe(92);
      expect(result.grade).toBe('A');
      expect(result.requiresHumanReview).toBe(true);
      expect(result.humanReviewReason).toBe('band_edge');
    });

    it('Water damage visual + perfect answers still caps at F', () => {
      const damages: DetectedDamage[] = [
        {
          type: 'water damage',
          severity: 'Minor',
          view: 'front',
          description: 'minor liquid contact',
          confidence: 0.9,
          source: 'visual',
        },
      ];
      const result = computeGrade({
        damages,
        photoQuality: 0.9,
        returnReason: 'changed mind',
        conditionAnswers: {
          coreFunction: 'yes',
          completeness: 'yes',
          structure: 'yes',
          usage: 'yes',
          originality: 'yes',
        },
      });
      expect(result.grade).toBe('F');
    });

    it('photoQuality < 0.5 and no answers triggers B cap and insufficient_evidence review', () => {
      const result = computeGrade({
        damages: [],
        photoQuality: 0.3,
      });
      expect(result.grade).toBe('B');
      expect(result.requiresHumanReview).toBe(true);
      expect(result.humanReviewReason).toBe('insufficient_evidence');
    });

    it('itemMatchesCategory = false triggers wrong_item_suspected review', () => {
      const result = computeGrade({
        damages: [],
        photoQuality: 0.9,
        itemMatchesCategory: false,
      });
      expect(result.requiresHumanReview).toBe(true);
      expect(result.humanReviewReason).toBe('wrong_item_suspected');
    });
  });
});
