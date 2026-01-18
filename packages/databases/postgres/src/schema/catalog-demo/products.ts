import { pgTable, uuid, varchar, text, numeric, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    brand: varchar('brand', { length: 100 }),
    imageUrl: text('image_url'),
    basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('NOK'),
    productUrl: text('product_url'),
    description: text('description'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    priceIdx: index('idx_products_price').on(table.basePrice),
    brandIdx: index('idx_products_brand').on(table.brand),
  })
);
