import type { NotesAnalysis } from '../ai/clients/types.js';
import type { DetectionResult } from '../../schemas/grading-report.schema.js';
import type { FinalReport } from '../../schemas/final-report.schema.js';
import { computeGrade } from './computeGrade.js';

export { computeGrade, mapScoreToProvisionalGrade, mapGradeToCondition } from './computeGrade.js';

export function applyGradingRules(
  report: DetectionResult,
  notes: NotesAnalysis,
  modelUsed: 'gemini' | 'gemma',
  _requestId?: string
): FinalReport {
  return computeGrade({
    damages: report.damages,
    customerNotes: notes.sanitizedNotes,
    imageQualityScore: report.imageQualityScore,
    itemMatchesCategory: report.itemMatchesCategory,
    visibilityIssues: report.visibilityIssues,
    modelUsed,
  });
}
