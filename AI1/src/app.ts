import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { config } from './config/config.js';
import { requestIdMiddleware } from './api/middleware/request-id.js';
import { fraudFirewallPlugin } from './api/middleware/fraud-firewall.js';
import { setupErrorHandler } from './api/middleware/error-handler.js';
import { gradeRoutes } from './api/routes/grade.route.js';
import { qualityCheckRoutes } from './api/routes/quality-check.route.js';
import { IntakeService } from './services/intake/intake.service.js';
import {
  InMemoryIdempotencyStore,
  type IdempotencyStore,
} from './services/intake/idempotency.store.js';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

export interface BuildAppOptions {
  idempotencyStore?: IdempotencyStore;
}

export async function buildApp(opts: BuildAppOptions = {}) {
  const isDev = config.NODE_ENV !== 'production';
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport: isDev
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
        : undefined,
      base: { service: 'ai-grading-service' },
    },
    genReqId: () => '',
    bodyLimit: config.MAX_FILE_SIZE_BYTES * config.MAX_FILES_PER_REQUEST + 1024 * 1024,
  });

  await app.register(multipart, {
    limits: {
      fileSize: config.MAX_FILE_SIZE_BYTES,
      files: config.MAX_FILES_PER_REQUEST,
      fields: 20,
    },
  });

  await app.register(requestIdMiddleware);
  // Fraud Firewall must be registered after requestIdMiddleware (so request.log
  // is already enriched with a requestId) but BEFORE routes so the onRequest
  // hook fires before any route handler or multipart body parsing.
  await app.register(fraudFirewallPlugin);
  setupErrorHandler(app);

  const store = opts.idempotencyStore ?? new InMemoryIdempotencyStore();
  const intakeService = new IntakeService(store, config);

  await app.register(gradeRoutes, { intakeService });
  await app.register(qualityCheckRoutes);

  // Process-liveness check — used by orchestrators (Render/ALB) to know the
  // process is up at all, independent of downstream dependency health.
  app.get('/health', async () => ({ status: 'ok' }));

  // Dependency-readiness check — only route traffic here once S3 and
  // DynamoDB are actually reachable.
  app.get('/ready', async (_request, reply) => {
    const dynamo = new DynamoDBClient({
      region: config.AWS_REGION,
      credentials: { accessKeyId: config.AWS_ACCESS_KEY_ID, secretAccessKey: config.AWS_SECRET_ACCESS_KEY },
      endpoint: config.DYNAMODB_ENDPOINT,
    });
    const s3 = new S3Client({
      region: config.AWS_REGION,
      credentials: { accessKeyId: config.AWS_ACCESS_KEY_ID, secretAccessKey: config.AWS_SECRET_ACCESS_KEY },
      endpoint: config.S3_ENDPOINT,
      forcePathStyle: config.S3_FORCE_PATH_STYLE,
    });

    try {
      await dynamo.send(new ListTablesCommand({}));
      await s3.send(new HeadBucketCommand({ Bucket: config.S3_BUCKET_NAME }));
      return { status: 'ready' };
    } catch (err) {
      reply.status(503);
      const message =
        err instanceof Error ? err.message || String(err.cause ?? err.name) : String(err);
      return { status: 'not_ready', error: message };
    }
  });

  return app;
}
