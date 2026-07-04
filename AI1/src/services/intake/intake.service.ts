import { fileTypeFromBuffer } from 'file-type';
import { gradeMetadataSchema, type GradeMetadata } from '../../schemas/grade-request.schema.js';
import type { IntakeImage } from '../../schemas/intake-image.schema.js';
import { ValidationError } from '../../utils/errors.js';
import { isImageField, REQUIRED_VIEWS } from '../../config/required-views.js';
import type { IdempotencyStore } from './idempotency.store.js';
import type { Config } from '../../config/config.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface ParsedIntakeRequest {
  images: IntakeImage[];
  metadata: GradeMetadata;
}

export interface IntakeResult {
  requestId: string;
  replayed: boolean;
}

export class IntakeService {
  constructor(
    private readonly idempotencyStore: IdempotencyStore,
    private readonly config: Config
  ) {}

  /** Validates raw field name / mimetype for a single incoming file part. */
  validateFieldName(field: string, seen: Set<string>): void {
    if (!isImageField(field)) {
      throw new ValidationError('UNKNOWN_IMAGE_FIELD', `Unknown image field '${field}'.`, {
        field,
      });
    }
    if (seen.has(field)) {
      throw new ValidationError('DUPLICATE_FIELD', `Field '${field}' was submitted more than once.`, {
        field,
      });
    }
  }

  async validateMimeAndMagicBytes(image: IntakeImage): Promise<void> {
    if (!ALLOWED_MIME_TYPES.has(image.mimetype)) {
      throw new ValidationError(
        'UNSUPPORTED_MEDIA_TYPE',
        `Unsupported media type '${image.mimetype}' for field '${image.field}'.`,
        { field: image.field, receivedMimetype: image.mimetype }
      );
    }

    const detected = await fileTypeFromBuffer(image.buffer);
    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
      throw new ValidationError(
        'CORRUPTED_OR_MISMATCHED_FILE',
        `File content for '${image.field}' does not match its declared type, or is corrupted.`,
        {
          field: image.field,
          declaredMimetype: image.mimetype,
          detectedMimetype: detected?.mime ?? null,
        }
      );
    }
  }

  validateMetadata(raw: Record<string, string>): GradeMetadata {
    const parsed = gradeMetadataSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ValidationError('INVALID_METADATA', 'Request metadata failed validation.', {
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }
    return parsed.data;
  }

  validateRequiredViews(images: IntakeImage[], metadata: GradeMetadata): void {
    // Required fields may be base view names or closeup_N slots (some
    // subcategories require a targeted closeup instead of a generic angle),
    // so check against every present image field, not just the base views.
    const presentFields = new Set(images.map((img) => img.field));
    const required = REQUIRED_VIEWS[metadata.category];
    const missingViews = required.filter((v) => !presentFields.has(v));

    if (missingViews.length > 0) {
      throw new ValidationError(
        'MISSING_REQUIRED_VIEWS',
        `Required image views are missing for category '${metadata.category}'.`,
        { missingViews, requiredViews: required }
      );
    }
  }

  async checkIdempotency(idempotencyKey: string | undefined): Promise<string | undefined> {
    if (!idempotencyKey) return undefined;
    return this.idempotencyStore.get(idempotencyKey);
  }

  async recordIdempotencyKey(idempotencyKey: string | undefined, requestId: string): Promise<void> {
    if (!idempotencyKey) return;
    await this.idempotencyStore.set(idempotencyKey, requestId, this.config.IDEMPOTENCY_TTL_SECONDS);
  }
}
