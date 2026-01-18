// packages/databases/src/scripts/migrate-add-slug.ts
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const ADMIN_URL = process.env.ADMIN_DATABASE_CONNECTION;
if (!ADMIN_URL) {
  throw new Error('Missing ADMIN_DATABASE_CONNECTION in .env');
}

const workstationUrl = `${ADMIN_URL.replace(/\/?$/, '')}/workstation`;

async function runMigration() {
  const pool = new pg.Pool({ connectionString: workstationUrl });
  const db = drizzle(pool);

  console.log('🔧 Running migration: Add slug column and extended media kinds...');

  try {
    await db.execute(sql`
      -- Add slug column to content_nodes
      ALTER TABLE content_nodes 
      ADD COLUMN IF NOT EXISTS slug varchar(160);
    `);
    console.log('✅ Added slug column');

    await db.execute(sql`
      -- Create partial unique index for root project slugs
      CREATE UNIQUE INDEX IF NOT EXISTS ux_root_slug
      ON content_nodes(tenant_id, slug)
      WHERE parent_id IS NULL AND slug IS NOT NULL;
    `);
    console.log('✅ Created unique index for root slugs');

    await db.execute(sql`
      -- Insert new video kinds
      INSERT INTO media_kind(media_class_id, kind_code, description) VALUES
        (1, 'teaser', 'Short teaser video'),
        (1, 'clip', 'Short video clip'),
        (1, 'featurette', 'Featurette'),
        (1, 'behind_the_scenes', 'Behind the scenes footage'),
        (1, 'interview', 'Interview video')
      ON CONFLICT (kind_code) DO NOTHING;
    `);
    console.log('✅ Added new video media kinds');

    await db.execute(sql`
      -- Insert new audio kinds
      INSERT INTO media_kind(media_class_id, kind_code, description) VALUES
        (2, 'soundtrack', 'Soundtrack/OST track'),
        (2, 'audio_trailer', 'Audio trailer or preview')
      ON CONFLICT (kind_code) DO NOTHING;
    `);
    console.log('✅ Added new audio media kinds');

    await db.execute(sql`
      -- Insert new image kinds
      INSERT INTO media_kind(media_class_id, kind_code, description) VALUES
        (3, 'cover', 'Cover art'),
        (3, 'banner', 'Wide promotional banner'),
        (3, 'still', 'Scene still or frame'),
        (3, 'storyboard', 'Storyboard image')
      ON CONFLICT (kind_code) DO NOTHING;
    `);
    console.log('✅ Added new image media kinds');

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
