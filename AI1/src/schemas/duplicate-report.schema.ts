import { z } from 'zod';

export const duplicatePairSchema = z.object({
  viewA: z.string(),
  viewB: z.string(),
  hammingDistance: z.number(),
  classification: z.enum(['duplicate', 'suspicious', 'distinct']),
});

export type DuplicatePair = z.infer<typeof duplicatePairSchema>;

export const duplicateReportSchema = z.object({
  hasRejectedDuplicates: z.boolean(),
  rejectedPairs: z.array(duplicatePairSchema),
  suspiciousPairs: z.array(duplicatePairSchema),
  allPairs: z.array(duplicatePairSchema),
});

export type DuplicateReport = z.infer<typeof duplicateReportSchema>;
