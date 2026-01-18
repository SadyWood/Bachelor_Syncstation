// En liten permisssion-matcher som speiler backend:
//  - '**' = alle segmenter
//  - '*'  = ett segment
//  - deny trumfer allow

import type { EffectivePerms } from '../types/permissions';

// Re-export type for backward compatibility
export type { EffectivePerms };

function split(p: string) {
  return p.split('.').filter(Boolean);
}

function matchSegments(patSegs: string[], permSegs: string[], i = 0, j = 0): boolean {
  if (i === patSegs.length) return j === permSegs.length;
  const pat = patSegs[i];

  if (pat === '**') {
    if (matchSegments(patSegs, permSegs, i + 1, j)) return true; // konsumerer 0
    for (let k = j; k < permSegs.length; k++) {
      if (matchSegments(patSegs, permSegs, i + 1, k + 1)) return true; // konsumerer >=1
    }
    return false;
  }

  if (j === permSegs.length) return false;
  if (pat === '*' || pat === permSegs[j]) return matchSegments(patSegs, permSegs, i + 1, j + 1);
  return false;
}

export function matchPermission(pattern: string, perm: string): boolean {
  if (pattern === '**') return true;
  return matchSegments(split(pattern), split(perm));
}

export function matchesAny(patterns: string[] | undefined, perm: string): boolean {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some((p) => matchPermission(p, perm));
}

/** Evaluer “kan jeg X?” ut fra effektive tillatelser. */
export function canFromEffective(perms: EffectivePerms | undefined, target: string): boolean {
  if (!perms) return false;
  // deny før allow
  if (matchesAny(perms.deny || [], target)) return false;
  return matchesAny(perms.allow || [], target);
}
