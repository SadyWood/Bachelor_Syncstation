import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Load .env from project root (packages/databases/postgres/src/scripts -> root)
const dirPath = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(dirPath, '../../../../../.env') });

async function runMigrations() {
  console.log('Running migrations...\n');

  // USERS_PUBLIC database migrations
  try {
    console.log('Migrating USERS_PUBLIC database...');
    const usersPublicUrl = process.env.USERS_PUBLIC_DATABASE_URL_ADMIN || 'postgresql://postgres:postgres@localhost:5433/users_public';
    const usersPublicClient = postgres(usersPublicUrl);
    const usersPublicDb = drizzle(usersPublicClient);
    await migrate(usersPublicDb, { migrationsFolder: './migrations/users-public' });
    await usersPublicClient.end();
    console.log('✅ USERS_PUBLIC database migrated');
  } catch (error) {
    console.error('❌ USERS_PUBLIC database migration failed:', error);
  }

  // CATALOG_DEMO database migrations
  try {
    console.log('Migrating CATALOG_DEMO database...');
    const catalogDemoUrl = process.env.CATALOG_DEMO_DATABASE_URL_ADMIN || 'postgresql://postgres:postgres@localhost:5433/catalog_demo';
    const catalogDemoClient = postgres(catalogDemoUrl);
    const catalogDemoDb = drizzle(catalogDemoClient);
    await migrate(catalogDemoDb, { migrationsFolder: './migrations/catalog-demo' });
    await catalogDemoClient.end();
    console.log('✅ CATALOG_DEMO database migrated');
  } catch (error) {
    console.error('❌ CATALOG_DEMO database migration failed:', error);
  }

  console.log('\nMigrations complete.');
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
