// apps/api/src/utils/perm-match.ts
// Segment-based glob matcher for dot-separated permission codes.
// Supports:
//  - '*'  = match exactly one segment
//  - '**' = match zero or more segments (including none)

/**
 * Recursively matches a dot-separated permission code against a pattern with glob wildcards.
 *
 * Supported wildcards:
 *   - '*'  : matches exactly one segment (e.g. 'user.*.read' matches 'user.admin.read')
 *   - '**' : matches zero or more segments (e.g. 'user.**.read' matches 'user.read', 'user.admin.read', 'user.admin.extra.read')
 *
 * @param patSegs Array of pattern segments (split by '.')
 * @param permSegs Array of permission segments (split by '.')
 * @param i Current index in patSegs (default 0)
 * @param j Current index in permSegs (default 0)
 * @returns {boolean} True if the permission matches the pattern, false otherwise.
 *
 * @example
 * // Pattern: 'user.*.read', Permission: 'user.admin.read' => true
 * // Pattern: 'user.**.read', Permission: 'user.admin.extra.read' => true
 * // Pattern: 'user.**', Permission: 'user' => true
 * // Pattern: 'user.*.read', Permission: 'user.read' => false
 */
function matchSegments(patSegs: string[], permSegs: string[], i = 0, j = 0): boolean {
  // If we've consumed the pattern
  if (i === patSegs.length) return j === permSegs.length;

  const pat = patSegs[i];

  if (pat === '**') {
    // Try matching zero or more segments
    // Case 1: '**' consumes nothing
    if (matchSegments(patSegs, permSegs, i + 1, j)) return true;
    // Case 2: '**' consumes one or more segments
    for (let k = j; k < permSegs.length; k++) {
      if (matchSegments(patSegs, permSegs, i + 1, k + 1)) return true;
    }
    return false;
  }

  if (j === permSegs.length) return false; // pattern remains but perm done

  if (pat === '*' || pat === permSegs[j]) {
    return matchSegments(patSegs, permSegs, i + 1, j + 1);
  }

  return false;
}

export function matchPermission(pattern: string, perm: string): boolean {
  if (pattern === '**') return true;
  const patSegs = pattern.split('.').filter(Boolean);
  const permSegs = perm.split('.').filter(Boolean);
  return matchSegments(patSegs, permSegs);
}

export function matchesAny(patterns: string[], perm: string): boolean {
  for (const p of patterns) {
    if (matchPermission(p, perm)) return true;
  }
  return false;
}
