import crypto from 'node:crypto';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { dbUsers, dbWs, schema } from '../db.js';
import { err } from '../utils/errors.js';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

type TenantHeader = { 'x-ws-tenant'?: string };
const getTenantId = (req: FastifyRequest): string | null => {
  const t = (req.headers as TenantHeader)['x-ws-tenant'];
  return typeof t === 'string' && t.trim() ? t : null;
};

export const wsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  // GET /members
  app.get('/members', async (req: FastifyRequest, reply: FastifyReply) => {
    const tenantId = getTenantId(req);
    if (!tenantId) { return reply.code(400).send(err('TENANT_REQUIRED', 'Missing X-WS-Tenant header.')); }
    if (!(await app.can(req, 'admin.members.read'))) {
      return reply.code(403).send(err('FORBIDDEN', 'Missing permission admin.members.read'));
    }

    const roster = await dbWs
      .select({
        memberId: schema.wsTenantMembers.memberId,
        userUuid: schema.wsTenantMembers.userUuid,
        status: schema.wsTenantMembers.status,
        addedAt: schema.wsTenantMembers.addedAt,
        activatedAt: schema.wsTenantMembers.activatedAt,
      })
      .from(schema.wsTenantMembers)
      .where(eq(schema.wsTenantMembers.tenantId, tenantId));

    const uniqUserIds: string[] = [
      ...new Set(
        roster.map((r) => r.userUuid).filter((x): x is string => typeof x === 'string' && !!x),
      ),
    ];

    const users = uniqUserIds.length
      ? await dbUsers
        .select({
          id: schema.users.id,
          email: schema.users.email,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          displayName: schema.users.displayName,
        })
        .from(schema.users)
        .where(inArray(schema.users.id, uniqUserIds))
      : [];

    const byId = new Map(users.map((u) => [u.id, u]));

    const memberships = await dbWs
      .select({
        userUuid: schema.wsUserMemberships.userUuid,
        roleId: schema.wsUserMemberships.roleId,
      })
      .from(schema.wsUserMemberships)
      .where(
        and(
          inArray(schema.wsUserMemberships.userUuid, uniqUserIds),
          eq(schema.wsUserMemberships.tenantId, tenantId),
        ),
      );

    const roleIds = [...new Set(memberships.map((m) => m.roleId))];
    const roles = roleIds.length
      ? await dbWs
        .select({ roleId: schema.wsRoles.roleId, name: schema.wsRoles.name })
        .from(schema.wsRoles)
        .where(inArray(schema.wsRoles.roleId, roleIds))
      : [];

    const roleNameById = new Map(roles.map((r) => [r.roleId, r.name]));

    const out = roster.map((r) => {
      const u = r.userUuid ? byId.get(r.userUuid) : undefined;
      const rnames = memberships
        .filter((m) => m.userUuid === r.userUuid)
        .map((m) => roleNameById.get(m.roleId))
        .filter((x): x is string => typeof x === 'string');

      return {
        memberId: r.memberId,
        userId: r.userUuid,
        firstName: u?.firstName ?? '',
        lastName: u?.lastName ?? '',
        email: u?.email ?? '',
        since: (r.activatedAt ?? r.addedAt ?? null)?.toISOString() ?? null,
        status: r.status as 'active' | 'pending' | 'disabled',
        roles: rnames,
      };
    });

    return reply.send({ ok: true, items: out });
  });

  // POST /invite
  app.post(
    '/invite',
    async (req: FastifyRequest<{ Body: { email?: string } }>, reply: FastifyReply) => {
      const tenantId = getTenantId(req);
      if (!tenantId) { return reply.code(400).send(err('TENANT_REQUIRED', 'Missing X-WS-Tenant header.')); }
      if (!(await app.can(req, 'admin.members.invite'))) {
        return reply.code(403).send(err('FORBIDDEN', 'Missing permission admin.members.invite'));
      }

      const email = (req.body?.email ?? '').toString().trim();
      if (!/.+@.+\..+/.test(email)) {
        return reply.code(400).send(err('BAD_EMAIL', 'Invalid email.'));
      }

      const [existing] = await dbUsers
        .select({ id: schema.users.id, email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.email, email));

      const userId =
        existing?.id ??
        (
          await dbUsers
            .insert(schema.users)
            .values({ email, isActive: false })
            .returning({ id: schema.users.id })
        )[0].id;

      await dbWs
        .insert(schema.wsTenantMembers)
        .values({
          memberId: crypto.randomUUID(),
          tenantId,
          userUuid: userId,
          status: 'pending',
          addedBy: null,
          inviteToken: null,
          addedAt: new Date(),
          activatedAt: null,
          deactivatedAt: null,
        })
        .onConflictDoNothing();

      return reply.send({ ok: true });
    },
  );

  // POST /members/:userId/deactivate
  app.post(
    '/members/:userId/deactivate',
    async (req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
      const tenantId = getTenantId(req);
      if (!tenantId) { return reply.code(400).send(err('TENANT_REQUIRED', 'Missing X-WS-Tenant header.')); }
      if (!(await app.can(req, 'admin.members.manage'))) {
        return reply.code(403).send(err('FORBIDDEN', 'Missing permission admin.members.manage'));
      }

      const { userId } = req.params;
      const now = new Date();

      const [row] = await dbWs
        .update(schema.wsTenantMembers)
        .set({ status: 'disabled', deactivatedAt: now })
        .where(
          and(
            eq(schema.wsTenantMembers.tenantId, tenantId),
            eq(schema.wsTenantMembers.userUuid, userId),
            isNull(schema.wsTenantMembers.deactivatedAt),
          ),
        )
        .returning({
          memberId: schema.wsTenantMembers.memberId,
          status: schema.wsTenantMembers.status,
          deactivatedAt: schema.wsTenantMembers.deactivatedAt,
        });

      if (!row) return reply.code(404).send(err('NOT_FOUND', 'Member not active or unknown.'));
      return reply.send({
        ok: true,
        memberId: row.memberId,
        status: row.status,
        deactivatedAt: row.deactivatedAt?.toISOString(),
      });
    },
  );
};
