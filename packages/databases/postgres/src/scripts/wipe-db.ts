// packages/databases/src/scripts/wipe-db.ts
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import dotenv from 'dotenv';
import { Client } from 'pg';

// --- locate .env like the other scripts ---
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

if (envPath) dotenv.config({ path: envPath });

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function buildAdminDbUrl(base: string, dbName: string): string {
  const u = new URL(base);
  u.pathname = `/${dbName}`;
  return u.toString();
}

// We keep it explicit so we don't accidentally touch drizzle meta/system tables.
// TRUNCATE ... CASCADE handles FK order.
const USERS_TABLES = [
  'refresh_tokens',
  'user_access_to_platform',
  'invites',
  'users',
  'platforms',
];

const WORKSTATION_TABLES = [
  'task_activity',
  'task_contributor',
  'tasks',
  'task_type',
  'task_status',
  'task_priority',
  'ws_user_memberships',
  'ws_roles',
  'ws_permissions_catalog',
  'content_closure',
  'content_nodes',
  'media_kind',
  'media_class',
  'ws_tenant_members',
  'ws_tenants',
];

const MARKETPLACE_TABLES: string[] = [
  // add marketplace tables when they exist
];

async function confirmDangerousAction(): Promise<void> {
  const argsYes = process.argv.includes('--yes') || process.argv.includes('-y');
  const envYes = String(process.env.WIPE_I_UNDERSTAND || '').toLowerCase() === 'true';
  if (argsYes || envYes) {
    console.log('⚠️  Confirmation bypassed via --yes / WIPE_I_UNDERSTAND=true.');
    return;
  }

  console.log('────────────────────────────────────────────────────────');
  console.log('DANGER ZONE: This will TRUNCATE (wipe) data from all app tables');
  console.log('in users, workstation and marketplace databases.');
  console.log('This is irreversible for the current data.');
  console.log('To proceed, type: yes');
  console.log('────────────────────────────────────────────────────────\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer: string = await new Promise((resolve) =>
    rl.question('Are you sure you want to WIPE all data? Type "yes"\n> ', (a) => resolve(a.trim())),
  );
  rl.close();

  if (answer !== 'yes') {
    fail('Confirmation did not match "yes". Aborting.');
  }
}

async function truncateAll(url: string, tables: string[], label: string) {
  if (!tables.length) {
    console.log(`→ ${label}: nothing to wipe (no tables listed).`);
    return;
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    console.log(`→ ${label}: truncating ${tables.length} tables…`);
    // Wrap in a single transaction
    await client.query('BEGIN');
    const identList = tables.map(t => `"public"."${t}"`).join(', ');
    await client.query(`TRUNCATE TABLE ${identList} RESTART IDENTITY CASCADE;`);
    await client.query('COMMIT');
    console.log(`  ✓ ${label}: wipe complete.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('\n────────────────────────────────────────────────────────');
  console.log('Hoolsy | Wipe data (TRUNCATE all app tables)');
  console.log('────────────────────────────────────────────────────────\n');

  const ADMIN = process.env.ADMIN_DATABASE_CONNECTION;
  if (!ADMIN) {
    fail('Missing ADMIN_DATABASE_CONNECTION. Example: postgres://postgres:postgres@localhost:5432');
  }

  await confirmDangerousAction();

  const usersUrl = buildAdminDbUrl(ADMIN, 'users');
  const wsUrl = buildAdminDbUrl(ADMIN, 'workstation');
  const marketUrl = buildAdminDbUrl(ADMIN, 'marketplace');

  try {
    await truncateAll(wsUrl, WORKSTATION_TABLES, 'workstation');
    await truncateAll(usersUrl, USERS_TABLES, 'users');
    await truncateAll(marketUrl, MARKETPLACE_TABLES, 'marketplace');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    fail(message);
  }

  console.log('\n✅ Wipe complete. You can now run seeds again:\n');
  console.log('   pnpm db:seed');
  console.log('   SEED_DEMO_OK=true pnpm db:seed:demo\n');
}

main().catch((e) => fail(String(e?.message || e)));
