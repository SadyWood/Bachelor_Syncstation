import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { jsonEmptyBodyPlugin } from './plugins/json-empty-body.js';
import { authRoutes } from './routes/auth.js';
import { healthRoutes } from './routes/health.js';
import { syncLogRoutes } from './routes/sync.log.js';
import { wsContentRoutes } from './routes/ws.content.js';
import { wsMediaRoutes } from './routes/ws.media.js';
import { wsMembersRoutes } from './routes/ws.members.js';
import { wsMembershipRoutes } from './routes/ws.memberships.js';
import { wsPermissionsRoutes } from './routes/ws.permissions.js';
import { wsRolesRoutes } from './routes/ws.roles.js';
import { evaluateEffectivePerms } from './services/perm.service.js';
import type { FastifyRequest, FastifyReply } from 'fastify';


export async function build() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie, { secret: env.COOKIE_SECRET });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(multipart, {
    limits: {
      fileSize: 500 * 1024 * 1024, // 500 MB max file size
    },
  });
  await app.register(jsonEmptyBodyPlugin);


  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  void jsonSchemaTransform;

  // Error handler for better debugging of schema mismatches
  app.setErrorHandler((err, req, reply) => {
    // Log detailed error information for schema validation failures
    app.log.error({
      err,
      url: req.url,
      method: req.method,
      statusCode: err.statusCode,
    }, 'Request failed');

    reply.status(err.statusCode ?? 500).send({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error',
    });
  });

  app.decorate('authenticate', async (req: FastifyRequest) => { await req.jwtVerify(); });

  // Permission evaluator bound to tenant header
  app.decorate('can', async (req: FastifyRequest, perm: string) => {
    try {
      const decoded = await req.jwtVerify<{ sub: string }>();
      const userId = decoded.sub;
      const tenantId = (req.headers['x-ws-tenant'] as string | undefined) || undefined;
      app.log.info({ userId, tenantId, perm }, '[CAN] Evaluating permission');
      if (!tenantId) {
        app.log.warn('[CAN] No tenant ID in headers - denying');
        return false;
      }
      const { can } = await evaluateEffectivePerms(userId, tenantId);
      const result = can(perm);
      app.log.info({ userId, tenantId, perm, result }, '[CAN] Permission evaluation complete');
      return result;
    } catch (err) {
      app.log.error({ err, perm }, '[CAN] Error during permission check');
      return false;
    }
  });

  // Pre-handler that returns a consistent 403 if missing perm
  app.decorate('needsPerm', (perm: string) => async (req: FastifyRequest, reply: FastifyReply) => {
    app.log.info({ perm, url: req.url, method: req.method }, '[NEEDS_PERM] Checking permission');
    const ok = await app.can(req, perm);
    app.log.info({ perm, ok }, '[NEEDS_PERM] Permission check result');
    if (!ok) {
      app.log.warn({ perm, url: req.url }, '[NEEDS_PERM] Permission DENIED');
      return reply.code(403).send({
        ok: false,
        code: 'PERMISSION_DENIED',
        message: `Missing permission: ${perm}`,
        details: { missingPerm: perm },
      });
    }
    app.log.info({ perm }, '[NEEDS_PERM] Permission GRANTED - proceeding to handler');
  });

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/auth' });

  // WS domain routes
  await app.register(wsMembersRoutes);
  await app.register(wsRolesRoutes);
  await app.register(wsPermissionsRoutes);
  await app.register(wsMembershipRoutes);
  await app.register(wsContentRoutes);
  await app.register(wsMediaRoutes);

  // Syncstation routes
  await app.register(syncLogRoutes);

  return app;
}

if (env.NODE_ENV !== 'test') {
  const host = '0.0.0.0';
  build().then(app => app.listen({ port: env.PORT, host }));
}
