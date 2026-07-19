import { logger } from '../../utils/logger.js';
import { gradingRepository } from '../db/repository.js';
import { getObjectBuffer } from '../storage/s3.js';
import { PythonGrader } from '../ai/clients/pythonGrader.js';
import { FallbackOrchestrator } from '../ai/orchestrator.js';
import { deduplicateCrossViewDamages } from '../ai/dedup.js';
import { voteMergeDamages } from '../ai/voting.js';
import { computeGrade, isNearBandEdge } from './computeGrade.js';
import { CategoryMismatchError, ModelUnavailableError } from '../../utils/errors.js';
import type { DetectionResult, DetectedDamage } from '../../schemas/grading-report.schema.js';
import type { SingleViewDetectionInput, GradingImageInput } from '../ai/clients/types.js';

const orchestrator = new FallbackOrchestrator(new PythonGrader());

function mimetypeFromKey(key: string): string {
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export interface RunSingleDetectionPassResult {
  runResult: DetectionResult;
  modelUsed: 'python' | 'gemma';
  failedViews: string[];
  successfulViewQualities: number[];
  successfulViewMatches: boolean[];
}

/**
 * Runs a single detection pass across all views, one view at a time.
 *
 * This *must* stay sequential rather than concurrent (e.g. Promise.allSettled):
 * the Python engine runs model inference synchronously inside its async route
 * handlers, which blocks its single event loop for the whole ~158s/view — so
 * concurrently-fired requests don't run in parallel there anyway, they just
 * queue up behind whichever view got there first. But each request's own
 * timeout clock (customDispatcher / MODEL_TIMEOUT_MS) starts counting the
 * instant it's *sent*, not when the engine actually starts working on it, so
 * a view queued behind others would get killed by its own timeout before the
 * engine ever got to it. Sending one at a time means a view's timeout clock
 * only starts once it's actually next in line.
 */
async function runSingleDetectionPass(
  requestId: string,
  category: string,
  returnReason: string,
  customerNotes: string,
  images: GradingImageInput[]
): Promise<RunSingleDetectionPassResult> {
  const settled: PromiseSettledResult<Awaited<ReturnType<typeof orchestrator.detectSingleView>>>[] = [];
  for (const img of images) {
    const input: SingleViewDetectionInput = {
      requestId,
      category,
      returnReason,
      customerNotes,
      image: img,
    };
    try {
      const value = await orchestrator.detectSingleView(input);
      settled.push({ status: 'fulfilled', value });
    } catch (reason) {
      settled.push({ status: 'rejected', reason });
    }
  }

  const damages: DetectedDamage[] = [];
  const failedViews: string[] = [];
  const visibilityIssues: string[] = [];
  let modelUsed: 'python' | 'gemma' = 'python';
  const successfulViewQualities: number[] = [];
  const successfulViewMatches: boolean[] = [];
  const mismatchReasons: string[] = [];

  for (let i = 0; i < settled.length; i++) {
    const viewName = images[i]!.view;
    const res = settled[i]!;

    if (res.status === 'fulfilled') {
      modelUsed = res.value.modelUsed;
      const det = res.value.result;
      if (det.damages) damages.push(...det.damages);
      if (det.visibilityIssues) visibilityIssues.push(...det.visibilityIssues);
      successfulViewQualities.push(det.imageQualityScore ?? 0.9);
      successfulViewMatches.push(det.itemMatchesCategory ?? true);
      if (det.categoryMismatchReason) mismatchReasons.push(det.categoryMismatchReason);
    } else {
      logger.error({ requestId, view: viewName, err: String(res.reason) }, 'detection failed for single view; aborting request');
      throw res.reason instanceof Error
        ? res.reason
        : new ModelUnavailableError(`Detection failed for view '${viewName}'.`, {
            requestId,
            view: viewName,
            reason: String(res.reason),
          });
    }
  }

  const avgQualityScore = successfulViewQualities.length > 0
    ? successfulViewQualities.reduce((sum, val) => sum + val, 0) / successfulViewQualities.length
    : 0.9;
  const itemMatchesCategory = successfulViewMatches.length > 0
    ? successfulViewMatches.every((v) => v)
    : true;

  const aggregatedResult: DetectionResult = {
    damages,
    itemMatchesCategory,
    categoryMismatchReason: mismatchReasons.length > 0 ? mismatchReasons.join(' ') : undefined,
    visibilityIssues: Array.from(new Set(visibilityIssues)),
    imageQualityScore: Number(avgQualityScore.toFixed(2)),
  };

  return {
    runResult: aggregatedResult,
    modelUsed,
    failedViews,
    successfulViewQualities,
    successfulViewMatches,
  };
}

export async function processRequest(requestId: string): Promise<void> {
  const log = logger.child({ requestId });
  const record = await gradingRepository.get(requestId);

  if (record.status !== 'VALIDATED') {
    log.warn({ status: record.status }, 'processRequest called on a non-VALIDATED request; skipping');
    return;
  }

  try {
    await gradingRepository.transitionStatus(requestId, 'VALIDATED', 'ANALYZING');

    const images: GradingImageInput[] = await Promise.all(
      record.images
        .filter((img) => img.s3KeyAnalysis)
        .map(async (img) => ({
          view: img.view,
          buffer: await getObjectBuffer(img.s3KeyAnalysis as string),
          mimetype: mimetypeFromKey(img.s3KeyAnalysis as string),
        }))
    );

    const votingRunsConfig = Number(process.env.DETECTION_VOTING_RUNS || '3');
    let targetRuns = Math.max(1, votingRunsConfig);

    const runResults: DetectionResult[] = [];
    let primaryModelUsed: 'python' | 'gemma' = 'python';
    const allFailedViews = new Set<string>();
    const allSuccessfulQualities: number[] = [];
    const allSuccessfulMatches: boolean[] = [];
    let categoryMismatchReason: string | undefined = undefined;

    for (let r = 0; r < targetRuns; r++) {
      const pass = await runSingleDetectionPass(
        requestId,
        record.category,
        record.returnReason,
        record.customerNotes,
        images
      );

      runResults.push(pass.runResult);
      primaryModelUsed = pass.modelUsed;
      pass.failedViews.forEach((v) => allFailedViews.add(v));
      pass.successfulViewQualities.forEach((q) => allSuccessfulQualities.push(q));
      pass.successfulViewMatches.forEach((m) => allSuccessfulMatches.push(m));
      if (pass.runResult.categoryMismatchReason) {
        categoryMismatchReason = pass.runResult.categoryMismatchReason;
      }
    }

    // Phase 3: Voting merge
    let voteResult = voteMergeDamages(runResults, { runs: runResults.length });
    let dedupedDamages = deduplicateCrossViewDamages(voteResult.votedDamages);

    const photoQuality = allSuccessfulQualities.length > 0
      ? Math.min(...allSuccessfulQualities)
      : 0.9;
    const itemMatchesCategory = allSuccessfulMatches.length > 0
      ? allSuccessfulMatches.every((v) => v)
      : true;

    if (!itemMatchesCategory) {
      throw new CategoryMismatchError(
        categoryMismatchReason || `Uploaded item does not match claimed category '${record.category}'.`,
        { requestId, category: record.category }
      );
    }

    // Initial computeGrade evaluation
    let finalReport = computeGrade({
      damages: dedupedDamages,
      customerNotes: record.customerNotes,
      returnReason: record.returnReason,
      conditionAnswers: record.conditionAnswers,
      photoQuality,
      imageQualityScore: photoQuality,
      votingRuns: voteResult.votingRuns,
      damagesDroppedByVoting: voteResult.damagesDroppedByVoting,
      detectionFailedViews: Array.from(allFailedViews),
      itemMatchesCategory,
      visibilityIssues: runResults[0]?.visibilityIssues ?? [],
      modelUsed: primaryModelUsed,
    });

    // Band-edge check: if N=1 and score lands within +-3 points of band boundary, re-run N=3 voting once
    if (targetRuns === 1 && isNearBandEdge(finalReport.overallScore, 3)) {
      log.info({ score: finalReport.overallScore }, 'score near band edge on N=1 run; executing N=3 voting re-run');
      for (let r = 1; r < 3; r++) {
        const pass = await runSingleDetectionPass(
          requestId,
          record.category,
          record.returnReason,
          record.customerNotes,
          images
        );
        runResults.push(pass.runResult);
        pass.failedViews.forEach((v) => allFailedViews.add(v));
        pass.successfulViewQualities.forEach((q) => allSuccessfulQualities.push(q));
        pass.successfulViewMatches.forEach((m) => allSuccessfulMatches.push(m));
      }

      voteResult = voteMergeDamages(runResults, { runs: 3 });
      dedupedDamages = deduplicateCrossViewDamages(voteResult.votedDamages);

      const rephotoQuality = allSuccessfulQualities.length > 0
        ? Math.min(...allSuccessfulQualities)
        : 0.9;
      const reitemMatchesCategory = allSuccessfulMatches.length > 0
        ? allSuccessfulMatches.every((v) => v)
        : true;

      finalReport = computeGrade({
        damages: dedupedDamages,
        customerNotes: record.customerNotes,
        returnReason: record.returnReason,
        conditionAnswers: record.conditionAnswers,
        photoQuality: rephotoQuality,
        imageQualityScore: rephotoQuality,
        votingRuns: 3,
        damagesDroppedByVoting: voteResult.damagesDroppedByVoting,
        detectionFailedViews: Array.from(allFailedViews),
        itemMatchesCategory: reitemMatchesCategory,
        visibilityIssues: runResults[0]?.visibilityIssues ?? [],
        modelUsed: primaryModelUsed,
      });

      if (isNearBandEdge(finalReport.overallScore, 3)) {
        finalReport.requiresHumanReview = true;
        finalReport.humanReviewReason = 'band_edge';
      }
    }

    await gradingRepository.transitionStatus(requestId, 'ANALYZING', 'GRADED', {
      finalReport,
      modelUsed: primaryModelUsed,
    });
    await gradingRepository.transitionStatus(requestId, 'GRADED', 'COMPLETED');

    log.info(
      { event: 'gradingComplete', grade: finalReport.grade, score: finalReport.overallScore, modelUsed: primaryModelUsed },
      'request graded deterministically'
    );
  } catch (err) {
    log.error({ err }, 'grading pipeline failed');
    try {
      const current = await gradingRepository.get(requestId);
      if (current.status !== 'FAILED' && current.status !== 'COMPLETED') {
        await gradingRepository.transitionStatus(requestId, current.status, 'FAILED', {
          failureReason: err instanceof Error ? err.message : String(err),
          failureCode: (err as { code?: string })?.code ?? 'INTERNAL_ERROR',
        });
      }
    } catch (transitionErr) {
      log.error({ transitionErr }, 'failed to mark request as FAILED after pipeline error');
    }
  }
}

export function enqueueProcessing(requestId: string): void {
  setImmediate(() => {
    processRequest(requestId).catch((err) => {
      logger.error({ requestId, err }, 'unhandled error kicking off processRequest');
    });
  });
}
