import { describe, it, expect } from 'vitest';
import { applyGradeCaps, hasDamage, minGrade } from '../../../src/services/grading/rules.js';
import type { DetectedDamage } from '../../../src/schemas/grading-report.schema.js';

function damage(type: string, severity: 'Minor' | 'Moderate' | 'High' | 'Critical'): DetectedDamage {
  return {
    type,
    severity,
    view: 'front',
    location: 'test',
    description: 'test damage',
    confidence: 0.9,
    source: 'visual',
  };
}

describe('minGrade', () => {
  it('prefers the lower grade', () => {
    expect(minGrade('A+', 'A')).toBe('A');
    expect(minGrade('A', 'B+')).toBe('B+');
    expect(minGrade('B', 'C')).toBe('C');
    expect(minGrade('C', 'D')).toBe('D');
    expect(minGrade('D', 'F')).toBe('F');
    expect(minGrade('F', 'A+')).toBe('F');
  });
});

describe('hasDamage', () => {
  it('matches by keyword substring', () => {
    const damages = [damage('water_damage', 'High')];
    expect(hasDamage(damages, 'water')).toBe(true);
    expect(hasDamage(damages, 'crack')).toBe(false);
  });

  it('matches by severity when specified', () => {
    const damages = [damage('crack', 'Minor')];
    expect(hasDamage(damages, 'crack', { severities: ['High'] })).toBe(false);
    expect(hasDamage(damages, 'crack', { severities: ['Minor'] })).toBe(true);
  });
});

describe('applyGradeCaps', () => {
  it('water damage caps to F', () => {
    const result = applyGradeCaps('A+', {
      damages: [damage('water_damage', 'High')],
      functionalIssueReported: false,
      imageQualityScore: 0.9,
    });
    expect(result.grade).toBe('F');
    expect(result.capReasons.some((r) => /water damage/i.test(r))).toBe(true);
  });

  it('high crack caps to D', () => {
    const result = applyGradeCaps('A', {
      damages: [damage('crack', 'High')],
      functionalIssueReported: false,
      imageQualityScore: 0.9,
    });
    expect(result.grade).toBe('D');
  });
});
