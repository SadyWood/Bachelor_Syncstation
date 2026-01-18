// apps/api/src/db.ts
import * as schema from '@hoolsy/databases';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './config/env.js';

/**
 * We keep one Drizzle client per database. Each client is typed
 * with ONLY the tables that live in that database. This prevents
 * “cross-DB” leakage in queries at compile time.
 */

// Users DB
const usersPool = new Pool({ connectionString: env.USERS_DB_URL });
export const dbUsers = drizzle(usersPool, {
  schema: {
    users: schema.users,
    platforms: schema.platforms,
    userAccessToPlatform: schema.userAccessToPlatform,
    invites: schema.invites,
    refreshTokens: schema.refreshTokens,
  },
});

// Workstation DB
const wsPool = new Pool({ connectionString: env.WORKSTATION_DB_URL });
export const dbWs = drizzle(wsPool, {
  schema: {
    wsTenants: schema.wsTenants,
    wsTenantMembers: schema.wsTenantMembers, // ← no cast/any
    wsRoles: schema.wsRoles,
    wsUserMemberships: schema.wsUserMemberships,
    contentNodes: schema.contentNodes,
    contentClosure: schema.contentClosure,
    mediaClass: schema.mediaClass,
    mediaKind: schema.mediaKind,
    wsPermissionsCatalog: schema.wsPermissionsCatalog,
    taskStatus: schema.taskStatus,
    taskPriority: schema.taskPriority,
    taskType: schema.taskType,
    tasks: schema.tasks,
    taskActivity: schema.taskActivity,
    taskContributor: schema.taskContributor,
  },
});

// Back-compat default (some legacy imports may still use `db`)
export const db = dbUsers;
export { schema };
