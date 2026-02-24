import { z } from 'zod';
import * as membersRepo from '../repos/ws.members.repo.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

// Header-type for tenant
type TenantHeader = { 'x-ws-tenant'?: string };

// Hent tenant fra header
function requireTenant(req: FastifyRequest): string | null {
  const t = (req.headers as TenantHeader)['x-ws-tenant'];
  return typeof t === 'string' && t.trim() ? t : null;
}

// Schemas for route validation
const InviteMemberBody = z.object({
  email: z.string().email().optional(),
});

const UserParamsSchema = z.object({
  userId: z.string(),
});

export const wsMembersRoutes: FastifyPluginAsyncZod = async (app) => {
  // GET /ws/members
  app.get(
    '/ws/members',
    { preHandler: app.needsPerm('member.list.view') },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });

      try {
        const members = await membersRepo.listTenantMembers(tenantId);
        return reply.send({ ok: true, items: members });
      } catch (error) {
        return reply
          .code(500)
          .send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch members' });
      }
    },
  );

  // POST /ws/invite
  app.post(
    '/ws/invite',
    {
      preHandler: app.needsPerm('member.invite.send'),
      schema: {
        body: InviteMemberBody,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });

      const email = (req.body?.email ?? '').toString().trim();
      if (!/.+@.+\..+/.test(email)) return reply.code(400).send({ ok: false, code: 'BAD_EMAIL' });

      try {
        await membersRepo.inviteMember(tenantId, email);
        return reply.send({ ok: true, message: 'Invite sent' });
      } catch (error) {
        return reply
          .code(500)
          .send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to send invite' });
      }
    },
  );

  // POST /ws/members/:userId/deactivate
  app.post(
    '/ws/members/:userId/deactivate',
    {
      preHandler: app.needsPerm('member.access.revoke'),
      schema: {
        params: UserParamsSchema,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });

      const { userId } = req.params;

      try {
        await membersRepo.deactivateMember(tenantId, userId);
        return reply.send({ ok: true, message: 'Member deactivated' });
      } catch (error) {
        if (error instanceof Error && error.message === 'Member not found or not in tenant') {
          return reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: error.message });
        }
        return reply
          .code(500)
          .send({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to deactivate member' });
      }
    },
  );
};
