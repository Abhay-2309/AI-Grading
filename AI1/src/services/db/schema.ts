import type { Category } from '../../config/required-views.js';
import type { GradeMetadata } from '../../schemas/grade-request.schema.js';
import type { QualityCheckResult } from '../../schemas/quality-report.schema.js';
import type { DuplicateReport } from '../../schemas/duplicate-report.schema.js';
import type { FinalReport } from '../../schemas/final-report.schema.js';
import type { ConditionAnswers } from '../../schemas/condition-answers.schema.js';

export type RequestStatus =
  | 'UPLOADED'
  | 'VALIDATED'
  | 'FAILED'
  | 'ANALYZING'
  | 'GRADED'
  | 'COMPLETED';

export interface StatusHistoryEntry {
  status: RequestStatus;
  timestamp: string; // ISO 8601
  note?: string;
}

export interface StoredImageRecord {
  view: string;
  s3KeyOriginal: string;
  s3KeyAnalysis?: string;
  s3KeyThumb?: string;
  quality?: import('../../schemas/quality-report.schema.js').ImageQualityReport;
  phash?: string;
}

export interface GradingRequestRecord {
  requestId: string;
  customerId: string;
  sku?: string;
  category: Category;
  returnReason: string;
  customerNotes: string;
  idempotencyKey?: string;
  conditionAnswers?: ConditionAnswers;

  status: RequestStatus;
  statusHistory: StatusHistoryEntry[];

  images: StoredImageRecord[];
  qualityReport?: QualityCheckResult;
  duplicateReport?: DuplicateReport;

  failureReason?: string;
  failureCode?: string;

  modelUsed?: 'python' | 'gemma';
  finalReport?: FinalReport;

  /**
   * Security signals appended by the fraud-firewall middleware.
   * Written by grade.controller after DynamoDB record creation.
   * Example values: ['High_Risk_Geo']
   */
  securityFlags?: string[];

  createdAt: string;
  updatedAt: string;
}

// Legal state transitions — enforced by the repository via a DynamoDB
// conditional write so concurrent/retried writers can never corrupt state.
export const LEGAL_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  UPLOADED: ['VALIDATED', 'FAILED'],
  VALIDATED: ['ANALYZING', 'FAILED'],
  ANALYZING: ['GRADED', 'FAILED'],
  GRADED: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
};

export function metadataToRecord(
  requestId: string,
  metadata: GradeMetadata,
  now: string
): GradingRequestRecord {
  return {
    requestId,
    customerId: metadata.customerId,
    sku: metadata.sku,
    category: metadata.category,
    returnReason: metadata.returnReason,
    customerNotes: metadata.customerNotes,
    idempotencyKey: metadata.idempotencyKey,
    conditionAnswers: metadata.conditionAnswers,
    status: 'UPLOADED',
    statusHistory: [{ status: 'UPLOADED', timestamp: now }],
    images: [],
    createdAt: now,
    updatedAt: now,
  };
}
