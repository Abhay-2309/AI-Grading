import type { FastifyReply, FastifyRequest } from 'fastify';
import { gradingRepository } from '../../services/db/repository.js';

const PROGRESS_BY_STATUS: Record<string, number> = {
  UPLOADED: 10,
  VALIDATED: 30,
  ANALYZING: 60,
  GRADED: 90,
  COMPLETED: 100,
  FAILED: 100,
};

export async function statusHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const record = await gradingRepository.get(request.params.id);

  reply.status(200).send({
    success: true,
    requestId: record.requestId,
    status: record.status,
    progress: PROGRESS_BY_STATUS[record.status] ?? 0,
    failureReason: record.failureReason,
    statusHistory: record.statusHistory,
  });
}
