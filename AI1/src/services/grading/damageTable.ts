import type { DamageSeverity } from '../../schemas/grading-report.schema.js';

const TYPE_WEIGHTS: Record<string, number> = {
  scratch: 1,
  scuff: 1,
  discoloration: 1.5,
  dent: 2.5,
  crack: 10,
  screen_damage: 10,
  chip: 2,
  stain: 1.5,
  tear: 3,
  missing_part: 5,
  tampering: 6,
  signs_of_repair: 5,
  water_damage: 8,
  functional: 3.5,
};

const SEVERITY_MULTIPLIER: Record<DamageSeverity, number> = {
  Minor: 1,
  Moderate: 2.2,
  High: 4,
  Critical: 6,
};

const DEFAULT_TYPE_WEIGHT = 2;

function lookupWeight(type: string): number {
  const key = type.toLowerCase().replace(/\s+/g, '_');
  for (const [k, w] of Object.entries(TYPE_WEIGHTS)) {
    if (key.includes(k)) return w;
  }
  return DEFAULT_TYPE_WEIGHT;
}

export function deductionFor(type: string, severity: DamageSeverity): number {
  const mult = SEVERITY_MULTIPLIER[severity] ?? 1;
  return lookupWeight(type) * mult;
}
