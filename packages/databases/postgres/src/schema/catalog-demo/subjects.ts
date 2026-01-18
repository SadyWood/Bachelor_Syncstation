import { pgTable, uuid, varchar, text, boolean, jsonb, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const subjects = pgTable(
  'subjects',
  {
    id: uuid('id').primaryKey(),
    label: varchar('label', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    isSellable: boolean('is_sellable').notNull().default(false),
    heroImageUrl: text('hero_image_url'),
    externalUrl: text('external_url'),
    description: text('description'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    typeIdx: index('idx_subjects_type').on(table.type),
    sellableIdx: index('idx_subjects_sellable').on(table.isSellable),
    typeCheck: check(
      'check_type',
      sql`${table.type} IN ('person', 'character', 'product_prop', 'apparel', 'location', 'vehicle', 'other')`
    ),
  })
);
