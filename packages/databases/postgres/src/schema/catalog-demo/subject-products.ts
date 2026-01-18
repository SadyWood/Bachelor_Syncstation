import { pgTable, uuid, integer, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { subjects } from './subjects';
import { products } from './products';

export const subjectProducts = pgTable(
  'subject_products',
  {
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.subjectId, table.productId] }),
    subjectIdx: index('idx_subject_products_subject').on(table.subjectId),
    productIdx: index('idx_subject_products_product').on(table.productId),
  })
);
