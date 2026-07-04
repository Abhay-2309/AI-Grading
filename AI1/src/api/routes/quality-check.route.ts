import type { FastifyInstance } from 'fastify';
import { qualityCheckHandler } from '../controllers/quality-check.controller.js';

export async function qualityCheckRoutes(app: FastifyInstance): Promise<void> {
  app.post('/quality-check', qualityCheckHandler);
}
