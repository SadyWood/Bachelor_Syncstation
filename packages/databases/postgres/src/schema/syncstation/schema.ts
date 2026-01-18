// packages/databases/postgres/src/schema/syncstation/schema.ts
// Syncstation database schema - On-set logging MVP
import { pgTable, uuid, text, timestamp, varchar, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/* ========================================
   ENUMS
   ======================================== */

export const syncStatusEnum = pgEnum('sync_status', ['local', 'pending', 'synced', 'failed']);
export const attachmentTypeEnum = pgEnum('attachment_type', ['image', 'video', 'document']);

/* ========================================
   LOG ENTRIES - Main logging table
   ======================================== */

export const logEntries = pgTable('log_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(), // References users.id from users DB
  contentNodeId: uuid('content_node_id').notNull(), // References content_nodes.node_id from workstation DB

  // Content
  title: text('title'),
  notes: text('notes'),
  metadata: text('metadata').$type<Record<string, unknown>>(),

  // Sync tracking
  syncStatus: syncStatusEnum('sync_status').notNull().default('local'),
  syncError: text('sync_error'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
});

/* ========================================
   LOG ATTACHMENTS - Media & files
   ======================================== */

export const logAttachments = pgTable('log_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  logEntryId: uuid('log_entry_id').notNull().references(() => logEntries.id, { onDelete: 'cascade' }),

  // File metadata
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(), // bytes
  storagePath: text('storage_path').notNull(), // Path in file storage
  attachmentType: attachmentTypeEnum('attachment_type').notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ========================================
   RELATIONS
   ======================================== */

export const logEntriesRelations = relations(logEntries, ({ many }) => ({
  attachments: many(logAttachments),
}));

export const logAttachmentsRelations = relations(logAttachments, ({ one }) => ({
  logEntry: one(logEntries, {
    fields: [logAttachments.logEntryId],
    references: [logEntries.id],
  }),
}));
