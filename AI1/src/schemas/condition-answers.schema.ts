import { z } from 'zod';

export const answerValueSchema = z.enum(['yes', 'partial', 'no']);
export const conditionAnswersSchema = z.object({
  coreFunction: answerValueSchema.optional(),
  completeness: answerValueSchema.optional(),
  structure: answerValueSchema.optional(),
  usage: answerValueSchema.optional(),
  originality: answerValueSchema.optional(),
});
export type ConditionAnswers = z.infer<typeof conditionAnswersSchema>;
