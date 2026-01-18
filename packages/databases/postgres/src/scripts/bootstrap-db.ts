// packages/databases/scripts/bootstrap-db.ts
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..'); // packages/databases
const sqlDir = resolve(root, 'bootstrap');

const ADMIN = process.env.ADMIN_DATABASE_CONNECTION;
if (!ADMIN) {
  console.error('❌ Missing env ADMIN_DATABASE_CONNECTION. Example: postgres://postgres:postgres@localhost:5432');
  process.exit(1);
}

const files = [
  '00_cluster_bootstrap.sql',
  '10_users_db.sql',
  '10_workstation_db.sql',
  '10_marketplace_db.sql',
];

console.log('────────────────────────────────────────────────────────');
console.log('Hoolsy | Bootstrap cluster (roles + DBs + grants)');
console.log('────────────────────────────────────────────────────────\n');
console.log(`Using ADMIN_DATABASE_CONNECTION: ${ADMIN}`);
console.log('');

function runPsql(file: string): Promise<void> {
  return new Promise((resolveP, rejectP) => {
    const full = resolve(sqlDir, file);
    console.log(`\n→ Running ${file} on postgres …`);

    const child = spawn(
      'psql',
      [`${ADMIN}/postgres`, '-v', 'ON_ERROR_STOP=1', '-f', full],
      { stdio: 'inherit', shell: true },
    );

    child.on('close', (code) => {
      if (code === 0) resolveP();
      else rejectP(new Error(`psql exited with code ${code} while running ${file}`));
    });
  });
}

(async () => {
  try {
    for (const f of files) await runPsql(f);
    console.log('\n✅ Bootstrap complete.');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ ${message}`);
    process.exit(1);
  }
})();
