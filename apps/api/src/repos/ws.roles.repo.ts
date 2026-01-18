// apps/api/src/repos/ws.roles.repo.ts
import { RoleSchema, type Role } from '@workstation/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { dbWs, schema } from '../db.js';

// Internal schema for detailed role (without memberCount) - not exported
const DetailedRoleSchema = z.object({
  roleId: z.string().uuid(),
  name: z.string(),
  scope: z.enum(['global', 'tenant']),
  defaultPerms: z.object({
    allow: z.array(z.string()),
    deny: z.array(z.string()),
  }),
});
type DetailedRole = z.infer<typeof DetailedRoleSchema>;

// Zod schema for permissions normalization
const PermsZ = z.object({
  allow: z.array(z.string()).default([]),
  deny: z.array(z.string()).default([]),
});

// Helper to normalize permissions using Zod validation
const normalizePerms = (x: unknown): { allow: string[]; deny: string[] } => {
  const parsed = PermsZ.safeParse(x ?? {});
  if (parsed.success) {
    return {
      allow: [...new Set(parsed.data.allow)],
      deny: [...new Set(parsed.data.deny)],
    };
  }
  return { allow: [], deny: [] };
};

export async function listRolesForTenant(tenantId: string): Promise<Role[]> {
  // Get roles (global + tenant-specific)
  const rows = await dbWs
    .select({
      roleId: schema.wsRoles.roleId,
      name: schema.wsRoles.name,
      tenantId: schema.wsRoles.tenantId,
      defaultPerms: schema.wsRoles.defaultPerms,
    })
    .from(schema.wsRoles)
    .where(sql`${schema.wsRoles.tenantId} IS NULL OR ${schema.wsRoles.tenantId} = ${tenantId}`);

  // Get member counts
  const memberCounts = await dbWs
    .select({
      roleId: schema.wsUserMemberships.roleId,
      cnt: sql<number>`count(*)`.as('cnt'),
    })
    .from(schema.wsUserMemberships)
    .where(eq(schema.wsUserMemberships.tenantId, tenantId))
    .groupBy(schema.wsUserMemberships.roleId);

  const countByRole = new Map(memberCounts.map(m => [m.roleId, Number(m.cnt)]));

  const result = rows.map(r => ({
    roleId: r.roleId,
    name: r.name,
    scope: r.tenantId ? 'tenant' as const : 'global' as const,
    memberCount: countByRole.get(r.roleId) ?? 0,
    defaultPerms: normalizePerms(r.defaultPerms),
  }));

  return z.array(RoleSchema).parse(result);
}

export async function createRole(
  tenantId: string,
  name: string,
  permissions: { allow?: string[]; deny?: string[] },
): Promise<DetailedRole> {
  const perms = normalizePerms({ allow: permissions.allow, deny: permissions.deny });

  const [row] = await dbWs
    .insert(schema.wsRoles)
    .values({
      name,
      scopeLevel: 'platform',
      defaultPerms: perms,
      tenantId,
    })
    .returning({
      roleId: schema.wsRoles.roleId,
      name: schema.wsRoles.name,
      tenantId: schema.wsRoles.tenantId,
      defaultPerms: schema.wsRoles.defaultPerms,
    });

  const result = {
    roleId: row.roleId,
    name: row.name,
    scope: row.tenantId ? 'tenant' as const : 'global' as const,
    defaultPerms: normalizePerms(row.defaultPerms),
  };

  return DetailedRoleSchema.parse(result);
}

export async function updateRole(
  roleId: string,
  tenantId: string,
  updates: { name?: string; allow?: string[]; deny?: string[] },
): Promise<DetailedRole> {
  // Get current role
  const [existing] = await dbWs
    .select({
      roleId: schema.wsRoles.roleId,
      name: schema.wsRoles.name,
      tenantId: schema.wsRoles.tenantId,
      defaultPerms: schema.wsRoles.defaultPerms,
    })
    .from(schema.wsRoles)
    .where(and(eq(schema.wsRoles.roleId, roleId), eq(schema.wsRoles.tenantId, tenantId)));

  if (!existing) {
    throw new Error('Role not found or not in tenant');
  }

  const current = normalizePerms(existing.defaultPerms);
  const patch: { name?: string; defaultPerms?: { allow: string[]; deny: string[] } } = {};

  if (updates.name !== undefined) {
    patch.name = updates.name;
  }

  if (updates.allow !== undefined || updates.deny !== undefined) {
    const nextAllow = updates.allow !== undefined ? [...new Set(updates.allow)] : current.allow;
    const nextDeny = updates.deny !== undefined ? [...new Set(updates.deny)] : current.deny;
    patch.defaultPerms = { allow: nextAllow, deny: nextDeny };
  }

  const [row] = await dbWs
    .update(schema.wsRoles)
    .set(patch)
    .where(and(eq(schema.wsRoles.roleId, roleId), eq(schema.wsRoles.tenantId, tenantId)))
    .returning({
      roleId: schema.wsRoles.roleId,
      name: schema.wsRoles.name,
      tenantId: schema.wsRoles.tenantId,
      defaultPerms: schema.wsRoles.defaultPerms,
    });

  if (!row) {
    throw new Error('Role not found or not in tenant after update');
  }

  const result = {
    roleId: row.roleId,
    name: row.name,
    scope: row.tenantId ? 'tenant' as const : 'global' as const,
    defaultPerms: normalizePerms(row.defaultPerms),
  };

  return DetailedRoleSchema.parse(result);
}

export async function deleteRole(roleId: string, tenantId: string): Promise<void> {
  // Check if role is in use
  const [memberCount] = await dbWs
    .select({ cnt: sql<number>`count(*)`.as('cnt') })
    .from(schema.wsUserMemberships)
    .where(and(
      eq(schema.wsUserMemberships.roleId, roleId),
      eq(schema.wsUserMemberships.tenantId, tenantId),
    ));

  if (Number(memberCount.cnt) > 0) {
    throw new Error('Cannot delete role: still has members');
  }

  // Get and validate role exists in tenant
  const [role] = await dbWs
    .select({
      roleId: schema.wsRoles.roleId,
      name: schema.wsRoles.name,
      tenantId: schema.wsRoles.tenantId,
    })
    .from(schema.wsRoles)
    .where(inArray(schema.wsRoles.roleId, [roleId]));

  if (!role) {
    throw new Error('Role not found');
  }
  if (role.tenantId && role.tenantId !== tenantId) {
    throw new Error('Role not in tenant');
  }

  await dbWs
    .delete(schema.wsRoles)
    .where(eq(schema.wsRoles.roleId, roleId));
}

export async function getRoleById(roleId: string, tenantId: string): Promise<DetailedRole> {
  const [row] = await dbWs
    .select({
      roleId: schema.wsRoles.roleId,
      name: schema.wsRoles.name,
      tenantId: schema.wsRoles.tenantId,
      defaultPerms: schema.wsRoles.defaultPerms,
    })
    .from(schema.wsRoles)
    .where(inArray(schema.wsRoles.roleId, [roleId]));

  if (!row) {
    throw new Error('Role not found');
  }
  if (row.tenantId && row.tenantId !== tenantId) {
    throw new Error('Role not in tenant');
  }

  const result = {
    roleId: row.roleId,
    name: row.name,
    scope: row.tenantId ? 'tenant' as const : 'global' as const,
    defaultPerms: normalizePerms(row.defaultPerms),
  };

  return DetailedRoleSchema.parse(result);
}
