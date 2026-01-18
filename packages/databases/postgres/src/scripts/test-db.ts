// packages/databases/src/scripts/test-connections.ts
//
// Verifies DB connection strings from .env and prints tables + row counts.
// - ADMIN_DATABASE_CONNECTION (base URL w/o DB) → tests /postgres,/users,/workstation,/marketplace
// - Service URLs: USERS_DB_URL, WORKSTATION_DB_URL, MARKETPLACE_DB_URL
//
// Run: pnpm tsx packages/databases/src/scripts/test-connections.ts
// Or:  "db:test": "tsx packages/databases/src/scripts/test-connections.ts"

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'pg';

// ---------- utils to find .env ----------
function findDotenv(startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const envPath =
  findDotenv(process.cwd()) ??
  findDotenv(typeof __dirname === 'string' ? __dirname : process.cwd());
if (!envPath) {
  console.error('ERROR: Could not find a .env file by walking up the directory tree.');
  process.exit(1);
}
dotenv.config({ path: envPath });

// ---------- helpers ----------
type Target = { name: string; url: string; kind: 'admin' | 'service' };

function buildAdminDbUrl(base: string, dbName: string): string {
  const u = new URL(base); // base like: postgres://postgres:postgres@localhost:5432
  u.pathname = `/${dbName}`;
  return u.toString();
}
function isValidUrl(v: unknown): v is string {
  if (typeof v !== 'string' || !v) return false;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

// ---------- collect targets ----------
const ADMIN_BASE = process.env.ADMIN_DATABASE_CONNECTION;

const adminTargets: Target[] = [];
if (isValidUrl(ADMIN_BASE) && ADMIN_BASE) {
  const databases = ['postgres', 'users', 'workstation', 'marketplace'] as const;
  for (const db of databases) {
    adminTargets.push({
      name: `ADMIN → ${db}`,
      url: buildAdminDbUrl(ADMIN_BASE, db),
      kind: 'admin' as const,
    });
  }
}

const servicePairs = [
  { name: 'USERS_DB_URL', url: process.env.USERS_DB_URL },
  { name: 'WORKSTATION_DB_URL', url: process.env.WORKSTATION_DB_URL },
  { name: 'MARKETPLACE_DB_URL', url: process.env.MARKETPLACE_DB_URL },
] as const;

const serviceTargets: Target[] = servicePairs.reduce<Target[]>((acc, { name, url }) => {
  if (isValidUrl(url)) {
    acc.push({ name, url, kind: 'service' });
  } else if (url) {
    console.warn(`WARN: ${name} is not a valid URL → ${url}`);
  }
  return acc;
}, []);

const allTargets: Target[] = [...adminTargets, ...serviceTargets];

// ---------- info helpers ----------
async function checkPgcrypto(client: Client, label: string) {
  const r = await client.query<{ extname: string }>(
    'SELECT extname FROM pg_extension WHERE extname = \'pgcrypto\'',
  );
  const ok = r.rows.length > 0;
  console.log(`  [INFO] ${label}: pgcrypto installed = ${ok}`);
}

async function listTables(client: Client): Promise<{ schema: string; name: string }[]> {
  const r = await client.query<{
    table_schema: string;
    table_name: string;
  }>(
    `SELECT table_schema, table_name
     FROM information_schema.tables
     WHERE table_type='BASE TABLE'
       AND table_schema NOT IN ('pg_catalog','information_schema')
     ORDER BY table_schema, table_name`,
  );
  return r.rows.map((x) => ({ schema: x.table_schema, name: x.table_name }));
}

async function countExactWithTimeout(client: Client, schema: string, name: string, ms = 5000) {
  // Set a per-session statement timeout; reset after
  await client.query(`SET LOCAL statement_timeout = ${ms}`);
  const r = await client.query<{ n: string }>(
    `SELECT count(*)::bigint::text AS n FROM ${schema}.${name}`,
  );
  return BigInt(r.rows[0].n);
}

async function countEstimate(client: Client, schema: string, name: string) {
  const r = await client.query<{ est: string }>(
    `SELECT GREATEST(reltuples,0)::bigint::text AS est
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind = 'r'`,
    [schema, name],
  );
  return r.rows.length ? BigInt(r.rows[0].est) : 0n;
}

async function printTablesAndCounts(client: Client) {
  const tables = await listTables(client);
  if (tables.length === 0) {
    console.log('  [INFO] No base tables found (outside pg_catalog/information_schema).');
    return;
  }
  console.log(`  [INFO] Tables in this DB: ${tables.length}`);
  for (const t of tables) {
    let rows: bigint | null = null;
    let note = '';
    try {
      rows = await countExactWithTimeout(client, t.schema, t.name, 5000);
      note = 'exact';
    } catch {
      // fall back to estimate if exact count is slow/forbidden
      try {
        rows = await countEstimate(client, t.schema, t.name);
        note = 'estimate';
      } catch {
        note = 'count_failed';
      }
    }
    const label =
      rows !== null ? `${rows.toString()} (${note})` : `n/a (${note})`;
    console.log(`    [TABLE] ${t.schema}.${t.name}  → rows=${label}`);
  }
}

// ---------- smoke tests ----------
async function testAdmin(client: Client, label: string) {
  const schemaName = `__smoke_${Math.random().toString(36).slice(2, 8)}`;
  await client.query(`CREATE SCHEMA ${schemaName}`);
  await client.query(`CREATE TABLE ${schemaName}.__ping (x int)`);
  await client.query(`INSERT INTO ${schemaName}.__ping(x) VALUES (1)`);
  const r = await client.query<{ n: number }>(`SELECT count(*)::int AS n FROM ${schemaName}.__ping`);
  await client.query(`DROP SCHEMA ${schemaName} CASCADE`);
  console.log(`  [OK] ${label}: DDL/WRITE (schema) → rows=${r.rows[0].n}`);
}

async function testService(client: Client, label: string) {
  await client.query('CREATE TEMP TABLE __smoke(x int)');
  await client.query('INSERT INTO __smoke(x) VALUES (1), (2)');
  const r = await client.query<{ n: number }>('SELECT count(*)::int AS n FROM __smoke');
  console.log(`  [OK] ${label}: TEMP TABLE write/read → rows=${r.rows[0].n}`);
}

async function testOne(t: Target) {
  const client = new Client({
    connectionString: t.url,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    const info = await client.query<{ current_user: string; current_database: string; server_version: string }>(
      'SELECT current_user, current_database(), version() AS server_version',
    );
    const row = info.rows[0];
    console.log(`✓ CONNECT ${t.name} → user=${row.current_user}, db=${row.current_database}`);

    const privs = await client.query<{ can_connect: boolean; schema_usage: boolean }>(
      `SELECT
         has_database_privilege(current_database(), 'CONNECT') AS can_connect,
         has_schema_privilege('public', 'USAGE') AS schema_usage`,
    );
    console.log(`  [INFO] privileges: CONNECT=${privs.rows[0].can_connect}  public.USAGE=${privs.rows[0].schema_usage}`);

    await checkPgcrypto(client, t.name);

    if (t.kind === 'admin') {
      await testAdmin(client, t.name);
    } else {
      await testService(client, t.name);
    }

    // NEW: list tables + row counts
    await printTablesAndCounts(client);
  } catch (err) {
    console.error(`✗ FAIL ${t.name}`);
    const code = (err && typeof err === 'object' && 'code' in err) ? (err.code as string) : '';
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  → ${code} ${message}`);
  } finally {
    try {
      await client.end();
    } catch {
      // Connection cleanup errors can be ignored
    }
  }
}

// ---------- run ----------
(async () => {
  console.log(`Using .env: ${envPath}`);
  if (!ADMIN_BASE) {
    console.warn('WARN: ADMIN_DATABASE_CONNECTION is missing – skipping admin (/postgres,/users,/workstation,/marketplace).');
  } else if (!isValidUrl(ADMIN_BASE)) {
    console.error(`ERROR: ADMIN_DATABASE_CONNECTION is not a valid URL: ${ADMIN_BASE}`);
  } else {
    console.log(`ADMIN_DATABASE_CONNECTION: ${ADMIN_BASE}`);
  }

  if (allTargets.length === 0) {
    console.warn('No valid connection strings found. Check your .env.');
    process.exit(1);
  }

  console.log('-'.repeat(70));
  for (const t of allTargets) {
    await testOne(t);
  }
  console.log('-'.repeat(70));
  console.log('Done.');
})();
