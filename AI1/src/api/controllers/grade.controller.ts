import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { IntakeService } from '../../services/intake/intake.service.js';
import { parseMultipart } from './parseMultipart.js';
import { assessBatchQuality } from '../../services/validation/quality.js';
import { detectDuplicates } from '../../services/validation/duplicates.js';
import { gradingRepository } from '../../services/db/repository.js';
import { metadataToRecord, type StoredImageRecord } from '../../services/db/schema.js';
import {
  uploadOriginal,
  uploadAnalysisVariant,
  uploadThumbnail,
  uploadRejected,
} from '../../services/storage/s3.js';
import { enqueueProcessing } from '../../services/grading/pipeline.js';
import { RateLimiter } from '../../services/intake/rateLimiter.js';
import { config } from '../../config/config.js';
import type { QualityCheckResult } from '../../schemas/quality-report.schema.js';

const rateLimiter = new RateLimiter(config.RATE_LIMIT_MAX, config.RATE_LIMIT_WINDOW_SECONDS);

function buildQualityResult(reports: QualityCheckResult['images']): QualityCheckResult {
  const overallPassed = reports.every((r) => r.passed);
  const qualityScore = reports.length
    ? reports.filter((r) => r.passed).length / reports.length
    : 0;
  return { overallPassed, qualityScore, images: reports };
}

export async function gradeHandler(
  this: { intakeService: IntakeService },
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { images, fields } = await parseMultipart(request, this.intakeService);
  const metadata = this.intakeService.validateMetadata(fields);

  rateLimiter.check(metadata.customerId);

  this.intakeService.validateRequiredViews(images, metadata);

  const existingRequestId = await this.intakeService.checkIdempotency(metadata.idempotencyKey);
  if (existingRequestId) {
    reply.header('Idempotency-Replayed', 'true');
    reply.status(202).send({ success: true, requestId: existingRequestId, status: 'UPLOADED' });
    return;
  }

  const requestId = uuidv4();
  const now = new Date().toISOString();
  const record = metadataToRecord(requestId, metadata, now);
  if (request.geoRisk) {
    record.securityFlags = [request.geoRisk];
  }
  await gradingRepository.create(record);
  await this.intakeService.recordIdempotencyKey(metadata.idempotencyKey, requestId);

  const { reports: qualityReports } = await assessBatchQuality(
    images.map((i) => ({ view: i.field, buffer: i.buffer })),
    metadata.category
  );
  const { report: duplicateReport } = await detectDuplicates(
    images.map((i) => ({ view: i.field, buffer: i.buffer }))
  );

  const qualityResult = buildQualityResult(qualityReports);
  const passed = qualityResult.overallPassed && !duplicateReport.hasRejectedDuplicates;

  if (!passed) {
    await Promise.all(
      images.map((img) => uploadRejected(requestId, img.field, img.buffer, img.mimetype))
    );

    const failureReasons: string[] = [];
    for (const r of qualityReports) {
      if (!r.passed) failureReasons.push(`${r.view}: ${r.failures.join(', ')}`);
    }
    for (const p of duplicateReport.rejectedPairs) {
      failureReasons.push(`'${p.viewA}' and '${p.viewB}' appear to be the same photo.`);
    }

    await gradingRepository.transitionStatus(requestId, 'UPLOADED', 'FAILED', {
      qualityReport: qualityResult,
      duplicateReport,
      failureReason: failureReasons.join('; '),
      failureCode: 'QUALITY_VALIDATION_FAILED',
    });

    reply.status(202).send({
      success: true,
      requestId,
      status: 'FAILED',
      failureReason: failureReasons.join('; '),
    });
    return;
  }

  const storedImages: StoredImageRecord[] = await Promise.all(
    images.map(async (img, idx) => {
      const [s3KeyOriginal, s3KeyAnalysis, s3KeyThumb] = await Promise.all([
        uploadOriginal(requestId, img.field, img.buffer, img.mimetype),
        uploadAnalysisVariant(requestId, img.field, img.buffer),
        uploadThumbnail(requestId, img.field, img.buffer),
      ]);
      return {
        view: img.field,
        s3KeyOriginal,
        s3KeyAnalysis,
        s3KeyThumb,
        quality: qualityReports[idx],
      };
    })
  );

  await gradingRepository.transitionStatus(requestId, 'UPLOADED', 'VALIDATED', {
    images: storedImages,
    qualityReport: qualityResult,
    duplicateReport,
  });

  enqueueProcessing(requestId);

  reply.header('X-Request-Id', requestId);
  reply.status(202).send({ success: true, requestId, status: 'VALIDATED' });
}
