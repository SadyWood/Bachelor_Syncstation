import type { Membership, RolePerms } from '../types/permissions';

// Re-export types for backward compatibility
export type { Membership, RolePerms };

// Very light dot-pattern matcher: "**" = anything; "*" = single segment
function patToRegExp(pat: string): RegExp {
  const esc = pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const dotSeg = esc.replace(/\*\*/g, '§§WILDCARD_ALL§§').replace(/\*/g, '[^.]+');
  const any = dotSeg.replace(/§§WILDCARD_ALL§§/g, '.+');
  return new RegExp(`^${any}$`);
}

function anyMatch(perms: string[], target: string) {
  return perms.some((p) => patToRegExp(p).test(target));
}

export function hasPermission(
  target: string,
  opts: {
    memberships: Membership[];
    // Optional: when/if backend returns concrete permissions per role:
    rolePermissions?: Record<string, RolePerms>; // key=role name
  },
): boolean {
  // 1) Admin role short-circuit (MVP)
  if (opts.memberships.some((m) => m.role === 'Admin')) return true;

  // 2) Future: check allow/deny from rolePermissions (if provided)
  if (!opts.rolePermissions) return false;

  // Aggregate all role perms the user has
  const allows: string[] = [];
  const denies: string[] = [];
  for (const m of opts.memberships) {
    const rp = opts.rolePermissions[m.role];
    if (!rp) continue;
    if (rp.allow) allows.push(...rp.allow);
    if (rp.deny) denies.push(...rp.deny);
  }

  if (denies.length && anyMatch(denies, target)) return false;
  if (allows.length && anyMatch(allows, target)) return true;

  return false;
}
