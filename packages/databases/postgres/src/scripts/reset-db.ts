import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';

async function resetDatabases() {
  console.log('Resetting databases...\n');

  const databases = [
    {
      name: 'USERS_PUBLIC',
      adminUrl: process.env.USERS_PUBLIC_DATABASE_URL_ADMIN || '',
      migrationsFolder: './migrations/users-public',
    },
    {
      name: 'CATALOG_DEMO',
      adminUrl: process.env.CATALOG_DEMO_DATABASE_URL_ADMIN || '',
      migrationsFolder: './migrations/catalog-demo',
    },
  ];

  for (const database of databases) {
    try {
      console.log(`Resetting ${database.name} database...`);
      const client = postgres(database.adminUrl);
      const db = drizzle(client);

      // Drop all schemas including migration tracking
      await db.execute(sql`
        DROP SCHEMA IF EXISTS public CASCADE;
        DROP SCHEMA IF EXISTS drizzle CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
      `);

      // Run migrations
      await migrate(db, { migrationsFolder: database.migrationsFolder });

      // Grant permissions to consumer_user
      await db.execute(sql`
        GRANT ALL ON SCHEMA public TO consumer_user;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO consumer_user;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO consumer_user;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO consumer_user;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO consumer_user;
      `);

      await client.end();
      console.log(`✅ ${database.name} database reset and migrated\n`);
    } catch (error) {
      console.error(`❌ ${database.name} database reset failed:`, error);
    }
  }

  console.log('Database reset complete. Running seeding...\n');

  // Run seeding scripts
  const { spawn } = await import('child_process');

  // Use pnpm exec to run tsx (works cross-platform)
  const seedUsersPublic = spawn('pnpm', ['exec', 'tsx', 'src/scripts/seed-users-public.ts'], {
    stdio: 'inherit',
    shell: true
  });
  await new Promise((resolve) => seedUsersPublic.on('close', resolve));

  const seedCatalogDemo = spawn('pnpm', ['exec', 'tsx', 'src/scripts/seed-catalog-demo.ts'], {
    stdio: 'inherit',
    shell: true
  });
  await new Promise((resolve) => seedCatalogDemo.on('close', resolve));

  console.log('\n✅ Database reset and seeding complete.');
}

resetDatabases().catch((error) => {
  console.error('Reset failed:', error);
  process.exit(1);
});
