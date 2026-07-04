import type { FastifyInstance } from 'fastify';
import { IntakeService } from '../../services/intake/intake.service.js';
import { gradeHandler } from '../controllers/grade.controller.js';
import { statusHandler } from '../controllers/status.controller.js';
import { resultHandler } from '../controllers/result.controller.js';

export interface GradeRoutesOptions {
  intakeService: IntakeService;
}

export async function gradeRoutes(app: FastifyInstance, opts: GradeRoutesOptions): Promise<void> {
  app.post('/grade', { handler: gradeHandler.bind({ intakeService: opts.intakeService }) });
  app.get('/status/:id', statusHandler);
  app.get('/result/:id', resultHandler);
}
