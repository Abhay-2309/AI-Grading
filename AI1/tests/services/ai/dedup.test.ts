import { describe, it, expect } from 'vitest';
import { deduplicateCrossViewDamages, textSimilarity, isAdjacentOrSameView } from '../../../src/services/ai/dedup.js';
import type { DetectedDamage } from '../../../src/schemas/grading-report.schema.js';

describe('Cross-View Deduplication', () => {
  it('correctly calculates text similarity', () => {
    expect(textSimilarity('upper left back panel', 'upper left back panel')).toBe(1.0);
    expect(textSimilarity('upper left back panel', 'upper left of back panel')).toBeGreaterThan(0.7);
    expect(textSimilarity('screen crack', 'bottom edge scratch')).toBeLessThan(0.4);
  });

  it('detects adjacent or same views', () => {
    expect(isAdjacentOrSameView('front', 'front')).toBe(true);
    expect(isAdjacentOrSameView('front', 'left')).toBe(true);
    expect(isAdjacentOrSameView('front', 'right')).toBe(true);
    expect(isAdjacentOrSameView('top', 'bottom')).toBe(false);
  });

  it('merges same crack seen from front and left with max severity and views unioned', () => {
    const damages: DetectedDamage[] = [
      {
        type: 'crack',
        severity: 'Moderate',
        view: 'front',
        location: 'upper right screen corner',
        description: 'deep hairline glass crack',
        confidence: 0.8,
        source: 'visual',
      },
      {
        type: 'crack',
        severity: 'High',
        view: 'left',
        location: 'upper right screen corner',
        description: 'deep hairline glass crack',
        confidence: 0.95,
        source: 'visual',
      },
    ];

    const deduped = deduplicateCrossViewDamages(damages);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]!.severity).toBe('High');
    expect(deduped[0]!.confidence).toBe(0.95);
    expect(deduped[0]!.views).toEqual(expect.arrayContaining(['front', 'left']));
  });

  it('does NOT merge different damage types at the same location', () => {
    const damages: DetectedDamage[] = [
      {
        type: 'crack',
        severity: 'High',
        view: 'front',
        location: 'upper right screen corner',
        description: 'deep hairline glass crack',
        confidence: 0.9,
        source: 'visual',
      },
      {
        type: 'dent',
        severity: 'Moderate',
        view: 'front',
        location: 'upper right screen corner',
        description: 'deep hairline glass crack',
        confidence: 0.85,
        source: 'visual',
      },
    ];

    const deduped = deduplicateCrossViewDamages(damages);
    expect(deduped).toHaveLength(2);
  });
});
