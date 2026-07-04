import type { FastifyInstance, FastifyError } from 'fastify';
import { isAppError } from '../../utils/errors.js';

export function setupErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError | Error, request, reply) => {
    if (isAppError(err)) {
      request.log.warn({ err, code: err.code }, 'request failed with AppError');
      reply.status(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message, details: err.details ?? {} },
      });
      return;
    }

    // Fastify multipart framework-level errors
    const fastifyErr = err as FastifyError;
    if (fastifyErr.code === 'FST_REQ_FILE_TOO_LARGE') {
      reply.status(413).send({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'A file exceeds the maximum allowed size.', details: {} },
      });
      return;
    }
    if (fastifyErr.code === 'FST_FILES_LIMIT') {
      reply.status(400).send({
        success: false,
        error: { code: 'TOO_MANY_FILES', message: 'Too many files in request.', details: {} },
      });
      return;
    }

    request.log.error({ err }, 'unhandled error');
    reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', details: {} },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: { code: 'REQUEST_NOT_FOUND', message: 'Route not found.', details: {} },
    });
  });
}
