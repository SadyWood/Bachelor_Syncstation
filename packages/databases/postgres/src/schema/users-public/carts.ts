import { pgTable, uuid, varchar, integer, numeric, timestamp, primaryKey, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_carts_user').on(table.userId),
    statusUserIdx: index('idx_carts_status').on(table.status, table.userId),
    statusCheck: check('check_status', sql`${table.status} IN ('active', 'checked_out', 'abandoned')`),
  })
);

export const cartItems = pgTable(
  'cart_items',
  {
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull(), // References catalog_demo.products.id
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('NOK'),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.cartId, table.productId] }),
    cartIdx: index('idx_cart_items_cart').on(table.cartId),
    quantityCheck: check('check_quantity', sql`${table.quantity} > 0`),
  })
);
