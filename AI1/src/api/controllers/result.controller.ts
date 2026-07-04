import type { FastifyReply, FastifyRequest } from 'fastify';
import { gradingRepository } from '../../services/db/repository.js';
import { getPresignedUrl } from '../../services/storage/s3.js';
import { AppError } from '../../utils/errors.js';

export async function resultHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const record = await gradingRepository.get(request.params.id);

  if (record.status !== 'COMPLETED' && record.status !== 'FAILED') {
    throw new AppError(
      'INVALID_STATE_TRANSITION',
      `Result not yet available; current status is '${record.status}'.`,
      409,
      { status: record.status }
    );
  }

  if (record.status === 'FAILED') {
    reply.status(200).send({
      success: true,
      requestId: record.requestId,
      status: 'FAILED',
      failureReason: record.failureReason,
      failureCode: record.failureCode,
    });
    return;
  }

  // Signed URLs are regenerated at read time — never stored, since they expire.
  const images = await Promise.all(
    record.images.map(async (img) => ({
      view: img.view,
      originalUrl: await getPresignedUrl(img.s3KeyOriginal),
      thumbnailUrl: img.s3KeyThumb ? await getPresignedUrl(img.s3KeyThumb) : undefined,
    }))
  );

  reply.status(200).send({
    success: true,
    requestId: record.requestId,
    status: 'COMPLETED',
    report: record.finalReport,
    images,
  });
}
