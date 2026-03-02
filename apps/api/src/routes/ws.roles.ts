// apps/api/src/routes/ws.roles.ts
import { z } from 'zod';
import * as rolesRepo from '../repos/ws.roles.repo.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const RolePayload = z.object({
  name: z.string().min(2).max(64),
  allow: z.array(z.string()).default([]),
  deny: z.array(z.string()).default([]),
});

// Schema for route parameters
const RoleParamsSchema = z.object({
  id: z.string(),
});

type TenantHeader = { 'x-ws-tenant'?: string };
function requireTenant(req: FastifyRequest): string | null {
  const t = (req.headers as TenantHeader)['x-ws-tenant'];
  return typeof t === 'string' && t.trim() ? t : null;
}

export const wsRolesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);

  // LIST roles (global + tenant)
  app.get(
    '/ws/roles',
    { preHandler: app.needsPerm('role.list.view') },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });

      try {
        const roles = await rolesRepo.listRolesForTenant(tenantId);
        return reply.send({ ok: true, items: roles });
      } catch (error) {
        return reply
          .code(500)
          .send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch roles' });
      }
    },
  );

  // CREATE tenant role
  app.post(
    '/ws/roles',
    {
      preHandler: app.needsPerm('role.create'),
      schema: {
        body: RolePayload,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });

      const body = RolePayload.parse(req.body ?? {});

      try {
        const role = await rolesRepo.createRole(tenantId, body.name, {
          allow: body.allow,
          deny: body.deny,
        });
        return reply.send({ ok: true, role });
      } catch (error) {
        return reply
          .code(500)
          .send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to create role' });
      }
    },
  );

  // PATCH tenant role
  app.patch(
    '/ws/roles/:id',
    {
      preHandler: app.needsPerm('role.perms.update'),
      schema: {
        params: RoleParamsSchema,
        body: RolePayload.partial(),
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });

      const roleId = req.params.id;
      const body = RolePayload.partial().parse(req.body ?? {});

      try {
        const role = await rolesRepo.updateRole(roleId, tenantId, body);
        return reply.send({ ok: true, role });
      } catch (error) {
        if (error instanceof Error && error.message === 'Role not found or not in tenant') {
          return reply
            .code(404)
            .send({ ok: false, code: 'ROLE_NOT_FOUND_OR_NOT_IN_TENANT', message: error.message });
        }
        return reply
          .code(500)
          .send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to update role' });
      }
    },
  );

  // DELETE tenant role
  app.delete(
    '/ws/roles/:id',
    {
      preHandler: app.needsPerm('role.delete'),
      schema: {
        params: RoleParamsSchema,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });

      const roleId = req.params.id;

      try {
        await rolesRepo.deleteRole(roleId, tenantId);
        return reply.send({ ok: true, message: 'Role deleted' });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Role not found') {
            return reply
              .code(404)
              .send({ ok: false, code: 'ROLE_NOT_FOUND', message: error.message });
          }
          if (error.message === 'Role not in tenant') {
            return reply
              .code(404)
              .send({ ok: false, code: 'ROLE_NOT_IN_TENANT', message: error.message });
          }
          if (error.message === 'Cannot delete role: still has members') {
            return reply.code(409).send({ ok: false, code: 'ROLE_IN_USE', message: error.message });
          }
        }
        return reply
          .code(500)
          .send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to delete role' });
      }
    },
  );

  // GET one role
  app.get(
    '/ws/roles/:id',
    {
      preHandler: app.needsPerm('role.perms.view'),
      schema: {
        params: RoleParamsSchema,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });

      const roleId = req.params.id;

      try {
        const role = await rolesRepo.getRoleById(roleId, tenantId);
        return reply.send({ ok: true, role });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Role not found') {
            return reply
              .code(404)
              .send({ ok: false, code: 'ROLE_NOT_FOUND', message: error.message });
          }
          if (error.message === 'Role not in tenant') {
            return reply
              .code(404)
              .send({ ok: false, code: 'ROLE_NOT_IN_TENANT', message: error.message });
          }
        }
        return reply
          .code(500)
          .send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch role' });
      }
    },
  );
};
