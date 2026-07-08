export type ErrorCode =
  | 'FILE_TOO_LARGE'
  | 'TOO_MANY_FILES'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'CORRUPTED_OR_MISMATCHED_FILE'
  | 'UNKNOWN_IMAGE_FIELD'
  | 'DUPLICATE_FIELD'
  | 'INVALID_METADATA'
  | 'MISSING_REQUIRED_VIEWS'
  | 'DUPLICATE_IMAGES'
  | 'QUALITY_VALIDATION_FAILED'
  | 'REQUEST_NOT_FOUND'
  | 'INVALID_STATE_TRANSITION'
  | 'MODEL_QUOTA_EXCEEDED'
  | 'MODEL_UNAVAILABLE'
  | 'MODEL_OUTPUT_INVALID'
  | 'STORAGE_ERROR'
  | 'RATE_LIMITED'
  | 'FRAUD_BLOCK'
  | 'VELOCITY_EXCEEDED'
  | 'CATEGORY_MISMATCH'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, message, 400, details);
  }
}

export class DuplicateImageError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('DUPLICATE_IMAGES', message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('REQUEST_NOT_FOUND', message, 404, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('RATE_LIMITED', message, 429, details);
  }
}

export class StorageError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('STORAGE_ERROR', message, 500, details);
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_STATE_TRANSITION', message, 409, details);
  }
}

// ── AI-layer errors ─────────────────────────────────────────────────
export class ModelQuotaError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('MODEL_QUOTA_EXCEEDED', message, 429, details);
  }
}

export class ModelUnavailableError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('MODEL_UNAVAILABLE', message, 503, details);
  }
}

export class ModelOutputError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('MODEL_OUTPUT_INVALID', message, 502, details);
  }
}

/**
 * Thrown by the grading pipeline when the vision model detects that the
 * uploaded item does not match the claimed category. This halts the pipeline
 * before a grade is computed — the request is marked FAILED rather than
 * silently flagged for human review.
 */
export class CategoryMismatchError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CATEGORY_MISMATCH', message, 422, details);
  }
}

export function isAppError(err: any): err is AppError {
  return err && (err instanceof AppError || (typeof err.code === 'string' && typeof err.statusCode === 'number'));
}

// ── Fraud Firewall errors ────────────────────────────────────────────

export type FraudReason =
  | 'VELOCITY_EXCEEDED'
  | 'MISSING_USER_AGENT'
  | 'HIGH_RISK_GEO';

/**
 * Thrown by the fraud-firewall middleware when a request is blocked.
 * The error handler serialises this as { status: "FRAUD_FLAG", reason: "..." }
 * instead of the standard AppError envelope.
 */
export class FraudBlockError extends AppError {
  readonly fraudReason: FraudReason;

  constructor(reason: FraudReason, details?: Record<string, unknown>) {
    const isVelocity = reason === 'VELOCITY_EXCEEDED';
    super(
      isVelocity ? 'VELOCITY_EXCEEDED' : 'FRAUD_BLOCK',
      `Request blocked by fraud firewall: ${reason}`,
      isVelocity ? 429 : 403,
      details
    );
    this.fraudReason = reason;
  }
}

export function isFraudBlockError(err: any): err is FraudBlockError {
  return err && (err instanceof FraudBlockError || err.code === 'FRAUD_BLOCK' || err.code === 'VELOCITY_EXCEEDED');
}
