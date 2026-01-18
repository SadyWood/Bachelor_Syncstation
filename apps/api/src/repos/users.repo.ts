// apps/api/src/repos/users.repo.ts
import bcrypt from 'bcryptjs';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { dbUsers, schema } from '../db.js';

// Internal DB row types (not exported - implementation detail)
type UserRow = typeof schema.users.$inferSelect;
type UserInsert = typeof schema.users.$inferInsert;
type UserUpdate = Partial<Omit<UserInsert, 'id' | 'email'>>;
type InviteRow = typeof schema.invites.$inferSelect;

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [u] = await dbUsers.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase()));
  return u || null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const [u] = await dbUsers.select().from(schema.users).where(eq(schema.users.id, id));
  return u || null;
}

export async function insertUser(values: UserInsert): Promise<UserRow> {
  // Normalize email to lowercase before inserting
  const normalizedValues = { ...values, email: values.email.toLowerCase() };
  const [row] = await dbUsers.insert(schema.users).values(normalizedValues).returning();
  return row;
}

export async function updateInvitedUser(id: string, values: UserUpdate): Promise<UserRow> {
  const [row] = await dbUsers.update(schema.users).set(values).where(eq(schema.users.id, id)).returning();
  return row;
}

export async function upsertAccess(userId: string, platformId: number, hasAccess: boolean) {
  await dbUsers.insert(schema.userAccessToPlatform)
    .values({ userId, platformId, hasAccess, preferences: {} })
    .onConflictDoUpdate({
      target: [schema.userAccessToPlatform.userId, schema.userAccessToPlatform.platformId],
      set: { hasAccess },
    });
}

export async function selectAccessSummary(userId: string) {
  return dbUsers
    .select({
      code: schema.platforms.code,
      hasAccess: schema.userAccessToPlatform.hasAccess,
      preferences: schema.userAccessToPlatform.preferences,
      updatedAt: schema.userAccessToPlatform.updatedAt,
    })
    .from(schema.userAccessToPlatform)
    .innerJoin(schema.platforms, eq(schema.platforms.id, schema.userAccessToPlatform.platformId))
    .where(eq(schema.userAccessToPlatform.userId, userId));
}

export async function findInviteByToken(token: string): Promise<InviteRow | null> {
  const [inv] = await dbUsers.select().from(schema.invites).where(eq(schema.invites.token, token));
  return inv || null;
}

export async function consumeInvite(token: string, when: Date): Promise<void> {
  await dbUsers.update(schema.invites).set({ consumedAt: when }).where(eq(schema.invites.token, token));
}

export async function getPlatformCode(platformId: number): Promise<string | undefined> {
  const [p] = await dbUsers
    .select({ code: schema.platforms.code })
    .from(schema.platforms)
    .where(eq(schema.platforms.id, platformId));
  return p?.code;
}

// Refresh tokens (hashed)
export async function insertRefresh(userId: string, tokenHash: string, expiresAt: Date) {
  await dbUsers.insert(schema.refreshTokens).values({ userId, tokenHash, expiresAt });
}
export async function deleteAllRefreshForUser(userId: string) {
  await dbUsers.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId));
}

export async function findUserIdByRefreshPlain(plain: string): Promise<string | null> {
  const now = new Date();
  const rows = await dbUsers
    .select({
      userId: schema.refreshTokens.userId,
      tokenHash: schema.refreshTokens.tokenHash,
    })
    .from(schema.refreshTokens)
    .where(and(isNull(schema.refreshTokens.revokedAt), gt(schema.refreshTokens.expiresAt, now)));

  for (const r of rows) {
    const ok = await bcrypt.compare(plain, r.tokenHash);
    if (ok) return r.userId;
  }
  return null;
}
