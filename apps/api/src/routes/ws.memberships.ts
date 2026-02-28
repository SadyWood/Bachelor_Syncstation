// apps/api/src/routes/ws.memberships.ts
import { createLogger } from '@hoolsy/logger';
import { z } from 'zod';
import * as membershipsRepo from '../repos/ws.memberships.repo.js';
import { err } from '../utils/errors.js';
import type { FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const logger = createLogger('MembershipRoutes');

type TenantHeader = { 'x-ws-tenant'?: string };

const requireTenant = (req: FastifyRequest) => {
  const t = (req.headers as TenantHeader)['x-ws-tenant'];
  return (typeof t === 'string' && t.trim()) ? t : null;
};

const AssignBody = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

// Schema for user ID params
const UserParamsSchema = z.object({
  userId: z.string(),
});

// Schema for role bulk operations
const BulkRoleBody = z.object({
  userId: z.string(),
  add: z.array(z.string()).optional(),
  remove: z.array(z.string()).optional(),
});

export const wsMembershipRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);

  // List roles for a specific user within tenant
  app.get(
    '/ws/members/:userId/roles',
    {
      preHandler: app.needsPerm('role.list.view'),
      schema: {
        params: UserParamsSchema,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send(err('TENANT_HEADER_MISSING', 'X-WS-Tenant header required'));

      const { userId } = req.params;

      try {
        const userRoles = await membershipsRepo.getUserRoles(tenantId, userId);
        return reply.send({ ok: true, items: userRoles });
      } catch (error) {
        if (error instanceof Error && error.message === 'User not found in tenant') {
          return reply.code(404).send(err('USER_NOT_FOUND', error.message));
        }
        return reply.code(500).send(err('INTERNAL_ERROR', 'Failed to get user roles'));
      }
    },
  );

  // Assign a role to a user in tenant
  app.post(
    '/ws/memberships',
    {
      preHandler: app.needsPerm('member.roles.assign'),
      schema: {
        body: AssignBody,
      },
    },
    async (req, reply) => {
      logger.debug('Assigning role to user', { body: req.body });

      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send(err('TENANT_HEADER_MISSING', 'X-WS-Tenant header required'));

      const body = AssignBody.safeParse(req.body);
      if (!body.success) {
        logger.warn('Invalid request body', { errors: body.error });
        return reply.code(400).send(err('INVALID_BODY', 'Invalid request body'));
      }

      const { userId, roleId } = body.data;
      logger.debug('Calling assignRole', { tenantId, userId, roleId });

      try {
        await membershipsRepo.assignRole(tenantId, userId, roleId);
        logger.debug('Role assigned successfully', { userId, roleId });
        return reply.send({ ok: true, message: 'Role assigned' });
      } catch (error) {
        logger.error('Failed to assign role', error);
        if (error instanceof Error) {
          if (error.message === 'Role not found') {
            return reply.code(404).send(err('ROLE_NOT_FOUND', error.message));
          }
          if (error.message === 'Role does not belong to this tenant') {
            return reply.code(400).send(err('ROLE_NOT_IN_TENANT', error.message));
          }
        }
        return reply.code(500).send(err('INTERNAL_ERROR', 'Failed to assign role'));
      }
    },
  );

  // Remove a role from a user in tenant
  app.delete(
    '/ws/memberships',
    {
      preHandler: app.needsPerm('member.roles.assign'),
      schema: {
        body: AssignBody,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send(err('TENANT_HEADER_MISSING', 'X-WS-Tenant header required'));

      const body = AssignBody.safeParse(req.body);
      if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'Invalid request body'));

      const { userId, roleId } = body.data;

      try {
        await membershipsRepo.removeRole(tenantId, userId, roleId);
        return reply.send({ ok: true, message: 'Role removed' });
      } catch (error) {
        return reply.code(500).send(err('INTERNAL_ERROR', 'Failed to remove role'));
      }
    },
  );

  // Bulk assign/remove roles (handy for UI multi-select)
  app.post(
    '/ws/memberships/bulk',
    {
      preHandler: app.needsPerm('member.roles.assign'),
      schema: {
        body: BulkRoleBody,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send(err('TENANT_HEADER_MISSING', 'X-WS-Tenant header required'));

      const Body = z.object({
        userId: z.string().uuid(),
        add: z.array(z.string().uuid()).optional(),
        remove: z.array(z.string().uuid()).optional(),
      });

      const parsed = Body.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send(err('INVALID_BODY', 'Invalid request body'));

      const { userId, add = [], remove = [] } = parsed.data;

      try {
        await membershipsRepo.bulkUpdateRoles(tenantId, userId, add, remove);
        return reply.send({ ok: true, message: 'Roles updated' });
      } catch (error) {
        return reply.code(500).send(err('INTERNAL_ERROR', 'Failed to update roles'));
      }
    },
  );
};
