import { z } from 'zod';

// Letter grade values (computed in deterministic code via computeGrade)
export const GRADE_VALUES = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'] as const;
export type Grade = (typeof GRADE_VALUES)[number];

export const CONDITION_VALUES = ['New', 'Excellent', 'Good', 'Fair', 'Poor', 'Unusable'] as const;
export type Condition = (typeof CONDITION_VALUES)[number];

// Severity levels matching the detection-only model contract
export const damageSeveritySchema = z.enum(['Minor', 'Moderate', 'High', 'Critical']);
export type DamageSeverity = z.infer<typeof damageSeveritySchema>;

export const damageSourceSchema = z.enum(['visual', 'customer_reported']);
export type DamageSource = z.infer<typeof damageSourceSchema>;

export const boundingBoxSchema = z.object({
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(1000),
  width: z.number().min(0).max(1000),
  height: z.number().min(0).max(1000),
});

export const detectedDamageSchema = z.object({
  type: z.string().min(1),
  severity: damageSeveritySchema,
  view: z.string().min(1),
  location: z.string().max(120).default('general area'),
  boundingBox: boundingBoxSchema.optional(),
  description: z.string().max(300),
  confidence: z.number().min(0).max(1),
  source: damageSourceSchema.default('visual'),
  views: z.array(z.string()).optional(), // Populated after cross-view dedup / voting
  agreementRate: z.number().min(0).max(1).optional(), // Populated after voting
});

export type DetectedDamage = z.infer<typeof detectedDamageSchema>;

// Alias for codebase compatibility
export const damageSchema = detectedDamageSchema;
export type Damage = DetectedDamage;

// Perception result returned by the vision model (Single-view or aggregated detection)
export const detectionResultSchema = z.object({
  damages: z.array(detectedDamageSchema),
  itemMatchesCategory: z.boolean().default(true),
  visibilityIssues: z.array(z.string()).default([]),
  imageQualityScore: z.number().min(0).max(1).default(0.9),
});

export type DetectionResult = z.infer<typeof detectionResultSchema>;

// Legacy alias to keep repair.ts & existing callers stable during refactor
export const gradingReportSchema = detectionResultSchema;
export type GradingReport = DetectionResult;

// Gemini constrained decoding response schema for perception-only detection
export const GEMINI_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    damages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          severity: { type: 'string', enum: ['Minor', 'Moderate', 'High', 'Critical'] },
          view: { type: 'string' },
          location: { type: 'string' },
          description: { type: 'string' },
          confidence: { type: 'number' },
          source: { type: 'string', enum: ['visual', 'customer_reported'] },
          boundingBox: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
            },
            required: ['x', 'y', 'width', 'height'],
          },
        },
        required: ['type', 'severity', 'view', 'location', 'description', 'confidence'],
      },
    },
    itemMatchesCategory: { type: 'boolean' },
    visibilityIssues: {
      type: 'array',
      items: { type: 'string' },
    },
    imageQualityScore: { type: 'number' },
  },
  required: ['damages', 'itemMatchesCategory'],
} as const;
