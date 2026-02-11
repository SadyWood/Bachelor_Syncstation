// apps/api/src/repos/sync.log.repo.ts
import {
  LogEntrySchema,
  LogEntrySummarySchema,
  LogAttachmentSchema,
  type LogEntry,
  type LogEntrySummary,
  type LogAttachment,
  type SyncStatusT,
} from '@hk26/schema';
import { and, eq, sql, desc } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { dbSync, schema } from '../db.js';

/* ========================================
   HELPER: Map DB row to DTO
   ======================================== */

type LogEntryRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  content_node_id: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  sync_status: 'local' | 'pending' | 'synced' | 'failed';
  last_sync_error: string | null;
  created_at: Date;
  updated_at: Date;
  synced_at: Date | null;
};

type LogAttachmentRow = {
  id: string;
  log_entry_id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  attachment_type: 'image' | 'video' | 'document';
  created_at: Date;
};

function mapLogEntryToDto(row: LogEntryRow): LogEntry {
  return LogEntrySchema.parse({
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    nodeId: row.content_node_id,
    title: row.title ?? '',
    description: row.description,
    status: row.sync_status,
    lastSyncError: row.last_sync_error,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    syncedAt: row.synced_at?.toISOString() ?? null,
  });
}

function mapLogEntryToSummary(row: LogEntryRow & { attachment_count: number }): LogEntrySummary {
  return LogEntrySummarySchema.parse({
    id: row.id,
    nodeId: row.content_node_id,
    title: row.title ?? '',
    status: row.sync_status,
    attachmentCount: row.attachment_count,
    createdAt: row.created_at.toISOString(),
  });
}

function mapAttachmentToDto(row: LogAttachmentRow): LogAttachment {
  return LogAttachmentSchema.parse({
    id: row.id,
    logEntryId: row.log_entry_id,
    filename: row.filename,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    storagePath: row.storage_path,
    attachmentType: row.attachment_type,
    createdAt: row.created_at.toISOString(),
  });
}

/* ========================================
   LOG ENTRIES - CRUD operations
   ======================================== */

/**
 * List log entries (optionally filter by content node)
 */
export async function listLogEntries(
  tenantId: string,
  nodeId?: string,
  status?: SyncStatusT,
): Promise<LogEntrySummary[]> {
  const conditions = [
    eq(schema.logEntries.tenantId, tenantId),
  ];

  if (nodeId) {
    conditions.push(eq(schema.logEntries.contentNodeId, nodeId));
  }

  if (status) {
    conditions.push(eq(schema.logEntries.syncStatus, status));
  }

  const rows = await dbSync
    .select({
      id: schema.logEntries.id,
      tenant_id: schema.logEntries.tenantId,
      user_id: schema.logEntries.userId,
      content_node_id: schema.logEntries.contentNodeId,
      title: schema.logEntries.title,
      description: schema.logEntries.description,
      metadata: schema.logEntries.metadata,
      sync_status: schema.logEntries.syncStatus,
      last_sync_error: schema.logEntries.lastSyncError,
      created_at: schema.logEntries.createdAt,
      updated_at: schema.logEntries.updatedAt,
      synced_at: schema.logEntries.syncedAt,
      // Count attachments for this log entry
      attachment_count: sql<number>`(
        SELECT COUNT(*)::int
        FROM log_attachments
        WHERE log_attachments.log_entry_id = log_entries.id
      )`.as('attachment_count'),
    })
    .from(schema.logEntries)
    .where(and(...conditions))
    .orderBy(desc(schema.logEntries.createdAt));

  return rows.map(mapLogEntryToSummary);
}

/**
 * Get a single log entry by ID
 */
export async function getLogEntry(id: string, tenantId: string): Promise<LogEntry | null> {
  const rows = await dbSync
    .select({
      id: schema.logEntries.id,
      tenant_id: schema.logEntries.tenantId,
      user_id: schema.logEntries.userId,
      content_node_id: schema.logEntries.contentNodeId,
      title: schema.logEntries.title,
      description: schema.logEntries.description,
      metadata: schema.logEntries.metadata,
      sync_status: schema.logEntries.syncStatus,
      last_sync_error: schema.logEntries.lastSyncError,
      created_at: schema.logEntries.createdAt,
      updated_at: schema.logEntries.updatedAt,
      synced_at: schema.logEntries.syncedAt,
    })
    .from(schema.logEntries)
    .where(and(eq(schema.logEntries.id, id), eq(schema.logEntries.tenantId, tenantId)))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0] as unknown as LogEntryRow;
  const entry = mapLogEntryToDto(row);

  // Fetch attachments
  const attachments = await listAttachments(id);
  return {
    ...entry,
    attachments,
  };
}

/**
 * Create a new log entry
 */
