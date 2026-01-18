// apps/api/src/services/perm.service.ts
import { createLogger } from '@hoolsy/logger';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { dbWs, schema } from '../db.js';
import { matchesAny } from '../utils/perm-match.js';

const log = createLogger('perm');

// Zod schema for permission normalization to replace any casting
const PermsZ = z.object({
  allow: z.array(z.string()).default([]),
  deny: z.array(z.string()).default([]),
});
type PermSet = z.infer<typeof PermsZ>;

function normalize(p: unknown): PermSet {
  const parsed = PermsZ.safeParse(p ?? {});
  return parsed.success ? parsed.data : { allow: [], deny: [] };
}
function mergePerms(a: PermSet, b: PermSet): PermSet {
  const allow = Array.from(new Set([...(a.allow || []), ...(b.allow || [])]));
  const deny = Array.from(new Set([...(a.deny || []), ...(b.deny || [])]));
  return { allow, deny };
}

/**
 * Effective permissions within a tenant. Optionally pass nodeId later to
 * merge node/ancestor-scoped memberships (closure table).
 */
export async function evaluateEffectivePerms(userUuid: string, tenantId: string, _nodeId?: string) {
  log.debug('Evaluating permissions for user:', userUuid, 'tenant:', tenantId);

  const memberships = await dbWs
    .select({
      roleId: schema.wsUserMemberships.roleId,
      customPerms: schema.wsUserMemberships.customPerms,
    })
    .from(schema.wsUserMemberships)
    .where(and(eq(schema.wsUserMemberships.userUuid, userUuid), eq(schema.wsUserMemberships.tenantId, tenantId)));

  log.debug('Found memberships:', memberships.length);

  if (memberships.length === 0) {
    log.debug('No memberships found - denying all permissions');
    const empty: PermSet = { allow: [], deny: [] };
    return { can: (_: string) => false, snapshot: { ...empty, source: { roles: [], memberships: [] } } };
  }

  const roleIds = memberships.map(m => m.roleId);
  const roles = await dbWs
    .select({
      roleId: schema.wsRoles.roleId,
      name: schema.wsRoles.name,
      defaultPerms: schema.wsRoles.defaultPerms,
    })
    .from(schema.wsRoles)
    .where(inArray(schema.wsRoles.roleId, roleIds));

  log.debug('Found roles:', roles.map(r => r.name));

  // Short-circuit: Admin role name grants everything (keeps MVP behavior)
  const isAdmin = roles.some(r => (r.name || '').toLowerCase() === 'admin');
  if (isAdmin) {
    log.debug('User is Admin - granting all permissions');
    const effective: PermSet = { allow: ['**'], deny: [] };
    return { can: (_: string) => true, snapshot: { ...effective, source: { roles, memberships } } };
  }

  let effective: PermSet = { allow: [], deny: [] };
  for (const r of roles) effective = mergePerms(effective, normalize(r.defaultPerms));
  for (const m of memberships) effective = mergePerms(effective, normalize(m.customPerms));

  log.debug('Effective permissions:', effective.allow.length, 'allow rules,', effective.deny.length, 'deny rules');

  const can = (perm: string) => {
    const denyMatch = matchesAny(effective.deny, perm);
    const allowMatch = matchesAny(effective.allow, perm);
    if (denyMatch) return false;
    if (allowMatch) return true;
    return false;
  };

  return { can, snapshot: { ...effective, source: { roles, memberships } } };
}
