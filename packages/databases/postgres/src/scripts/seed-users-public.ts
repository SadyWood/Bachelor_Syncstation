import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { createHash } from 'crypto';
import { users } from '../schema/users-public/users.js';
import { uuidv7 } from '../lib/uuidv7.js';

// Load .env from project root (packages/databases/postgres/src/scripts -> root)
const dirPath = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(dirPath, '../../../../../.env') });

// Simple password hashing (matches apps/api/src/lib/password.ts)
function hashPassword(password: string): string {
  return createHash('sha256').update(`${password}salt`).digest('hex');
}

async function seedUsersPublic() {
  console.log('Seeding USERS_PUBLIC database...\n');

  const client = postgres(process.env.USERS_PUBLIC_DATABASE_URL_ADMIN || '');
  const db = drizzle(client, { schema: { users } });

  try {
    // Create demo users
    const demoPassword = 'Demo1234!'; // Strong demo password
    const demoUsers = [
      {
        id: uuidv7(),
        email: 'demo@consumer-app.com',
        passwordHash: hashPassword(demoPassword),
        fullName: 'Demo User',
        birthdate: '1990-01-01',
        isVerified: true,
      },
      {
        id: uuidv7(),
        email: 'walter@example.com',
        passwordHash: hashPassword(demoPassword),
        fullName: 'Walter White',
        birthdate: '1958-09-07',
        isVerified: true,
      },
      {
        id: uuidv7(),
        email: 'jesse@example.com',
        passwordHash: hashPassword(demoPassword),
        fullName: 'Jesse Pinkman',
        birthdate: '1984-09-24',
        isVerified: true,
      },
      {
        id: uuidv7(),
        email: 'don@example.com',
        passwordHash: hashPassword(demoPassword),
        fullName: 'Don Draper',
        birthdate: '1926-06-01',
        isVerified: true,
      },
    ];

    await db.insert(users).values(demoUsers);
    console.log(`✅ Inserted ${demoUsers.length} demo users`);

    console.log(`\nDemo users (all passwords: "${demoPassword}"):`);
    demoUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.fullName})`);
    });

    await client.end();
    console.log('\n✅ USERS_PUBLIC database seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await client.end();
    process.exit(1);
  }
}

seedUsersPublic();
