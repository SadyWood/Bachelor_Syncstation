import * as path from 'node:path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { usersSchema } from '../../schema/index.js';

const { platforms } = usersSchema;

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PLATFORM_ROWS = [
  { id: 1, code: 'workstation', title: 'Workstation', description: 'Internal productivity platform' },
  { id: 2, code: 'marketplace', title: 'Marketplace', description: 'External marketplace' },
  { id: 3, code: 'nexus',       title: 'Nexus',       description: 'Admin / SSO nexus' },
];

function adminUrlFor(dbName: string): string {
  const base = process.env.ADMIN_DATABASE_CONNECTION;
  if (!base) throw new Error('ADMIN_DATABASE_CONNECTION is missing in .env');
  const u = new URL(base);
  u.pathname = `/${dbName}`;
  return u.toString();
}

async function logConn(pool: Pool, tableFq: string) {
  const c = await pool.connect();
  try {
    const info = await c.query('select current_user, current_database() as db');
    const p = await c.query(
      `select
         has_table_privilege($1::regclass,'SELECT') as sel,
         has_table_privilege($1::regclass,'INSERT') as ins,
         has_table_privilege($1::regclass,'UPDATE') as upd,
         has_table_privilege($1::regclass,'DELETE') as del`,
      [tableFq],
    );
    const i = info.rows[0], r = p.rows[0];
    console.log(`✓ Connected (admin) → user=${i.current_user} db=${i.db}`);
    console.log(`  Privs on ${tableFq}: [S:${r.sel} I:${r.ins} U:${r.upd} D:${r.del}]`);
  } finally {
    c.release();
  }
}

export async function seedPlatforms() {
  const url = adminUrlFor('users');
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  try {
    console.log('Seeding platforms …');
    await logConn(pool, 'public.platforms');

    for (const row of PLATFORM_ROWS) {
      const inserted = await db
        .insert(platforms)
        .values(row)
        .onConflictDoNothing({ target: platforms.id })
        .returning({ id: platforms.id });

      if (inserted.length > 0) {
        console.log(`  ➕ created '${row.code}' (id=${row.id})`);
      } else {
        console.log(`  • exists  '${row.code}' (id=${row.id})`);
      }
    }

    const { rows } = await pool.query<{ n: string }>('select count(*)::text as n from public.platforms');
    console.log(`Done. platforms rows = ${rows[0]?.n ?? '0'}`);
  } finally {
    await pool.end();
  }
}
