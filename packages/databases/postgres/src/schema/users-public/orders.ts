import { pgTable, uuid, varchar, numeric, integer, timestamp, jsonb, primaryKey, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('created'),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('NOK'),
    shippingAddressSnapshot: jsonb('shipping_address_snapshot').notNull(), // Snapshot of address at time of order
    createdAt: timestamp('created_at').notNull().defaultNow(),
    paidAt: timestamp('paid_at'),
  },
  (table) => ({
    userIdx: index('idx_orders_user').on(table.userId),
    createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
    statusCheck: check('check_status', sql`${table.status} IN ('created', 'paid', 'cancelled', 'refunded')`),
  })
);

export const orderItems = pgTable(
  'order_items',
  {
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull(), // References catalog_demo.products.id
    subjectId: uuid('subject_id'), // Optional: References catalog_demo.subjects.id
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('NOK'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.orderId, table.productId] }),
    orderIdx: index('idx_order_items_order').on(table.orderId),
    quantityCheck: check('check_quantity', sql`${table.quantity} > 0`),
  })
);

// Optional: Payment tracking (for Stripe, Vipps, etc.)
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    providerPaymentId: varchar('provider_payment_id', { length: 255 }),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index('idx_payments_order').on(table.orderId),
    providerCheck: check('check_provider', sql`${table.provider} IN ('stripe', 'vipps', 'paypal')`),
    statusCheck: check('check_status', sql`${table.status} IN ('initiated', 'succeeded', 'failed')`),
  })
);
