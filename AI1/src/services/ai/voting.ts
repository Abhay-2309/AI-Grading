import type { DetectedDamage, DamageSeverity, DetectionResult } from '../../schemas/grading-report.schema.js';
import { areSamePhysicalDamage, deduplicateCrossViewDamages } from './dedup.js';

export interface VotingConfig {
  runs: number;
}

export interface DroppedDamage {
  type: string;
  view: string;
  location: string;
  description: string;
  agreementRate: number;
}

export interface VoteMergeResult {
  votedDamages: DetectedDamage[];
  damagesDroppedByVoting: DroppedDamage[];
  votingRuns: number;
}

const SEVERITY_ORDER: Record<DamageSeverity, number> = {
  Minor: 1,
  Moderate: 2,
  High: 3,
  Critical: 4,
};

const SEVERITY_BY_RANK: DamageSeverity[] = ['Minor', 'Moderate', 'High', 'Critical'];

/**
 * Severity median calculation:
 * Ordered enum: Minor < Moderate < High < Critical.
 * Even count tie -> take the higher of the two middle values (round toward severity),
 * because under-grading damage is the costlier error in returns processing.
 */
export function calculateSeverityMedian(severities: DamageSeverity[]): DamageSeverity {
  if (severities.length === 0) return 'Minor';
  const ranks = severities.map((s) => SEVERITY_ORDER[s]!).sort((a, b) => a - b);
  const len = ranks.length;
  if (len % 2 === 1) {
    const midIdx = Math.floor(len / 2);
    return SEVERITY_BY_RANK[ranks[midIdx]! - 1]!;
  } else {
    // Even count tie -> take higher middle element (ceiling)
    const upperMidIdx = len / 2;
    return SEVERITY_BY_RANK[ranks[upperMidIdx]! - 1]!;
  }
}

/** Pure function to merge N detection runs using majority-vote logic */
export function voteMergeDamages(
  runsResults: DetectionResult[],
  config: VotingConfig = { runs: 3 }
): VoteMergeResult {
  const N = Math.max(1, config.runs);

  // Short-circuit N=1 with zero overhead
  if (N === 1 || runsResults.length <= 1) {
    const singleRunDamages = runsResults[0]?.damages || [];
    const deduped = deduplicateCrossViewDamages(singleRunDamages);
    const voted = deduped.map((d) => ({ ...d, agreementRate: 1.0 }));
    return {
      votedDamages: voted,
      damagesDroppedByVoting: [],
      votingRuns: 1,
    };
  }

  // Separate customer_reported damages (they bypass voting) from visual damages
  const visualDamagesByRun = runsResults.map((r) =>
    (r.damages || []).filter((d) => d.source !== 'customer_reported')
  );

  const customerReportedDamages = deduplicateCrossViewDamages(
    runsResults.flatMap((r) =>
      (r.damages || []).filter((d) => d.source === 'customer_reported')
    )
  ).map((d) => ({ ...d, agreementRate: 1.0 }));

  // Cluster visual damages across runs
  const clusters: DetectedDamage[][] = [];

  for (const runDamages of visualDamagesByRun) {
    const dedupedRunDamages = deduplicateCrossViewDamages(runDamages);

    for (const item of dedupedRunDamages) {
      const matchCluster = clusters.find((cluster) =>
        cluster.some((existing) => areSamePhysicalDamage(existing, item))
      );

      if (matchCluster) {
        matchCluster.push(item);
      } else {
        clusters.push([item]);
      }
    }
  }

  const threshold = Math.ceil(N / 2);
  const votedDamages: DetectedDamage[] = [];
  const damagesDroppedByVoting: DroppedDamage[] = [];

  for (const cluster of clusters) {
    const runCount = cluster.length;
    const agreementRate = Number((runCount / N).toFixed(2));

    if (runCount >= threshold) {
      const severities = cluster.map((d) => d.severity);
      const medianSev = calculateSeverityMedian(severities);
      const meanConfidence =
        cluster.reduce((sum, d) => sum + d.confidence, 0) / cluster.length;
      const finalConfidence = Number(
        (agreementRate * meanConfidence).toFixed(2)
      );

      const allViews = Array.from(
        new Set(cluster.flatMap((d) => d.views || [d.view]))
      );
      const representative = cluster[0]!;

      votedDamages.push({
        ...representative,
        severity: medianSev,
        confidence: Math.min(1, Math.max(0, finalConfidence)),
        views: allViews,
        agreementRate,
      });
    } else {
      const rep = cluster[0]!;
      damagesDroppedByVoting.push({
        type: rep.type,
        view: rep.view,
        location: rep.location,
        description: rep.description,
        agreementRate,
      });
    }
  }

  return {
    votedDamages: [...customerReportedDamages, ...votedDamages],
    damagesDroppedByVoting,
    votingRuns: N,
  };
}
