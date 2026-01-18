// packages/databases/scripts/run-migration.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: pnpm tsx scripts/run-migration.ts <migration-file>');
  process.exit(1);
}

const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
const sql = fs.readFileSync(migrationPath, 'utf-8');

const dbUrl = process.env.WORKSTATION_DB_URL;
if (!dbUrl) {
  console.error('WORKSTATION_DB_URL environment variable is not set');
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl });

async function runMigration() {
  try {
    await client.connect();
    console.log(`Running migration: ${migrationFile}`);
    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
