// packages/databases/scripts/nuke-db.ts
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import dotenv from 'dotenv';

// Load .env from repo root (walk upwards), mirroring test-connections.ts
function findDotenv(startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const envPath = findDotenv(process.cwd()) ?? findDotenv(__dirname);
if (envPath) {
  dotenv.config({ path: envPath });
}

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function assertPsqlAvailable() {
  const probe = spawnSync('psql', ['--version'], { stdio: 'pipe' });
  if (probe.error || probe.status !== 0) {
    fail('Could not run "psql". Make sure PostgreSQL is installed and "psql" is in your PATH.');
  }
}

function runSql(conn: string, sqlFileAbs: string) {
  console.log(`\n→ Running: ${path.basename(sqlFileAbs)}\n`);
  const res = spawnSync(
    'psql',
    [
      `${conn}/postgres`, // connect to the postgres DB for cluster ops
      '-v',
      'ON_ERROR_STOP=1',
      '-f',
      sqlFileAbs,
    ],
    { stdio: 'inherit' },
  );
  if (res.status !== 0) {
    fail(`psql exited with code ${res.status}`);
  }
}

async function confirmDangerousAction(): Promise<void> {
  // Allow non-interactive bypass for CI/scripts
  const argsYes = process.argv.includes('--yes') || process.argv.includes('-y');
  const envYes = String(process.env.WIPE_I_UNDERSTAND || '').toLowerCase() === 'true';
  if (argsYes || envYes) {
    console.log('⚠️  Confirmation bypassed via --yes / WIPE_I_UNDERSTAND=true.');
    return;
  }

  console.log('────────────────────────────────────────────────────────');
  console.log('DANGER ZONE: This will DROP databases & roles via SQL file');
  console.log('This is irreversible. Make sure you are targeting the correct cluster.');
  console.log('To proceed, type exactly: nuke database');
  console.log('────────────────────────────────────────────────────────\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer: string = await new Promise((resolve) =>
    rl.question('Are you sure you want to nuke the database(s)? Type exactly: nuke database\n> ', (a) => resolve(a.trim())),
  );
  rl.close();

  if (answer !== 'nuke database') {
    fail('Confirmation phrase did not match. Aborting.');
  }
}

async function main() {
  console.log('\n────────────────────────────────────────────────────────');
  console.log('Hoolsy | Nuke (DROP databases + roles via bootstrap file)');
  console.log('────────────────────────────────────────────────────────\n');

  const conn = process.env.ADMIN_DATABASE_CONNECTION;
  if (!conn) {
    fail(
      'Missing ADMIN_DATABASE_CONNECTION env var.\n' +
        'Example: postgres://postgres:postgres@localhost:5432',
    );
  }

  assertPsqlAvailable();

  const sqlFile = path.resolve(process.cwd(), 'packages/databases/postgres/bootstrap/zz_drop_everything.sql');
  if (!fs.existsSync(sqlFile)) {
    fail(`SQL file not found: ${sqlFile}`);
  }

  await confirmDangerousAction();
  runSql(conn, sqlFile);
  console.log('\n✅ Nuke complete.\n');
}

main().catch((e) => fail(String(e?.message || e)));
