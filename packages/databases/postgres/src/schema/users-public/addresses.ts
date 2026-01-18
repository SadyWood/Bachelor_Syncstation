import { pgTable, uuid, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userAddresses = pgTable(
  'user_addresses',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 100 }),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    addressLine1: varchar('address_line1', { length: 255 }).notNull(),
    addressLine2: varchar('address_line2', { length: 255 }),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    countryCode: varchar('country_code', { length: 2 }).notNull(), // ISO 3166-1 alpha-2
    phone: varchar('phone', { length: 50 }),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_addresses_user').on(table.userId),
  })
);
