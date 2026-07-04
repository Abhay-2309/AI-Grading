import { deductionFor } from './damageTable.js';
import type { DetectedDamage, DamageSeverity } from '../../schemas/grading-report.schema.js';

export const SCORE_CEILINGS: Record<string, Partial<Record<DamageSeverity, number>>> = {
  crack: { High: 35, Critical: 20 },
  screen_damage: { High: 35, Critical: 20 },
  water_damage: { Moderate: 30, High: 15, Critical: 0 },
  tampering: { High: 30, Critical: 20 },
  signs_of_repair: { High: 40, Critical: 25 },
  functional: { High: 40, Critical: 20 },
};

export interface CeilingReason {
  type: string;
  severity: DamageSeverity;
  ceiling: number;
}

export interface ScoreResult {
  overallScore: number;
  scoreCeilingApplied: boolean;
  ceilingReasons: CeilingReason[];
}

function normalizeType(type: string): string {
  return type.toLowerCase().replace(/\s+/g, '_');
}

function matchedCeilingsFor(damages: DetectedDamage[]): CeilingReason[] {
  const matches: CeilingReason[] = [];
  for (const d of damages) {
    const key = normalizeType(d.type);
    for (const [ceilingType, severityMap] of Object.entries(SCORE_CEILINGS)) {
      if (!key.includes(ceilingType)) continue;
      const ceiling = severityMap[d.severity];
      if (ceiling !== undefined) {
        matches.push({ type: d.type, severity: d.severity, ceiling });
      }
    }
  }
  return matches;
}

export function computeOverallScore(damages: DetectedDamage[]): ScoreResult {
  const totalDeduction = damages.reduce((sum, d) => sum + deductionFor(d.type, d.severity), 0);
  const additiveScore = Math.max(0, Math.min(100, Math.round(100 - totalDeduction)));

  const matches = matchedCeilingsFor(damages);

  let score = additiveScore;
  const ceilingReasons: CeilingReason[] = [];
  for (const match of matches) {
    if (match.ceiling < score) {
      ceilingReasons.push(match);
      score = match.ceiling;
    }
  }
  score = Math.max(0, Math.min(100, score));

  return {
    overallScore: score,
    scoreCeilingApplied: ceilingReasons.length > 0,
    ceilingReasons,
  };
}

export function computeVisionScore(damages: DetectedDamage[]): ScoreResult {
  const visionDamages = damages.filter((d) => d.source !== 'customer_reported');
  return computeOverallScore(visionDamages);
}
