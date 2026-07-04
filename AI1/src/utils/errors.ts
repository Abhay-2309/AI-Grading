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

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
