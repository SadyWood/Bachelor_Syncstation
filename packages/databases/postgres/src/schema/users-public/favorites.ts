import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userFavorites = pgTable(
  'user_favorites',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id').notNull(), // References catalog_demo.subjects.id
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.subjectId] }),
    userIdx: index('idx_favorites_user').on(table.userId),
    subjectIdx: index('idx_favorites_subject').on(table.subjectId),
  })
);
