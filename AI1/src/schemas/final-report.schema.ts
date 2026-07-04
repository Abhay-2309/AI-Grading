import { z } from 'zod';
import {
  GRADE_VALUES,
  CONDITION_VALUES,
  damageSeveritySchema,
  detectedDamageSchema,
} from './grading-report.schema.js';

const ceilingReasonSchema = z.object({
  type: z.string(),
  severity: damageSeveritySchema,
  ceiling: z.number(),
});

const droppedDamageSchema = z.object({
  type: z.string(),
  view: z.string(),
  location: z.string(),
  description: z.string(),
  agreementRate: z.number(),
});

export const finalReportSchema = z.object({
  grade: z.enum(GRADE_VALUES),
  condition: z.enum(CONDITION_VALUES),
  overallScore: z.number().min(0).max(100),
  damages: z.array(detectedDamageSchema),
  rawGrade: z.enum(GRADE_VALUES).optional(),
  gradeCapApplied: z.boolean().default(false),
  capReasons: z.array(z.string()).default([]),
  scoreCeilingApplied: z.boolean().default(false),
  ceilingReasons: z.array(ceilingReasonSchema).default([]),
  overallConfidence: z.number().min(0).max(1),
  requiresHumanReview: z.boolean(),
  humanReviewReason: z.string().optional(),
  modelUsed: z.enum(['gemini', 'gemma']),
  votingRuns: z.number().default(1),
  damagesDroppedByVoting: z.array(droppedDamageSchema).default([]),
  detectionFailedViews: z.array(z.string()).default([]),
  itemMatchesCategory: z.boolean().default(true),
  visibilityIssues: z.array(z.string()).default([]),
  summary: z.string().default(''),
  visionScore: z.number().min(0).max(100).default(100),
  reasonScore: z.number().min(0).max(100).default(100),
  questionScore: z.number().min(0).max(100).default(100),
  reasonBand: z.string().default('NO_DEFECT'),
  blendWeight: z.number().min(0).max(1).default(0.9),
  mismatchFlag: z.boolean().default(false),
});

export type FinalReport = z.infer<typeof finalReportSchema>;
