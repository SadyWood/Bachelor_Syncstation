// packages/databases/src/schema/users/schema.ts
import { sql } from 'drizzle-orm';
import { pgTable, text, uuid, timestamp, boolean, integer, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';

// --- users ---
export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  email: text('email').notNull().unique(),
  firstName: text('first_name'), // Made nullable to allow users created via invites without password.
  lastName: text('last_name'), // Made nullable to allow users created via invites without password.
  displayName: text('display_name'), // Made nullable to allow users created via invites without password.
  passwordHash: text('password_hash'), // Made nullable to allow users created via invites without password.
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- platforms (tiny reference table) ---
export const platforms = pgTable('platforms', {
  id: integer('id').primaryKey(),                  // 1,2,3...
  code: text('code').notNull().unique(),           // 'workstation' | 'marketplace' | 'nexus'
  title: text('title').notNull(),                  // 'Workstation'
  description: text('description'),                // optional docs
});

// --- user_access_to_platform ---
export const userAccessToPlatform = pgTable('user_access_to_platform', {
  userId: uuid('user_uuid').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platformId: integer('platform_id').notNull().references(() => platforms.id, { onDelete: 'cascade' }),
  hasAccess: boolean('has_access').notNull().default(false),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.platformId] }),
}));

// --- invites (email based) ---
export const invites = pgTable('invites', {
  token: text('token').primaryKey(), // secure random
  invitedByUserId: uuid('invited_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  email: text('email').notNull(),
  platformId: integer('platform_id').references(() => platforms.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

// --- refresh_tokens ---
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});
