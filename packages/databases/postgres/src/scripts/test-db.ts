import 'dotenv/config';
import postgres from 'postgres';

async function testDatabases() {
  const databases = [
    { name: 'USERS_PUBLIC', url: process.env.USERS_PUBLIC_DATABASE_URL },
    { name: 'CATALOG_DEMO', url: process.env.CATALOG_DEMO_DATABASE_URL },
  ];

  console.log('Testing database connections...\n');

  for (const db of databases) {
    try {
      if (!db.url) {
        console.log(`❌ ${db.name} database: Missing connection string`);
        continue;
      }

      const client = postgres(db.url);
      await client`SELECT 1`;
      console.log(`✅ ${db.name} database connected`);
      await client.end();
    } catch (error) {
      console.log(`❌ ${db.name} database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\nDatabase connectivity test complete.');
}

testDatabases().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
