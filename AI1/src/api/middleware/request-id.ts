import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

export const requestIdMiddleware: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest('requestId', '');

  app.addHook('onRequest', async (request, reply) => {
    const id = uuidv4();
    request.requestId = id;
    request.log = request.log.child({ requestId: id });
    reply.header('X-Request-Id', id);
  });
});
