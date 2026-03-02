// apps/api/src/repos/ws.members.repo.ts
import crypto from 'node:crypto';
import { WsMemberSchema, UserRoleSchema, type WsMember, type UserRole } from '@hk26/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { dbUsers, dbWs, schema } from '../db.js';

// Alias for compatibility (WsMember is the schema name)
type Member = WsMember;
const MemberDTO = WsMemberSchema;

export async function listTenantMembers(tenantId: string): Promise<Member[]> {
  // Get roster
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

  // Get unique user IDs
  const userIds = [
    ...new Set(
      roster.map((r) => r.userUuid).filter((id): id is string => typeof id === 'string' && !!id),
    ),
  ];

  // Get user details
  const users = userIds.length
    ? await dbUsers
      .select({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
      })
      .from(schema.users)
      .where(inArray(schema.users.id, userIds))
    : [];

  const userById = new Map(users.map((u) => [u.id, u]));

  // Get memberships
  const memberships = await dbWs
    .select({
      userUuid: schema.wsUserMemberships.userUuid,
      roleId: schema.wsUserMemberships.roleId,
    })
    .from(schema.wsUserMemberships)
    .where(eq(schema.wsUserMemberships.tenantId, tenantId));

  // Get role names
  const roleIds = [...new Set(memberships.map((m) => m.roleId))];
  const roles = roleIds.length
    ? await dbWs
      .select({ roleId: schema.wsRoles.roleId, name: schema.wsRoles.name })
      .from(schema.wsRoles)
      .where(inArray(schema.wsRoles.roleId, roleIds))
    : [];
  const roleName = new Map(roles.map((r) => [r.roleId, r.name]));

  // Build result
  const items = roster.map((r) => {
    const user = r.userUuid ? userById.get(r.userUuid) : undefined;
    const roleNames = memberships
      .filter((m) => m.userUuid === r.userUuid)
      .map((m) => roleName.get(m.roleId))
      .filter((n): n is string => typeof n === 'string');

    return {
      memberId: r.memberId,
      userId: r.userUuid ?? null,
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      since: (r.activatedAt ?? r.addedAt ?? null)?.toISOString() ?? null,
      status: r.status as 'active' | 'pending' | 'disabled',
      roles: roleNames,
    };
  });

  // Validate and return
  return z.array(MemberDTO).parse(items);
}

export async function inviteMember(tenantId: string, email: string): Promise<void> {
  const [existing] = await dbUsers
    .select({ id: schema.users.id })
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
      addedAt: new Date(),
    })
    .onConflictDoNothing();
}

export async function deactivateMember(tenantId: string, userId: string): Promise<void> {
  const [row] = await dbWs
    .update(schema.wsTenantMembers)
    .set({ status: 'disabled', deactivatedAt: new Date() })
    .where(
      and(
        eq(schema.wsTenantMembers.tenantId, tenantId),
        eq(schema.wsTenantMembers.userUuid, userId),
      ),
    )
    .returning({ memberId: schema.wsTenantMembers.memberId });

  if (!row) {
    throw new Error('Member not found or not in tenant');
  }
}

export async function listUserRoles(tenantId: string, userId: string): Promise<UserRole[]> {
  const rows = await dbWs
    .select({
      roleId: schema.wsUserMemberships.roleId,
      name: schema.wsRoles.name,
    })
    .from(schema.wsUserMemberships)
    .innerJoin(schema.wsRoles, eq(schema.wsRoles.roleId, schema.wsUserMemberships.roleId))
    .where(
      and(
        eq(schema.wsUserMemberships.tenantId, tenantId),
        eq(schema.wsUserMemberships.userUuid, userId),
      ),
    );

  return z.array(UserRoleSchema).parse(rows);
}
