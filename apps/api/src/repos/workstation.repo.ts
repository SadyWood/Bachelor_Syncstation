// apps/api/src/repos/workstation.repo.ts
import { and, eq, isNull, or } from 'drizzle-orm';
import { dbWs, schema } from '../db.js';

// Reuse Drizzle-inferred literal unions for status, etc.
type MemberStatus = typeof schema.wsTenantMembers.$inferInsert['status'];

export async function listWsMemberships(userUuid: string) {
  return dbWs
    .select({
      tenantId: schema.wsUserMemberships.tenantId,
      nodeId: schema.wsUserMemberships.nodeId,
      roleName: schema.wsRoles.name,
      createdAt: schema.wsUserMemberships.createdAt,
    })
    .from(schema.wsUserMemberships)
    .innerJoin(schema.wsRoles, eq(schema.wsRoles.roleId, schema.wsUserMemberships.roleId))
    .where(eq(schema.wsUserMemberships.userUuid, userUuid));
}

/** Activate roster rows that match (userUuid, inviteToken) and are pending/disabled. Returns count. */
export async function activateMembershipsForUserByInvite(userUuid: string, inviteToken: string) {
  const now = new Date();
  const rows = await dbWs
    .update(schema.wsTenantMembers)
    .set({
      status: 'active' as MemberStatus,
      activatedAt: now,
      deactivatedAt: null,
    })
    .where(and(
      eq(schema.wsTenantMembers.userUuid, userUuid),
      eq(schema.wsTenantMembers.inviteToken, inviteToken),
      or(
        eq(schema.wsTenantMembers.status, 'pending'),
        eq(schema.wsTenantMembers.status, 'disabled'),
      ),
    ))
    .returning({ memberId: schema.wsTenantMembers.memberId });
  return rows.length;
}

/** Fallback: activate *all* pending/disabled roster rows for this user (no token filter). Returns count. */
export async function activateAllPendingMembershipsForUser(userUuid: string) {
  const now = new Date();
  const rows = await dbWs
    .update(schema.wsTenantMembers)
    .set({
      status: 'active' as MemberStatus,
      activatedAt: now,
      deactivatedAt: null,
    })
    .where(and(
      eq(schema.wsTenantMembers.userUuid, userUuid),
      or(
        eq(schema.wsTenantMembers.status, 'pending'),
        eq(schema.wsTenantMembers.status, 'disabled'),
      ),
    ))
    .returning({ memberId: schema.wsTenantMembers.memberId });
  return rows.length;
}

/** Optional admin helper */
export async function deactivateTenantMembership(userUuid: string, tenantId: string) {
  const now = new Date();
  const [row] = await dbWs
    .update(schema.wsTenantMembers)
    .set({
      status: 'disabled' as MemberStatus,
      deactivatedAt: now,
    })
    .where(
      and(
        eq(schema.wsTenantMembers.userUuid, userUuid),
        eq(schema.wsTenantMembers.tenantId, tenantId),
        isNull(schema.wsTenantMembers.deactivatedAt),
      ),
    )
    .returning({
      memberId: schema.wsTenantMembers.memberId,
      tenantId: schema.wsTenantMembers.tenantId,
      status: schema.wsTenantMembers.status,
      deactivatedAt: schema.wsTenantMembers.deactivatedAt,
    });

  return row ?? null;
}

export async function getTenantById(tenantId: string) {
  const [t] = await dbWs
    .select({
      id: schema.wsTenants.id,
      code: schema.wsTenants.code,
      name: schema.wsTenants.name,
      createdAt: schema.wsTenants.createdAt,
    })
    .from(schema.wsTenants)
    .where(eq(schema.wsTenants.id, tenantId));
  return t ?? null;
}
