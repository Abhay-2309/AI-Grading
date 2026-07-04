import type { FastifyRequest } from 'fastify';
import type { IntakeImage } from '../../schemas/intake-image.schema.js';
import { ValidationError } from '../../utils/errors.js';
import { IntakeService } from '../../services/intake/intake.service.js';

export interface ParsedMultipart {
  images: IntakeImage[];
  fields: Record<string, string>;
}

export async function parseMultipart(
  request: FastifyRequest,
  intakeService: IntakeService
): Promise<ParsedMultipart> {
  const images: IntakeImage[] = [];
  const fields: Record<string, string> = {};
  const seenFileFields = new Set<string>();

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      intakeService.validateFieldName(part.fieldname, seenFileFields);
      seenFileFields.add(part.fieldname);

      const buffer = await part.toBuffer();
      const image: IntakeImage = {
        field: part.fieldname,
        filename: part.filename,
        mimetype: part.mimetype,
        buffer,
        size: buffer.length,
      };
      await intakeService.validateMimeAndMagicBytes(image);
      images.push(image);
    } else {
      fields[part.fieldname] = part.value as string;
    }
  }

  if (images.length === 0) {
    throw new ValidationError('MISSING_REQUIRED_VIEWS', 'No images were uploaded.', {
      missingViews: [],
      requiredViews: [],
    });
  }

  return { images, fields };
}
