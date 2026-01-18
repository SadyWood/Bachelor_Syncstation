import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { subjects } from '../schema/catalog-demo/subjects.js';
import { products } from '../schema/catalog-demo/products.js';
import { subjectProducts } from '../schema/catalog-demo/subject-products.js';
import { content } from '../schema/catalog-demo/content.js';
import { contentSubjects } from '../schema/catalog-demo/content-subjects.js';
import { uuidv7 } from '../lib/uuidv7.js';

// Load .env from project root
const dirPath = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(dirPath, '../../../../../.env') });

const SEED_DATA_DIR = resolve(dirPath, '../seed-data');

// ============================================================================
// TYPES for seed data JSON files
// ============================================================================

interface ContentJson {
  media_title: string;
  season: number;
  episode: number;
  episode_title: string;
  duration_seconds: number;
  thumbnail_url?: string;
  description?: string;
}

interface SubjectJson {
  label: string;
  type: 'person' | 'character' | 'product_prop' | 'apparel' | 'location' | 'vehicle' | 'other';
  is_sellable: boolean;
  hero_image_url?: string;
  external_url?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface ProductJson {
  subject_label: string;
  products: Array<{
    title: string;
    brand?: string;
    base_price: number;
    currency: string;
    product_url?: string;
    image_url?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }>;
}

interface TimelineSegment {
  start: string; // "MM:SS" or "MM:SS.ms"
  end: string;
}

interface TimelineJson {
  subject_label: string;
  segments: TimelineSegment[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse timestamp string (MM:SS or MM:SS.ms) to seconds (rounded to integer)
 */
function parseTimestamp(ts: string): number {
  const parts = ts.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    return Math.round(minutes * 60 + seconds);
  }
  return 0;
}

/**
 * Read and parse a JSON file
 */
async function readJson<T>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) {
    return null;
  }
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

/**
 * Get all show directories in seed-data folder
 */
async function getShowDirectories(): Promise<string[]> {
  if (!existsSync(SEED_DATA_DIR)) {
    return [];
  }
  const entries = await readdir(SEED_DATA_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

// ============================================================================
// MAIN SEEDER
// ============================================================================

async function seedCatalogDemo() {
  console.log('Seeding CATALOG_DEMO database...\n');
  console.log(`Looking for seed data in: ${SEED_DATA_DIR}\n`);

  const connectionString = process.env.CATALOG_DEMO_DATABASE_URL_ADMIN;
  if (!connectionString) {
    throw new Error('CATALOG_DEMO_DATABASE_URL_ADMIN not set');
  }

  const client = postgres(connectionString);
  const db = drizzle(client, {
    schema: { subjects, products, subjectProducts, content, contentSubjects },
  });

  try {
    const shows = await getShowDirectories();

    if (shows.length === 0) {
      console.log('No show directories found in seed-data/');
      console.log('Create a folder (e.g., seed-data/stranger-things/) with:');
      console.log('  - content.json');
      console.log('  - subjects.json');
      console.log('  - products.json');
      console.log('  - timeline.json');
      await client.end();
      return;
    }

    console.log(`Found ${shows.length} show(s): ${shows.join(', ')}\n`);

    let totalSubjects = 0;
    let totalProducts = 0;
    let totalLinks = 0;
    let totalContent = 0;
    let totalTimeline = 0;

    for (const showDir of shows) {
      console.log(`\n━━━ Processing: ${showDir} ━━━`);
      const showPath = resolve(SEED_DATA_DIR, showDir);

      // Read JSON files
      const contentJson = await readJson<ContentJson>(resolve(showPath, 'content.json'));
      const subjectsJson = await readJson<SubjectJson[]>(resolve(showPath, 'subjects.json'));
      const productsJson = await readJson<ProductJson[]>(resolve(showPath, 'products.json'));
      const timelineJson = await readJson<TimelineJson[]>(resolve(showPath, 'timeline.json'));

      if (!contentJson) {
        console.log(`  ⚠️  Missing content.json, skipping ${showDir}`);
        continue;
      }
      if (!subjectsJson) {
        console.log(`  ⚠️  Missing subjects.json, skipping ${showDir}`);
        continue;
      }

      // Map to track subject label -> id for linking
      const subjectLabelToId = new Map<string, string>();

      // ---- INSERT SUBJECTS ----
      const subjectsData = subjectsJson.map((s) => {
        const id = uuidv7();
        subjectLabelToId.set(s.label, id);
        return {
          id,
          label: s.label,
          type: s.type,
          isSellable: s.is_sellable,
          heroImageUrl: s.hero_image_url || null,
          externalUrl: s.external_url || null,
          description: s.description || null,
          metadata: s.metadata || {},
        };
      });

      if (subjectsData.length > 0) {
        await db.insert(subjects).values(subjectsData);
        totalSubjects += subjectsData.length;
        console.log(`  ✅ Inserted ${subjectsData.length} subjects`);
      }

      // ---- INSERT PRODUCTS & LINKS ----
      if (productsJson && productsJson.length > 0) {
        for (const productGroup of productsJson) {
          const subjectId = subjectLabelToId.get(productGroup.subject_label);
          if (!subjectId) {
            console.log(`  ⚠️  Subject "${productGroup.subject_label}" not found for products`);
            continue;
          }

          for (let i = 0; i < productGroup.products.length; i += 1) {
            const p = productGroup.products[i];
            const productId = uuidv7();

            await db.insert(products).values({
              id: productId,
              title: p.title,
              brand: p.brand || null,
              imageUrl: p.image_url || null,
              basePrice: String(p.base_price),
              currency: p.currency,
              productUrl: p.product_url || null,
              description: p.description || null,
              metadata: p.metadata || {},
            });
            totalProducts += 1;

            // Link product to subject
            await db.insert(subjectProducts).values({
              subjectId,
              productId,
              sortOrder: i,
            });
            totalLinks += 1;
          }
        }
        console.log(`  ✅ Inserted products and links`);
      }

      // ---- INSERT CONTENT (Episode) ----
      const contentId = uuidv7();
      await db.insert(content).values({
        id: contentId,
        mediaTitle: contentJson.media_title,
        episodeTitle: contentJson.episode_title,
        season: contentJson.season,
        episode: contentJson.episode,
        durationSeconds: contentJson.duration_seconds,
        thumbnailUrl: contentJson.thumbnail_url || null,
        description: contentJson.description || null,
      });
      totalContent += 1;
      console.log(`  ✅ Inserted content: ${contentJson.media_title} S${contentJson.season}E${contentJson.episode}`);

      // ---- INSERT TIMELINE ----
      if (timelineJson && timelineJson.length > 0) {
        const timelineEntries: Array<{
          id: string;
          contentId: string;
          subjectId: string;
          startTime: number;
          endTime: number;
          metadata: Record<string, unknown>;
        }> = [];

        for (const entry of timelineJson) {
          const subjectId = subjectLabelToId.get(entry.subject_label);
          if (!subjectId) {
            console.log(`  ⚠️  Subject "${entry.subject_label}" not found for timeline`);
            continue;
          }

          // Each subject can have multiple segments (when they appear/disappear)
          for (const segment of entry.segments) {
            timelineEntries.push({
              id: uuidv7(),
              contentId,
              subjectId,
              startTime: parseTimestamp(segment.start),
              endTime: parseTimestamp(segment.end),
              metadata: entry.metadata || {},
            });
          }
        }

        if (timelineEntries.length > 0) {
          await db.insert(contentSubjects).values(timelineEntries);
          totalTimeline += timelineEntries.length;
          console.log(`  ✅ Inserted ${timelineEntries.length} timeline entries`);
        }
      }
    }

    await client.end();

    console.log('\n════════════════════════════════════════');
    console.log('           SEEDING COMPLETE');
    console.log('════════════════════════════════════════');
    console.log(`  Subjects:        ${totalSubjects}`);
    console.log(`  Products:        ${totalProducts}`);
    console.log(`  Product Links:   ${totalLinks}`);
    console.log(`  Content:         ${totalContent}`);
    console.log(`  Timeline:        ${totalTimeline}`);
    console.log('════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await client.end();
    process.exit(1);
  }
}

seedCatalogDemo();
