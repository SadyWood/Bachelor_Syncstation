// packages/databases/src/seed/setup/workstation.ts
import * as path from 'node:path';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { v7 as uuidv7 } from 'uuid';
import {
  PERMISSION_CATALOG,
  GLOBAL_ROLE_TEMPLATES,
  PERMISSION_CODES,
  type RoleTemplate,
} from './ws.permissions.js';
import {
  wsTenants, mediaClass, mediaKind, wsPermissionsCatalog, wsRoles,
  taskStatus, taskPriority, taskType,
} from '../../schema/workstation/schema.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function adminUrlFor(dbName: string): string {
  const base = process.env.ADMIN_DATABASE_CONNECTION;
  if (!base) throw new Error('ADMIN_DATABASE_CONNECTION is missing in .env');
  const u = new URL(base);
  u.pathname = `/${dbName}`;
  return u.toString();
}

export async function seedWorkstationLookups() {
  const url = adminUrlFor('workstation');
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  try {
    console.log('Seeding workstation lookups…');

    // Media classes
    await db.insert(mediaClass).values([
      { id: 1, classCode: 'video' },
      { id: 2, classCode: 'audio' },
      { id: 3, classCode: 'image' },
    ]).onConflictDoNothing();
    console.log('  ✔ mediaClass');

    // Media kinds
    await db.insert(mediaKind).values([
      { mediaClassId: 1, kindCode: 'movie',            description: 'Feature film' },
      { mediaClassId: 1, kindCode: 'episode_video',    description: 'TV/Web episode' },
      { mediaClassId: 1, kindCode: 'trailer',          description: 'Promo trailer' },
      { mediaClassId: 2, kindCode: 'episode_audio',    description: 'Podcast episode' },
      { mediaClassId: 2, kindCode: 'song',             description: 'Single music track' },
      { mediaClassId: 2, kindCode: 'audiobook_chapter', description: 'Audiobook chapter' },
      { mediaClassId: 3, kindCode: 'poster',           description: 'Poster / key art' },
    ]).onConflictDoNothing();
    console.log('  ✔ mediaKind');

    // Demo tenants (optional; safe to keep for testing)
    await db.insert(wsTenants).values([
      { id: uuidv7(), code: 'demo-netflix', name: 'Netflix' },
      { id: uuidv7(), code: 'demo-hbo',     name: 'HBO' },
    ]).onConflictDoNothing();
    console.log('  ✔ wsTenants');

    // ─────────────────────────────────────────────────────────────
    // Permissions catalog (driven by ws.permissions.ts)
    // Keep catalog clean: delete any codes not in the current list, then upsert ours.
    if (PERMISSION_CODES.length > 0) {
      const list = sql.join(
        PERMISSION_CODES.map((c: string) => sql.raw(`'${c}'`)),
        sql`, `,
      );
      await db.execute(sql`
        DELETE FROM "ws_permissions_catalog"
        WHERE permission_code NOT IN (${list})
      `);
    } else {
      // If catalog is empty by config, clear table to avoid stale entries
      await db.execute(sql`DELETE FROM "ws_permissions_catalog"`);
    }

    await db.insert(wsPermissionsCatalog)
      .values(PERMISSION_CATALOG)
      .onConflictDoUpdate({
        target: wsPermissionsCatalog.permissionCode,
        set: { description: sql`EXCLUDED.description` },
      });
    console.log('  ✔ wsPermissionsCatalog (synced from ws.permissions.ts)');

    // Global roles (Admin, Manage, Viewer) based on templates
    // Upsert by unique (tenant_id, name). Keep only these three globally.
    const keepRoleNames = GLOBAL_ROLE_TEMPLATES.map((r: RoleTemplate) => r.name);
    const keepList = sql.join(keepRoleNames.map((n: string) => sql.raw(`'${n}'`)), sql`, `);
    await db.execute(sql`
      DELETE FROM "ws_roles"
      WHERE tenant_id IS NULL
        AND name NOT IN (${keepList})
    `);

    for (const t of GLOBAL_ROLE_TEMPLATES) {
      await db.insert(wsRoles).values({
        roleId: uuidv7(),
        name: t.name,
        tenantId: null,            // global template
        scopeLevel: 'platform' as const,
        // IMPORTANT: pass real JS object for jsonb
        defaultPerms: t.defaultPerms,
      })
        .onConflictDoUpdate({
          target: [wsRoles.tenantId, wsRoles.name],
          set: {
            scopeLevel: sql`EXCLUDED.scope_level`,
            defaultPerms: sql`EXCLUDED.default_perms`,
          },
        });
    }
    console.log('  ✔ wsRoles (synced from ws.permissions.ts)');

    // Task lookups
    await db.insert(taskStatus).values([
      { id: 1, code: 'OPEN' },
      { id: 2, code: 'IN_PROGRESS' },
      { id: 3, code: 'BLOCKED' },
      { id: 4, code: 'DONE' },
    ]).onConflictDoNothing();
    console.log('  ✔ taskStatus');

    await db.insert(taskPriority).values([
      { id: 1, code: 'LOW',    weight: 1 },
      { id: 2, code: 'MEDIUM', weight: 2 },
      { id: 3, code: 'HIGH',   weight: 3 },
      { id: 4, code: 'URGENT', weight: 4 },
    ]).onConflictDoNothing();
    console.log('  ✔ taskPriority');

    await db.insert(taskType).values([
      { code: 'EP_METADATA',   description: 'Write / validate episode synopsis', defaultDeadlineHours: 72  },
      { code: 'SUBJECT_QA',    description: 'Confirm AI subject tags',          defaultDeadlineHours: 96  },
      { code: 'SUBJECT_LINK',  description: 'Add subject to registry',          defaultDeadlineHours: 48  },
      { code: 'SUBJECT_ENRICH', description: 'Enrich subject',                   defaultDeadlineHours: 168 },
    ]).onConflictDoNothing();
    console.log('  ✔ taskType');

    console.log('Workstation seeds finished.');
  } finally {
    await pool.end();
  }
}
