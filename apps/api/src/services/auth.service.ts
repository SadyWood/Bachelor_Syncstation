// apps/api/src/services/auth.service.ts
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  findUserByEmail as repoFindUserByEmail,
  findUserById as repoFindUserById,
  insertUser,
  updateInvitedUser,
  upsertAccess,
  selectAccessSummary,
  findInviteByToken,
  consumeInvite,
  insertRefresh,
  deleteAllRefreshForUser,
  findUserIdByRefreshPlain,
  getPlatformCode as repoGetPlatformCode,
} from '../repos/users.repo.js';
import {
  listWsMemberships,
  activateMembershipsForUserByInvite,
  activateAllPendingMembershipsForUser,
} from '../repos/workstation.repo.js';
import type { schema } from '../db.js';
import type { FastifyInstance } from 'fastify';

// Internal types for this service
type UserInsert = typeof schema.users.$inferInsert;
type UserUpdate = Partial<Omit<UserInsert, 'id' | 'email'>>;

/* ------------------------- helpers ------------------------- */

const Duration = z.string().regex(/^\d+(m|h|d)$/i);
function addDuration(from: Date, ttl: string): Date {
  const m = Duration.parse(ttl).match(/^(\d+)([mhd])$/i);
  if (!m) throw new Error(`Invalid duration format: ${ttl}`);
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();

  function getMs(): number {
    if (unit === 'm') return n * 60_000;
    if (unit === 'h') return n * 3_600_000;
    return n * 86_400_000; // d
  }

  return new Date(from.getTime() + getMs());
}

function randomToken(): string {
  // URL-safe refresh token
  return crypto.randomBytes(48).toString('base64url');
}

/* ------------------------- public user schema ------------------------- */

export function publicUser(u: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  createdAt?: Date | null;
}) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    displayName: u.displayName ?? '',
    createdAt: u.createdAt?.toISOString(),
  };
}

/* ------------------------- auth primitives ------------------------- */

export async function getUserByEmail(email: string) {
  return repoFindUserByEmail(email.toLowerCase());
}

export async function getUserByIdService(id: string) {
  return repoFindUserById(id);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signAccess(app: FastifyInstance, payload: object, ttl: string) {
  return app.jwt.sign(payload, { expiresIn: ttl });
}

export function newRefreshToken(): string {
  return randomToken();
}

export async function storeRefresh(userId: string, plain: string, ttl: string) {
  const now = new Date();
  const exp = addDuration(now, ttl);
  const tokenHash = await bcrypt.hash(plain, 10);
  await insertRefresh(userId, tokenHash, exp);
  return exp;
}

export async function rotateRefresh(userId: string, _currentPlain: string, ttl: string) {
  // Simple & safe: revoke all then issue new
  await deleteAllRefreshForUser(userId);
  const refreshPlain = newRefreshToken();
  const exp = await storeRefresh(userId, refreshPlain, ttl);
  return { refreshPlain, exp };
}

export async function findUserIdByRefreshToken(plain: string) {
  return findUserIdByRefreshPlain(plain);
}

export async function revokeAllUserRefresh(userId: string) {
  await deleteAllRefreshForUser(userId);
}

/* ------------------------- registration / invites ------------------------- */

// Service-input: first/last/display kan mangle → normaliseres til ''/null
const NewUserInput = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().nullable().optional(),
  password: z.string().min(8),
});
type NewUserInput = z.infer<typeof NewUserInput>;

export async function createUser(input: NewUserInput): Promise<{ id: string }> {
  const data = NewUserInput.parse(input);
  const passwordHash = await bcrypt.hash(data.password, 10);

  const values: UserInsert = {
    id: crypto.randomUUID(),
    email: data.email.toLowerCase(),
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    displayName: data.displayName ?? null,
    passwordHash,
  };

  const row = await insertUser(values);
  return { id: row.id };
}

const CompleteInvitedUserInput = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().nullable().optional(),
  password: z.string().min(8),
});
type CompleteInvitedUserInput = z.infer<typeof CompleteInvitedUserInput>;

export async function completeInvitedUser(input: CompleteInvitedUserInput): Promise<{ id: string } | null> {
  const data = CompleteInvitedUserInput.parse(input);

  const existing = await repoFindUserByEmail(data.email.toLowerCase());
  if (!existing) return null;

  const passwordHash = await bcrypt.hash(data.password, 10);

  const patch: UserUpdate = {
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    displayName: data.displayName ?? null,
    passwordHash,
    isActive: true,
  };

  const updated = await updateInvitedUser(existing.id, patch);
  return { id: updated.id };
}

export async function findInvite(token: string) {
  return findInviteByToken(token);
}

export async function markInviteConsumed(token: string, when: Date) {
  await consumeInvite(token, when);
}

export async function getPlatformCodeById(id: number) {
  return repoGetPlatformCode(id);
}

/** After a successful register, activate matching roster rows. */
export async function activateTenantMembershipsAfterRegister(userId: string, inviteToken?: string) {
  const count = inviteToken
    ? await activateMembershipsForUserByInvite(userId, inviteToken)
    : await activateAllPendingMembershipsForUser(userId);
  return count;
}

/* ------------------------- access/memberships ------------------------- */

export async function grantAccess(userId: string, platformId: number, hasAccess: boolean) {
  await upsertAccess(userId, platformId, hasAccess);
}

export async function getAccessSummary(userId: string) {
  const rows = await selectAccessSummary(userId);
  return rows.map(r => ({
    platform: r.code,               // e.g. 'workstation'
    hasAccess: !!r.hasAccess,
    preferences: r.preferences ?? {},
    updatedAt: r.updatedAt?.toISOString(),
  }));
}

export async function getWsMemberships(userId: string) {
  const rows = await listWsMemberships(userId);
  return rows.map(r => ({
    tenantId: r.tenantId,                         // can be null in DB → caller may filter
    nodeId: r.nodeId ?? null,                     // keep null in payload, don't filter out
    role: r.roleName,
    createdAt: r.createdAt?.toISOString() ?? null, // ensure null instead of undefined
  }));
}

/**
 * Choose current tenant in priority order:
 * 1) Explicit X-WS-Tenant header (if user is member)
 * 2) User preference under platform 'workstation' → preferences.ws.tenantId
 * 3) First membership by createdAt
 */
export function resolveCurrentTenant(opts: {
  headerValue?: string;
  accessPrefs?: Array<{ platform: string; preferences?: Record<string, unknown> }>;
  memberships: Array<{ tenantId: string; createdAt?: string }>;
}): string | undefined {
  const header = (opts.headerValue ?? '').trim();
  const hasHeader = header && opts.memberships.some(m => m.tenantId === header);
  if (hasHeader) return header;

  // Proper Zod validation for preferences instead of 'any' casting
  const PrefsSchema = z.object({
    ws: z.object({
      tenantId: z.string().uuid().optional(),
    }).optional(),
  }).optional();

  const ws = (opts.accessPrefs ?? []).find(p => p.platform === 'workstation');
  const parsed = PrefsSchema.safeParse(ws?.preferences);
  const pref = parsed.success ? parsed.data?.ws?.tenantId : undefined;

  if (typeof pref === 'string' && opts.memberships.some(m => m.tenantId === pref)) {
    return pref;
  }

  const first = [...opts.memberships].sort(
    (a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''),
  )[0];
  return first?.tenantId ?? undefined;
}
