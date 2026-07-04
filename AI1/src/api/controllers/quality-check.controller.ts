import type { FastifyReply, FastifyRequest } from 'fastify';
import { IntakeService } from '../../services/intake/intake.service.js';
import { InMemoryIdempotencyStore } from '../../services/intake/idempotency.store.js';
import { config } from '../../config/config.js';
import { parseMultipart } from './parseMultipart.js';
import { assessBatchQuality } from '../../services/validation/quality.js';
import { detectDuplicates } from '../../services/validation/duplicates.js';
import { CATEGORIES } from '../../config/required-views.js';

// Same validation code path as /grade, minus persistence and the AI call —
// lets the frontend pre-validate uploads as the customer selects photos,
// so bad photos get fixed before the customer ever submits.
const intakeService = new IntakeService(new InMemoryIdempotencyStore(), config);

export async function qualityCheckHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { images, fields } = await parseMultipart(request, intakeService);
  const category = CATEGORIES.find((c) => c === fields.category);

  const { reports: qualityReports } = await assessBatchQuality(
    images.map((i) => ({ view: i.field, buffer: i.buffer })),
    category
  );
  const { report: duplicateReport } = await detectDuplicates(
    images.map((i) => ({ view: i.field, buffer: i.buffer }))
  );

  const overallPassed = qualityReports.every((r) => r.passed) && !duplicateReport.hasRejectedDuplicates;
  const qualityScore = qualityReports.length
    ? qualityReports.filter((r) => r.passed).length / qualityReports.length
    : 0;

  reply.status(200).send({
    success: true,
    overallPassed,
    qualityScore,
    images: qualityReports,
    duplicateReport,
  });
}
