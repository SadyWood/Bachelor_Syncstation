import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as catalogDemoSchema from '../schema/catalog-demo/index.js';

type CatalogDemoDb = PostgresJsDatabase<typeof catalogDemoSchema>;

let dbInstance: CatalogDemoDb | null = null;

function getDb(): CatalogDemoDb {
  if (!dbInstance) {
    if (!process.env.CATALOG_DEMO_DATABASE_URL) {
      throw new Error('CATALOG_DEMO_DATABASE_URL environment variable is not set');
    }
    const queryClient = postgres(process.env.CATALOG_DEMO_DATABASE_URL);
    dbInstance = drizzle(queryClient, { schema: catalogDemoSchema });
  }
  return dbInstance;
}

// Lazy-initialized database client using Proxy
export const catalogDemoDb: CatalogDemoDb = new Proxy({} as CatalogDemoDb, {
  get(_target, prop) {
    const db = getDb();
    const value = db[prop as keyof CatalogDemoDb];
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  },
});
