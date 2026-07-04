import type { View, Category } from '../../../config/required-views.js';

export interface GradingImageInput {
  view: View | string;
  buffer: Buffer;
  mimetype: string;
}

export interface NotesAnalysis {
  sanitizedNotes: string;
  functionalIssueReported: boolean;
}

export interface SingleViewDetectionInput {
  requestId: string;
  category: Category | string;
  returnReason: string;
  customerNotes?: string;
  image: GradingImageInput;
  priorAttemptErrors?: string;
}

export interface RawModelResponse {
  text: string;
  modelUsed: 'gemini' | 'gemma';
}

export interface VisionGrader {
  readonly name: 'gemini' | 'gemma';
  detectSingleView(input: SingleViewDetectionInput): Promise<RawModelResponse>;
}
