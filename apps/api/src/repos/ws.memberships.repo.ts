// apps/api/src/repos/ws.memberships.repo.ts
import { UserRoleSchema, type UserRole } from '@hk26/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { dbWs, schema } from '../db.js';

export async function getUserRoles(tenantId: string, userId: string): Promise<UserRole[]> {
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

export async function assignRole(tenantId: string, userId: string, roleId: string): Promise<void> {
  // Verify role exists and belongs to tenant (or is global)
  const [role] = await dbWs
    .select({ roleId: schema.wsRoles.roleId, tenantId: schema.wsRoles.tenantId })
    .from(schema.wsRoles)
    .where(eq(schema.wsRoles.roleId, roleId));

  if (!role) {
    throw new Error('Role not found');
  }
  if (role.tenantId && role.tenantId !== tenantId) {
    throw new Error('Role does not belong to this tenant');
  }

  // Insert membership (ignore if already exists)
  await dbWs
    .insert(schema.wsUserMemberships)
    .values({
      userUuid: userId,
      tenantId,
      roleId,
      customPerms: null,
    })
    .onConflictDoNothing();

  // Mark roster active if needed
  await dbWs
    .update(schema.wsTenantMembers)
    .set({
      status: 'active' as const,
      activatedAt: new Date(),
      deactivatedAt: null,
    })
    .where(
      and(
        eq(schema.wsTenantMembers.tenantId, tenantId),
        eq(schema.wsTenantMembers.userUuid, userId),
      ),
    );
}

export async function removeRole(tenantId: string, userId: string, roleId: string): Promise<void> {
  await dbWs
    .delete(schema.wsUserMemberships)
    .where(
      and(
        eq(schema.wsUserMemberships.tenantId, tenantId),
        eq(schema.wsUserMemberships.userUuid, userId),
        eq(schema.wsUserMemberships.roleId, roleId),
      ),
    );
}

export async function bulkUpdateRoles(
  tenantId: string,
  userId: string,
  add: string[] = [],
  remove: string[] = [],
): Promise<void> {
  if (add.length) {
    for (const roleId of add) {
      await assignRole(tenantId, userId, roleId);
    }
  }

  if (remove.length) {
    await dbWs
      .delete(schema.wsUserMemberships)
      .where(
        and(
          eq(schema.wsUserMemberships.tenantId, tenantId),
          eq(schema.wsUserMemberships.userUuid, userId),
          inArray(schema.wsUserMemberships.roleId, remove),
        ),
      );
  }
}
