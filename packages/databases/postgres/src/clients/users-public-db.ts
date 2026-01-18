import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as usersPublicSchema from '../schema/users-public/index.js';

type UsersPublicDb = PostgresJsDatabase<typeof usersPublicSchema>;

let dbInstance: UsersPublicDb | null = null;

function getDb(): UsersPublicDb {
  if (!dbInstance) {
    if (!process.env.USERS_PUBLIC_DATABASE_URL) {
      throw new Error('USERS_PUBLIC_DATABASE_URL environment variable is not set');
    }
    const queryClient = postgres(process.env.USERS_PUBLIC_DATABASE_URL);
    dbInstance = drizzle(queryClient, { schema: usersPublicSchema });
  }
  return dbInstance;
}

// Lazy-initialized database client using Proxy
export const usersPublicDb: UsersPublicDb = new Proxy({} as UsersPublicDb, {
  get(_target, prop) {
    const db = getDb();
    const value = db[prop as keyof UsersPublicDb];
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  },
});
