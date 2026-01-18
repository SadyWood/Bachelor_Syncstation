import { pgTable, uuid, integer, jsonb, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { content } from './content';
import { subjects } from './subjects';

export const contentSubjects = pgTable(
  'content_subjects',
  {
    id: uuid('id').primaryKey(),
    contentId: uuid('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    startTime: integer('start_time').notNull(), // Seconds from start
    endTime: integer('end_time').notNull(), // Seconds from start
    metadata: jsonb('metadata').notNull().default({}), // Confidence, prominence, etc.
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    contentIdx: index('idx_content_subjects_content').on(table.contentId),
    timelineIdx: index('idx_content_subjects_timeline').on(table.contentId, table.startTime, table.endTime),
    subjectIdx: index('idx_content_subjects_subject').on(table.subjectId),
    timesCheck: check('check_times', sql`${table.startTime} < ${table.endTime}`),
  })
);
