import type { DetectedDamage, DamageSeverity, Grade } from '../../schemas/grading-report.schema.js';
import type { NormalizedAnswers } from './questionScore.js';

export type { DamageSeverity };

const GRADE_ORDER: Grade[] = ['F', 'D', 'C', 'B', 'B+', 'A', 'A+'];

function rank(g: Grade): number {
  return GRADE_ORDER.indexOf(g);
}

/** Returns the stricter (lower) of two grades. */
export function minGrade(a: Grade, b: Grade): Grade {
  return rank(a) <= rank(b) ? a : b;
}

export function hasDamage(
  damages: DetectedDamage[],
  typeKeyword: string,
  opts?: { severities?: DamageSeverity[] }
): boolean {
  const key = typeKeyword.toLowerCase();
  return damages.some((d) => {
    const matchesType = d.type.toLowerCase().includes(key);
    const matchesSeverity = opts?.severities ? opts.severities.includes(d.severity) : true;
    return matchesType && matchesSeverity;
  });
}

export interface CapContext {
  damages: DetectedDamage[];
  functionalIssueReported: boolean;
  imageQualityScore: number;
  answers?: NormalizedAnswers;
  anyAnswered: boolean;
  photoQuality: number;
}

export interface CapResult {
  grade: Grade;
  capReasons: string[];
  insufficientEvidenceForced?: boolean;
}

export function applyGradeCaps(provisionalGrade: Grade, ctx: CapContext): CapResult {
  let grade = provisionalGrade;
  const capReasons: string[] = [];
  let insufficientEvidenceForced = false;

  const cap = (candidate: Grade, reason: string) => {
    const next = minGrade(grade, candidate);
    if (next !== grade) capReasons.push(reason);
    grade = next;
  };

  const visualDamages = ctx.damages.filter((d) => d.source !== 'customer_reported');

  // 1. Water damage among VISUAL damages -> F
  if (hasDamage(visualDamages, 'water_damage') || hasDamage(visualDamages, 'water damage')) {
    cap('F', 'Water damage detected — capped to F.');
  }

  // 2. High/Critical crack or Critical screen_damage (visual) -> D
  if (hasDamage(visualDamages, 'crack', { severities: ['High', 'Critical'] }) || hasDamage(visualDamages, 'screen_damage', { severities: ['Critical'] })) {
    cap('D', 'High or Critical crack/screen damage detected — capped to D.');
  }

  // 3. Tampering / signs_of_repair (visual) -> D
  if (hasDamage(visualDamages, 'tampering') || hasDamage(visualDamages, 'signs_of_repair') || hasDamage(visualDamages, 'signs of repair')) {
    cap('D', 'Tampering or signs of repair detected — capped to D.');
  }

  // 4. answers.originality === 'no' -> D
  if (ctx.answers?.originality === 'no') {
    cap('D', 'Customer admitted repair/tampering — capped to D.');
  }

  // 5. answers.coreFunction === 'no' -> C
  if (ctx.answers?.coreFunction === 'no') {
    cap('C', 'Customer admitted core function failure — capped to C.');
  }

  // 6. answers.completeness === 'no' -> C
  if (ctx.answers?.completeness === 'no') {
    cap('C', 'Customer admitted essential part missing — capped to C.');
  }

  // 7. functionalIssueReported -> C
  if (ctx.functionalIssueReported) {
    cap('C', 'Customer-reported functional issue — capped to C.');
  }

  // 8. photoQuality < 0.5 && !anyAnswered -> B + force human review (insufficient_evidence)
  if (ctx.photoQuality < 0.5 && !ctx.anyAnswered) {
    cap('B', 'Low photo quality with no condition answers — capped to B.');
    insufficientEvidenceForced = true;
  }

  // 9. imageQualityScore < 0.7 -> B
  if (ctx.imageQualityScore < 0.7) {
    cap('B', 'Low image quality prevents full verification — capped to B.');
  }

  return { grade, capReasons, insufficientEvidenceForced };
}
