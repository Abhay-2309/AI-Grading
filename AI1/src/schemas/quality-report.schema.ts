import { z } from 'zod';

export const imageQualityScoresSchema = z.object({
  blur: z.number(),
  brightness: z.number(),
  contrast: z.number(),
  resolution: z.tuple([z.number(), z.number()]),
});

export const imageQualityReportSchema = z.object({
  view: z.string(),
  passed: z.boolean(),
  scores: imageQualityScoresSchema,
  failures: z.array(z.string()),
});

export type ImageQualityReport = z.infer<typeof imageQualityReportSchema>;

export const qualityCheckResultSchema = z.object({
  overallPassed: z.boolean(),
  qualityScore: z.number().min(0).max(1),
  images: z.array(imageQualityReportSchema),
});

export type QualityCheckResult = z.infer<typeof qualityCheckResultSchema>;
