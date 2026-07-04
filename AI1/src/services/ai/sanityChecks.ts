import type { DetectionResult } from '../../schemas/grading-report.schema.js';

export interface SanityCheckResult {
  valid: boolean;
  reasons: string[];
}

function normalizeView(damageView: string, viewSet: Set<string>): string | null {
  const lower = damageView.toLowerCase().trim();
  if (viewSet.has(lower)) return lower;
  for (const v of viewSet) {
    if (lower.includes(v) || v.includes(lower)) return v;
  }
  return null;
}

export function runSanityChecks(report: DetectionResult, uploadedViews: string[]): SanityCheckResult {
  const reasons: string[] = [];
  const viewSet = new Set(uploadedViews.map((v) => v.toLowerCase()));

  for (const damage of report.damages || []) {
    const normalized = normalizeView(damage.view, viewSet);
    if (!normalized && !damage.view.startsWith('closeup')) {
      reasons.push(
        `Damage references view '${damage.view}' which was not among the uploaded views (${[...viewSet].join(', ')}).`
      );
    } else if (normalized) {
      damage.view = normalized;
    }
    if (damage.boundingBox) {
      const { x, y, width, height } = damage.boundingBox;
      if (x < 0 || y < 0 || x + width > 1 || y + height > 1) {
        reasons.push(`Bounding box for damage '${damage.type}' is out of [0,1] range.`);
      }
    }
  }

  return { valid: reasons.length === 0, reasons };
}
