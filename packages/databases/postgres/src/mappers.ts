import type { users } from './schema/users/schema.js';
import type { PublicUser } from '@workstation/schema';

export function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    email: row.email,
    // map null -> undefined så Zod optional() passer
    firstName: row.firstName ?? undefined,
    lastName: row.lastName ?? undefined,
    displayName: row.displayName ?? undefined,
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}
