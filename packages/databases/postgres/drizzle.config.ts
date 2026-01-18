import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

// Default config for users_public database
// To generate migrations for catalog_demo, use: DRIZZLE_DB=catalog pnpm db:generate
export default defineConfig({
  schema: process.env.DRIZZLE_DB === 'catalog'
    ? './src/schema/catalog-demo/*.ts'
    : './src/schema/users-public/*.ts',
  out: process.env.DRIZZLE_DB === 'catalog'
    ? './migrations/catalog-demo'
    : './migrations/users-public',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DRIZZLE_DB === 'catalog'
      ? process.env.CATALOG_DEMO_DATABASE_URL_ADMIN || ''
      : process.env.USERS_PUBLIC_DATABASE_URL_ADMIN || '',
  },
});
