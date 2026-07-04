import type { DetectedDamage, DamageSeverity } from '../../schemas/grading-report.schema.js';

const SEVERITY_ORDER: Record<DamageSeverity, number> = {
  Minor: 1,
  Moderate: 2,
  High: 3,
  Critical: 4,
};

const SEVERITY_BY_RANK: DamageSeverity[] = ['Minor', 'Moderate', 'High', 'Critical'];

/** View adjacency graph */
const ADJACENCY_MAP: Record<string, Set<string>> = {
  front: new Set(['front', 'left', 'right', 'top', 'bottom']),
  back: new Set(['back', 'left', 'right', 'top', 'bottom']),
  left: new Set(['left', 'front', 'back', 'top', 'bottom']),
  right: new Set(['right', 'front', 'back', 'top', 'bottom']),
  top: new Set(['top', 'front', 'back', 'left', 'right']),
  bottom: new Set(['bottom', 'front', 'back', 'left', 'right']),
};

export function isAdjacentOrSameView(viewA: string, viewB: string): boolean {
  const a = viewA.toLowerCase().trim();
  const b = viewB.toLowerCase().trim();
  if (a === b) return true;
  if (a.startsWith('closeup') || b.startsWith('closeup')) return true;
  const setA = ADJACENCY_MAP[a];
  return setA ? setA.has(b) : true;
}

/** Levenshtein distance calculation */
export function levenshteinDistance(a: string, b: string): number {
  const strA = a.toLowerCase().trim();
  const strB = b.toLowerCase().trim();
  const m = strA.length;
  const n = strB.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = strA[i - 1] === strB[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost
      );
    }
  }

  return dp[m]![n]!;
}

/** Normalized similarity score between 0.0 and 1.0 */
export function textSimilarity(a: string, b: string): number {
  const strA = a.toLowerCase().trim();
  const strB = b.toLowerCase().trim();
  if (strA === strB) return 1.0;
  const maxLen = Math.max(strA.length, strB.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(strA, strB);
  return 1.0 - dist / maxLen;
}

export function areSamePhysicalDamage(
  a: DetectedDamage,
  b: DetectedDamage,
  similarityThreshold = 0.55
): boolean {
  // 1. Same damage type
  const typeA = a.type.toLowerCase().trim();
  const typeB = b.type.toLowerCase().trim();
  const typeMatches = typeA === typeB || typeA.includes(typeB) || typeB.includes(typeA);
  if (!typeMatches) return false;

  // 2. Same or adjacent view
  if (!isAdjacentOrSameView(a.view, b.view)) return false;

  // 3. Normalized Levenshtein similarity of location + description
  const textA = `${a.location} ${a.description}`;
  const textB = `${b.location} ${b.description}`;
  const sim = textSimilarity(textA, textB);

  return sim >= similarityThreshold;
}

export function maxSeverity(a: DamageSeverity, b: DamageSeverity): DamageSeverity {
  return SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b;
}

/** Pure function to deduplicate cross-view damage detections */
export function deduplicateCrossViewDamages(
  damages: DetectedDamage[],
  similarityThreshold = 0.55
): DetectedDamage[] {
  const result: DetectedDamage[] = [];

  for (const item of damages) {
    const existingIndex = result.findIndex((existing) =>
      areSamePhysicalDamage(existing, item, similarityThreshold)
    );

    if (existingIndex === -1) {
      const views = item.views ? [...item.views] : [item.view];
      result.push({
        ...item,
        views: Array.from(new Set(views)),
      });
    } else {
      const existing = result[existingIndex]!;
      const combinedViews = Array.from(
        new Set([...(existing.views || [existing.view]), item.view, ...(item.views || [])])
      );
      const higherSev = maxSeverity(existing.severity, item.severity);
      const higherConf = Math.max(existing.confidence, item.confidence);

      result[existingIndex] = {
        ...existing,
        severity: higherSev,
        confidence: higherConf,
        views: combinedViews,
        // keep longer description if clearer
        description:
          item.description.length > existing.description.length
            ? item.description
            : existing.description,
      };
    }
  }

  return result;
}
