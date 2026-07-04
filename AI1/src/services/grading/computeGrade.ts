import type {
  DetectedDamage,
  Grade,
  Condition,
} from '../../schemas/grading-report.schema.js';
import type { FinalReport } from '../../schemas/final-report.schema.js';
import type { ConditionAnswers } from '../../schemas/condition-answers.schema.js';
import { computeVisionScore } from './scoring.js';
import { applyGradeCaps } from './rules.js';
import { computeOverallConfidence, requiresHumanReview } from './confidence.js';
import { sanitizeCustomerNotes } from '../ai/promptBuilder.js';
import { computeReasonScore } from './reasonScore.js';
import { computeQuestionScore } from './questionScore.js';
import { blendScores } from './blend.js';

export interface ComputeGradeInput {
  damages: DetectedDamage[];
  customerNotes?: string;
  imageQualityScore?: number;
  votingRuns?: number;
  damagesDroppedByVoting?: Array<{
    type: string;
    view: string;
    location: string;
    description: string;
    agreementRate: number;
  }>;
  detectionFailedViews?: string[];
  itemMatchesCategory?: boolean;
  visibilityIssues?: string[];
  modelUsed?: 'gemini' | 'gemma';
  summary?: string;
  returnReason?: string;
  conditionAnswers?: ConditionAnswers;
  photoQuality?: number;
}

const BAND_BOUNDARIES = [95, 88, 78, 68, 50, 30];

export function mapScoreToProvisionalGrade(score: number): Grade {
  if (score >= 95) return 'A+';
  if (score >= 88) return 'A';
  if (score >= 78) return 'B+';
  if (score >= 68) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

export function mapGradeToCondition(grade: Grade): Condition {
  switch (grade) {
    case 'A+':
      return 'New';
    case 'A':
      return 'Excellent';
    case 'B+':
    case 'B':
      return 'Good';
    case 'C':
      return 'Fair';
    case 'D':
      return 'Poor';
    case 'F':
      return 'Unusable';
  }
}

export function isNearBandEdge(score: number, margin = 3): boolean {
  return BAND_BOUNDARIES.some((boundary) => Math.abs(score - boundary) <= margin);
}

/**
 * Pure function: grade = f(damageInventory, conditionAnswers/notes, imageQualityScore)
 * Identical inputs ALWAYS produce identical outputs.
 */
export function computeGrade(input: ComputeGradeInput): FinalReport {
  const damages = input.damages || [];
  const photoQuality = input.photoQuality ?? input.imageQualityScore ?? 0.9;
  const notes = sanitizeCustomerNotes(input.customerNotes || '');

  // 1. Vision channel score
  const visionResult = computeVisionScore(damages);
  const visionScore = visionResult.overallScore;

  // 2. Reason channel score
  const customerReportedDamages = damages.filter((d) => d.source === 'customer_reported');
  let { reasonScore, band: reasonBand } = computeReasonScore(
    input.returnReason ?? '',
    notes.sanitizedNotes,
    customerReportedDamages
  );

  // 3. Question channel score
  const questionResult = computeQuestionScore(input.conditionAnswers);
  const questionScore = questionResult.questionScore;

  // Mismatch refinement: if coreFunction === 'no' but reason band was COSMETIC/NO_DEFECT, override to MAJOR_FAILURE (25)
  let mismatchFlag = false;
  if (
    questionResult.answers.coreFunction === 'no' &&
    (reasonBand === 'COSMETIC' || reasonBand === 'NO_DEFECT')
  ) {
    reasonScore = 25;
    reasonBand = 'MAJOR_FAILURE';
    mismatchFlag = true;
  }

  // 4. Blend
  const reasonFinal = Math.min(reasonScore, questionScore);
  const blendResult = blendScores(visionScore, reasonFinal, photoQuality);
  const finalScore = blendResult.finalScore;

  // 5. Map score -> provisional grade
  const provisionalGrade = mapScoreToProvisionalGrade(finalScore);

  // 6. Apply letter-grade caps - caps only lower
  const capResult = applyGradeCaps(provisionalGrade, {
    damages,
    functionalIssueReported: notes.functionalIssueReported,
    imageQualityScore: photoQuality,
    answers: questionResult.answers,
    anyAnswered: questionResult.anyAnswered,
    photoQuality,
  });

  const finalGrade = capResult.grade;

  // 7. Derive condition label from final grade
  const condition = mapGradeToCondition(finalGrade);

  // 8. Overall confidence calculation
  const modelConf = damages.length > 0
    ? Math.max(...damages.map((d) => d.confidence))
    : 0.95;
  const overallConfidence = computeOverallConfidence(modelConf, damages, photoQuality);

  // 9. Human-review flags & priority order reason
  const gapMismatch = Math.abs(visionScore - reasonFinal) > 40;
  const wrongItem = input.itemMatchesCategory === false;
  const partialDetection = (input.detectionFailedViews && input.detectionFailedViews.length > 0) || false;
  const lowConfidence = overallConfidence < 0.65;
  const bandEdge = isNearBandEdge(finalScore, 3);
  const insufficientEvidence = capResult.insufficientEvidenceForced === true;

  let needsHumanReview = false;
  let humanReviewReason: string | undefined = undefined;

  if (wrongItem) {
    needsHumanReview = true;
    humanReviewReason = 'wrong_item_suspected';
  } else if (gapMismatch || mismatchFlag) {
    needsHumanReview = true;
    humanReviewReason = 'evidence_mismatch';
  } else if (insufficientEvidence) {
    needsHumanReview = true;
    humanReviewReason = 'insufficient_evidence';
  } else if (lowConfidence) {
    needsHumanReview = true;
    humanReviewReason = 'low_confidence';
  } else if (partialDetection) {
    needsHumanReview = true;
    humanReviewReason = 'partial_detection';
  } else if (bandEdge) {
    needsHumanReview = true;
    humanReviewReason = 'band_edge';
  }

  // Auto-generate summary if not provided
  const damageSummary = damages.length > 0
    ? `Detected ${damages.length} defect(s): ${damages.map((d) => `${d.severity} ${d.type} on ${d.view}`).join(', ')}.`
    : 'No defects detected visually.';
  const summaryText = input.summary || `${damageSummary} Overall condition: ${condition} (Grade ${finalGrade}).`;

  return {
    grade: finalGrade,
    condition,
    overallScore: finalScore,
    damages,
    rawGrade: provisionalGrade,
    gradeCapApplied: capResult.grade !== provisionalGrade,
    capReasons: capResult.capReasons,
    scoreCeilingApplied: visionResult.scoreCeilingApplied,
    ceilingReasons: visionResult.ceilingReasons,
    overallConfidence,
    requiresHumanReview: needsHumanReview,
    humanReviewReason,
    modelUsed: input.modelUsed ?? 'gemini',
    votingRuns: input.votingRuns ?? 1,
    damagesDroppedByVoting: input.damagesDroppedByVoting ?? [],
    detectionFailedViews: input.detectionFailedViews ?? [],
    itemMatchesCategory: input.itemMatchesCategory ?? true,
    visibilityIssues: input.visibilityIssues ?? [],
    summary: summaryText,
    visionScore,
    reasonScore,
    questionScore,
    reasonBand,
    blendWeight: blendResult.weightUsed,
    mismatchFlag,
  };
}
