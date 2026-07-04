import { z } from 'zod';
import { CATEGORIES } from '../config/required-views.js';
import { conditionAnswersSchema } from './condition-answers.schema.js';

export const gradeMetadataSchema = z.object({
  customerId: z.string().min(1).max(128),
  sku: z.string().min(1).max(64).optional(),
  category: z.enum(CATEGORIES),
  returnReason: z.string().min(1).max(500),
  customerNotes: z.string().max(2000).default(''),
  idempotencyKey: z.string().min(8).max(128).optional(),
  conditionAnswers: z
    .string()
    .transform((s, ctx) => {
      try {
        const parsed = JSON.parse(s);
        const result = conditionAnswersSchema.safeParse(parsed);
        if (!result.success) {
          result.error.issues.forEach((issue) => ctx.addIssue(issue));
          return z.NEVER;
        }
        return result.data;
      } catch (err) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid JSON string for conditionAnswers',
        });
        return z.NEVER;
      }
    })
    .optional(),
});

export type GradeMetadata = z.infer<typeof gradeMetadataSchema>;
