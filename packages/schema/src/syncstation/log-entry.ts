// packages/schema/src/syncstation/log-entry.ts
// Syncstation API contracts - Shared between mobile app and API
import { z } from 'zod';

/* ========================================
   ENUMS
   ======================================== */

export const SyncStatus = z.enum(['local', 'pending', 'synced', 'failed']);
export type SyncStatusT = z.infer<typeof SyncStatus>;

export const AttachmentType = z.enum(['image', 'video', 'document']);
export type AttachmentTypeT = z.infer<typeof AttachmentType>;

/* ========================================
   DTOs - Data Transfer Objects
   ======================================== */

/**
 * Log attachment DTO
 */
export const LogAttachmentSchema = z.object({
  id: z.string().uuid(),
  logEntryId: z.string().uuid(),
  filename: z.string(),
  mimeType: z.string(),
  fileSize: z.number().int().positive(),
  storagePath: z.string(),
  attachmentType: AttachmentType,
  createdAt: z.string().datetime(),
});
export type LogAttachment = z.infer<typeof LogAttachmentSchema>;

/**
 * Log entry DTO - full representation
 */
export const LogEntrySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  nodeId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: SyncStatus,
  syncAttempts: z.number().int().min(0),
  lastSyncError: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  syncedAt: z.string().datetime().nullable(),
  attachments: z.array(LogAttachmentSchema).optional(),
});
export type LogEntry = z.infer<typeof LogEntrySchema>;

/**
 * Log entry summary - lightweight for lists
 */
export const LogEntrySummarySchema = z.object({
  id: z.string().uuid(),
  nodeId: z.string().uuid(),
  title: z.string(),
  status: SyncStatus,
  attachmentCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
});
export type LogEntrySummary = z.infer<typeof LogEntrySummarySchema>;

/* ========================================
   API REQUESTS
   ======================================== */

/**
 * Create log entry request
 */
export const CreateLogEntryRequest = z.object({
  body: z.object({
    // Optional client-generated UUID for idempotent sync - to avoid duplicates if entry already exists, server returns existing entry
    id: z.string().uuid().optional(),
    nodeId: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
  }),
});
export type CreateLogEntryRequestBody = z.infer<typeof CreateLogEntryRequest>['body'];

/**
 * Update log entry request
 */
export const UpdateLogEntryRequest = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    status: SyncStatus.optional(),
  }),
});
export type UpdateLogEntryRequestBody = z.infer<typeof UpdateLogEntryRequest>['body'];

/**
 * Upload attachment request metadata
 */
export const UploadAttachmentRequest = z.object({
  body: z.object({
    filename: z.string().min(1),
    mimeType: z.string(),
    fileSize: z.number().int().positive(),
    attachmentType: AttachmentType,
  }),
});
export type UploadAttachmentRequestBody = z.infer<typeof UploadAttachmentRequest>['body'];

/* ========================================
   API RESPONSES
   ======================================== */

/**
 * Single log entry response
 */
export const LogEntryResponse = z.object({
  ok: z.literal(true),
  entry: LogEntrySchema,
});
export type LogEntryResponseData = z.infer<typeof LogEntryResponse>;

/**
 * List log entries response
 */
export const LogEntriesListResponse = z.object({
  ok: z.literal(true),
  items: z.array(LogEntrySummarySchema),
  total: z.number().int().min(0),
});
export type LogEntriesListResponseData = z.infer<typeof LogEntriesListResponse>;

/**
 * Attachment upload response
 */
export const AttachmentUploadResponse = z.object({
  ok: z.literal(true),
  attachment: LogAttachmentSchema,
});
export type AttachmentUploadResponseData = z.infer<typeof AttachmentUploadResponse>;

/**
 * Sync status response
 */
export const SyncStatusResponse = z.object({
  ok: z.literal(true),
  pendingCount: z.number().int().min(0),
  failedCount: z.number().int().min(0),
  lastSyncAt: z.string().datetime().nullable(),
});
export type SyncStatusResponseData = z.infer<typeof SyncStatusResponse>;

/**
 * Generic error response
 */
export const ErrorResponse = z.object({
  ok: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});
export type ErrorResponseData = z.infer<typeof ErrorResponse>;