export async function createLogEntry(data: {
  id?: string; // Client-generated UUID for idempotent sync
  tenantId: string;
  userId: string;
  nodeId: string;
  title: string;
  description?: string;
}): Promise<LogEntry> {
  const now = new Date();

  const rows = await dbSync
    .insert(schema.logEntries)
    .values({
      // Use client-provided ID if given, otherwise generate server-side
      id: data.id ?? uuidv7(),
      tenantId: data.tenantId,
      userId: data.userId,
      contentNodeId: data.nodeId,
      title: data.title,
      description: data.description ?? null,
      syncStatus: 'local',
      syncAttempts: 0,
      lastSyncError: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning({
      id: schema.logEntries.id,
      tenant_id: schema.logEntries.tenantId,
      user_id: schema.logEntries.userId,
      content_node_id: schema.logEntries.contentNodeId,
      title: schema.logEntries.title,
      description: schema.logEntries.description,
      metadata: schema.logEntries.metadata,
      sync_status: schema.logEntries.syncStatus,
      last_sync_error: schema.logEntries.lastSyncError,
      created_at: schema.logEntries.createdAt,
      updated_at: schema.logEntries.updatedAt,
      synced_at: schema.logEntries.syncedAt,
    });

  const row = rows[0] as unknown as LogEntryRow;
  return mapLogEntryToDto(row);
}

/**
 * Update a log entry
 */
export async function updateLogEntry(
  id: string,
  tenantId: string,
  data: {
    title?: string;
    description?: string;
    status?: SyncStatusT;
  },
): Promise<LogEntry | null> {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.status !== undefined) {
    updates.syncStatus = data.status;
    if (data.status === 'synced') {
      updates.syncedAt = new Date();
    }
  }

  const rows = await dbSync
    .update(schema.logEntries)
    .set(updates)
    .where(and(eq(schema.logEntries.id, id), eq(schema.logEntries.tenantId, tenantId)))
    .returning({
      id: schema.logEntries.id,
      tenant_id: schema.logEntries.tenantId,
      user_id: schema.logEntries.userId,
      content_node_id: schema.logEntries.contentNodeId,
      title: schema.logEntries.title,
      description: schema.logEntries.description,
      metadata: schema.logEntries.metadata,
      sync_status: schema.logEntries.syncStatus,
      last_sync_error: schema.logEntries.lastSyncError,
      created_at: schema.logEntries.createdAt,
      updated_at: schema.logEntries.updatedAt,
      synced_at: schema.logEntries.syncedAt,
    });

  if (rows.length === 0) return null;

  const row = rows[0] as unknown as LogEntryRow;
  return mapLogEntryToDto(row);
}

/**
 * Delete a log entry
 */
export async function deleteLogEntry(id: string, tenantId: string): Promise<boolean> {
  const result = await dbSync
    .delete(schema.logEntries)
    .where(and(eq(schema.logEntries.id, id), eq(schema.logEntries.tenantId, tenantId)))
    .returning({ id: schema.logEntries.id });

  return result.length > 0;
}

/* ========================================
   ATTACHMENTS - Manage files/media
   ======================================== */

/**
 * List attachments for a log entry
 */
export async function listAttachments(logEntryId: string): Promise<LogAttachment[]> {
  const rows = await dbSync
    .select()
    .from(schema.logAttachments)
    .where(eq(schema.logAttachments.logEntryId, logEntryId))
    .orderBy(desc(schema.logAttachments.createdAt));

  return rows.map((row) => mapAttachmentToDto(row as unknown as LogAttachmentRow));
}

/**
 * Create an attachment (called after file upload)
 */
export async function createAttachment(data: {
  logEntryId: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  attachmentType: 'image' | 'video' | 'document';
}): Promise<LogAttachment> {
  const rows = await dbSync.insert(schema.logAttachments).values(data).returning();

  const row = rows[0] as unknown as LogAttachmentRow;
  return mapAttachmentToDto(row);
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(id: string): Promise<boolean> {
  const result = await dbSync
    .delete(schema.logAttachments)
    .where(eq(schema.logAttachments.id, id))
    .returning({ id: schema.logAttachments.id });

  return result.length > 0;
}

/**
 * Gets a single attachment by ID with tenant verification - By joining through log_entries to confirm attachment belongs to the correct tenant
 */
export async function getAttachment(
  attachmentId: string,
  tenantId: string,
): Promise<LogAttachment | null> {
  const rows = await dbSync
    .select({
      id: schema.logAttachments.id,
      log_entry_id: schema.logAttachments.logEntryId,
      filename: schema.logAttachments.filename,
      mime_type: schema.logAttachments.mimeType,
      file_size: schema.logAttachments.fileSize,
      storage_path: schema.logAttachments.storagePath,
      attachment_type: schema.logAttachments.attachmentType,
      created_at: schema.logAttachments.createdAt,
    }).from(schema.logAttachments)
  // Join to log entries so we can check tenant ownership
    .innerJoin(
      schema.logEntries, eq(schema.logAttachments.logEntryId, schema.logEntries.id),
    )
    .where(
      and(
        eq(schema.logAttachments.id, attachmentId),
        eq(schema.logEntries.tenantId, tenantId),
      ),
    )
    .limit(1);

  if (rows.length === 0) return null;
  return mapAttachmentToDto(rows[0] as unknown as LogAttachmentRow);
}

/* ========================================
   SYNC STATUS - For offline-first support
   ======================================== */

/**
 * Get sync statistics for a user
 */
export async function getSyncStatus(tenantId: string, userId: string) {
  const result = await dbSync
    .select({
      pending_count: sql<number>`COUNT(*) FILTER (WHERE ${schema.logEntries.syncStatus} = 'pending')::int`,
      failed_count: sql<number>`COUNT(*) FILTER (WHERE ${schema.logEntries.syncStatus} = 'failed')::int`,
      last_sync_at: sql<string | null>`MAX(${schema.logEntries.syncedAt})`,
    })
    .from(schema.logEntries)
    .where(and(eq(schema.logEntries.tenantId, tenantId), eq(schema.logEntries.userId, userId)));

  return {
    pendingCount: result[0]?.pending_count ?? 0,
    failedCount: result[0]?.failed_count ?? 0,
    lastSyncAt: result[0]?.last_sync_at ?? null,
  };
}
