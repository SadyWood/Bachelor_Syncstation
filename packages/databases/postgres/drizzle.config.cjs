// packages/databases/drizzle.config.cjs
const { defineConfig } = require('drizzle-kit');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const DB_NAME = process.env.DB_NAME ?? 'users';
const ADMIN = process.env.ADMIN_DATABASE_CONNECTION;
if (!ADMIN) throw new Error('Missing ADMIN_DATABASE_CONNECTION in .env');

const toPosix = (p) => p.split(path.sep).join('/');

const SCHEMA_MAP = {
  users: toPosix(path.resolve(__dirname, './src/schema/users/schema.ts')),
  workstation: toPosix(path.resolve(__dirname, './src/schema/workstation/schema.ts')),
  marketplace: toPosix(path.resolve(__dirname, './src/schema/marketplace/schema.ts')),
  syncstation: toPosix(path.resolve(__dirname, './src/schema/syncstation/schema.ts')),
};

const adminUrlForDb = `${ADMIN.replace(/\/?$/, '')}/${DB_NAME}`;

// Make `out` RELATIVE (POSIX) so drizzle-kit ikke dobbel-prefikser på Windows
const outDir = toPosix(
  path.relative(
    process.cwd(),
    path.resolve(__dirname, 'migrations', DB_NAME)
  )
);

module.exports = defineConfig({
  dialect: 'postgresql',
  dbCredentials: { url: adminUrlForDb },
  schema: SCHEMA_MAP[DB_NAME],
  out: outDir,
  verbose: true,
  strict: true,
  tsconfig: path.resolve(__dirname, './tsconfig.json'),
});
