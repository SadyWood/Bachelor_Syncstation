// packages/databases/src/scripts/seed-db.ts
//
// Purpose: Run foundational seed data for the project.
// - Seeds users.platforms
// - Seeds workstation lookup/reference data
//
// Run: pnpm db:seed  (maps to: tsx packages/databases/src/scripts/seed-db.ts)

import * as fs from 'node:fs';
import * as path from 'node:path';
import dotenv from 'dotenv';
// Import seeds (ESM paths end with .js when executed via tsx)
import { seedPlatforms } from '../seed/setup/users.js';
import { seedWorkstationLookups } from '../seed/setup/workstation.js';

// ----------------------------- env bootstrap -----------------------------

/** Walk up the tree to find the repo-level .env */
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

// ------------------------------- utilities -------------------------------

function maskUrl(u?: string): string {
  if (!u) return '(missing)';
  try {
    const url = new URL(u);
    if (url.password) url.password = '***';
    url.search = '';
    return url.toString();
  } catch {
    return '(invalid URL)';
  }
}

function deriveAdminDb(base: string | undefined, db: string): string {
  if (!base) return '(missing)';
  try {
    const u = new URL(base);
    u.pathname = `/${db}`;
    if (u.password) u.password = '***';
    u.search = '';
    return u.toString();
  } catch {
    return '(invalid URL)';
  }
}

function hr(): void {
  console.log('─'.repeat(72));
}

async function runStep<T>(label: string, fn: () => Promise<T>): Promise<T> {
  console.log(`→ ${label} …`);
  const start = Date.now();
  try {
    const result = await fn();
    console.log(`  ✓ ${label} (${Date.now() - start} ms)`);
    return result;
  } catch (err) {
    console.error(`  ✗ ${label} failed`);
    throw err;
  }
}

// ------------------------------- main flow -------------------------------

async function main() {
  console.log('Hoolsy | Setup seeds');
  hr();
  console.log(`Using .env: ${envPath}`);

  // Preview ONLY admin connection (policy: all Drizzle + seeds use admin)
  const adminBase = process.env.ADMIN_DATABASE_CONNECTION;
  console.log('Admin connection preview:');
  console.log(`  ADMIN_DATABASE_CONNECTION = ${maskUrl(adminBase)}`);
  console.log(`  → admin → users        = ${deriveAdminDb(adminBase, 'users')}`);
  console.log(`  → admin → workstation  = ${deriveAdminDb(adminBase, 'workstation')}`);
  console.log(`  → admin → marketplace  = ${deriveAdminDb(adminBase, 'marketplace')}`);
  hr();

  if (!adminBase) {
    console.error('ERROR: ADMIN_DATABASE_CONNECTION is missing in .env');
    process.exit(1);
  }

  // Run seeds (each seed reads ADMIN_DATABASE_CONNECTION internally)
  await runStep('Seed users.platforms', () => seedPlatforms());
  await runStep('Seed workstation lookups', () => seedWorkstationLookups());

  hr();
  console.log('All setup seeds completed successfully.');
}

// Consistent exit behavior for CI/local runs
main().catch((err: unknown) => {
  const code = (err && typeof err === 'object' && 'code' in err) ? (err.code as string) : undefined;
  const msg = err instanceof Error ? err.message : String(err);

  console.error('Seed run failed.');
  if (code) console.error(`PG code: ${code}`);
  console.error(msg);

  // Still useful to hint on permission problems even with admin policy
  if (code === '42501') {
    console.error('\nHint: Permission denied. Ensure the admin role has required privileges on target databases.');
  }
  process.exit(1);
});
