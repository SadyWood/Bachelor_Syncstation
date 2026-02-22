// apps/api/src/routes/ws.permissions.ts
import { z } from 'zod';
import * as permissionsRepo from '../repos/ws.permissions.repo.js';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const wsPermissionsRoutes: FastifyPluginAsyncZod = async (app) => {

  app.addHook('preHandler', app.authenticate);

  // List available permissions from catalog
  app.get(
    '/ws/permissions/catalog',
    {
      preHandler: app.needsPerm('role.perms.view'),
      schema: {
        response: {
          200: z.object({
            ok: z.literal(true),
            items: z.array(
              z.object({
                permissionCode: z.string(),
                description: z.string().nullable().optional(),
              }),
            ),
          }),
          500: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    async (_req, reply) => {
      try {
        const items = await permissionsRepo.listPermissionsCatalog();
        return reply.send({ ok: true, items });
      } catch (error) {
        return reply.code(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to fetch permissions catalog' });
      }
    },
  );
};
