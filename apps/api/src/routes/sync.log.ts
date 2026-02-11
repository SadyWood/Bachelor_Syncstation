// apps/api/src/routes/sync.log.ts
import {
  CreateLogEntryRequest,
  UpdateLogEntryRequest,
  LogEntryResponse,
  LogEntriesListResponse,
  SyncStatusResponse,
  SuccessResponse,
  ErrorResponse,
  SyncStatus,
  AttachmentUploadResponse,
} from '@hk26/schema';
import { z } from 'zod';
import * as syncLogRepo from '../repos/sync.log.repo.js';
import * as fileStorage from '../services/file-storage.service.js';
import { requireTenant } from '../utils/tenant.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

/* ========================================
   ROUTE PARAM SCHEMAS (internal only)
   ======================================== */

const LogEntryIdParamsSchema = z.object({
  logEntryId: z.string().uuid(),
});

const LogEntriesQuerySchema = z.object({
  nodeId: z.string().uuid().optional(),
  status: SyncStatus.optional(),
});

export const syncLogRoutes: FastifyPluginAsyncZod = async (app) => {
  /* ========================================
     LOG ENTRIES
     ======================================== */

  // GET /syncstation/log-entries?nodeId=xxx&status=pending - List log entries
  app.get(
    '/syncstation/log-entries',
    {
      schema: {
        querystring: LogEntriesQuerySchema,
      },
    },
    async (req: FastifyRequest<{ Querystring: z.infer<typeof LogEntriesQuerySchema> }>, reply: FastifyReply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send(ErrorResponse.parse({ ok: false, error: 'TENANT_HEADER_MISSING' }));
      }

      const { nodeId, status } = req.query;

      try {
        const items = await syncLogRepo.listLogEntries(tenantId, nodeId, status);
        return reply.send(LogEntriesListResponse.parse({ ok: true, items, total: items.length }));
      } catch (error) {
        app.log.error(error, 'Failed to list log entries');
        return reply.code(500).send(ErrorResponse.parse({ ok: false, error: 'Failed to list log entries' }));
      }
    },
  );

  // GET /syncstation/log-entries/:logEntryId - Get single log entry
  app.get(
    '/syncstation/log-entries/:logEntryId',
    {
      schema: {
        params: LogEntryIdParamsSchema,
      },
    },
    async (req: FastifyRequest<{ Params: z.infer<typeof LogEntryIdParamsSchema> }>, reply: FastifyReply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send(ErrorResponse.parse({ ok: false, error: 'TENANT_HEADER_MISSING' }));
      }

      const { logEntryId } = req.params;

      try {
        const entry = await syncLogRepo.getLogEntry(logEntryId, tenantId);
        if (!entry) {
          return reply.code(404).send(ErrorResponse.parse({
            ok: false,
            error: `Log entry '${logEntryId}' not found. Check that the ID is correct and belongs to your tenant.`,
          }));
        }

        return reply.send(LogEntryResponse.parse({ ok: true, entry }));
      } catch (error) {
        app.log.error(error, 'Failed to get log entry');
        return reply.code(500).send(ErrorResponse.parse({ ok: false, error: 'Failed to get log entry' }));
      }
    },
  );

  // POST /syncstation/log-entries - Create new log entry
  app.post(
    '/syncstation/log-entries',
    {
      schema: {
        body: CreateLogEntryRequest.shape.body,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send(ErrorResponse.parse({ ok: false, error: 'TENANT_HEADER_MISSING' }));
      }

      // Get user ID from JWT (authenticated user)
      try {
        const decoded = await req.jwtVerify<{ sub: string }>();
        const userId = decoded.sub;

        const body = CreateLogEntryRequest.shape.body.parse(req.body);

        const entry = await syncLogRepo.createLogEntry({
          tenantId,
          userId,
          nodeId: body.nodeId,
          title: body.title,
          description: body.description,
        });

        return reply.code(201).send(LogEntryResponse.parse({ ok: true, entry }));
      } catch (error: unknown) {
        app.log.error(error, 'Failed to create log entry');

        // Check for foreign key constraint error (invalid nodeId)
        if (error instanceof Error && error.message.includes('foreign key constraint')) {
          const body = CreateLogEntryRequest.shape.body.parse(req.body);
          return reply.code(400).send(ErrorResponse.parse({
            ok: false,
            error: `Content node '${body.nodeId}' not found. Make sure the node exists and belongs to your tenant.`,
          }));
        }

        return reply.code(500).send(ErrorResponse.parse({ ok: false, error: 'Failed to create log entry' }));
      }
    },
  );

  // PATCH /syncstation/log-entries/:logEntryId - Update log entry
  app.patch(
    '/syncstation/log-entries/:logEntryId',
    {
      schema: {
        params: LogEntryIdParamsSchema,
        body: UpdateLogEntryRequest.shape.body,
      },
    },
    async (
      req: FastifyRequest<{
        Params: z.infer<typeof LogEntryIdParamsSchema>;
        Body: z.infer<typeof UpdateLogEntryRequest>['body'];
      }>,
      reply: FastifyReply,
    ) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send(ErrorResponse.parse({ ok: false, error: 'TENANT_HEADER_MISSING' }));
      }

      const { logEntryId } = req.params;
      const body = UpdateLogEntryRequest.shape.body.parse(req.body);

      try {
        const entry = await syncLogRepo.updateLogEntry(logEntryId, tenantId, body);
        if (!entry) {
          return reply.code(404).send(ErrorResponse.parse({
            ok: false,
            error: `Log entry '${logEntryId}' not found. Check that the ID is correct and belongs to your tenant.`,
          }));
        }

        return reply.send(LogEntryResponse.parse({ ok: true, entry }));
      } catch (error) {
        app.log.error(error, 'Failed to update log entry');
        return reply.code(500).send(ErrorResponse.parse({ ok: false, error: 'Failed to update log entry' }));
      }
    },
  );

  // DELETE /syncstation/log-entries/:logEntryId - Delete log entry
  app.delete(
    '/syncstation/log-entries/:logEntryId',
    {
      schema: {
        params: LogEntryIdParamsSchema,
      },
    },
    async (req: FastifyRequest<{ Params: z.infer<typeof LogEntryIdParamsSchema> }>, reply: FastifyReply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send(ErrorResponse.parse({ ok: false, error: 'TENANT_HEADER_MISSING' }));
      }

      const { logEntryId } = req.params;

      try {
        const deleted = await syncLogRepo.deleteLogEntry(logEntryId, tenantId);
        if (!deleted) {
          return reply.code(404).send(ErrorResponse.parse({
            ok: false,
            error: `Log entry '${logEntryId}' not found. It may have already been deleted or doesn't belong to your tenant.`,
          }));
        }

        return reply.send(SuccessResponse.parse({ ok: true }));
      } catch (error) {
        app.log.error(error, 'Failed to delete log entry');
        return reply.code(500).send(ErrorResponse.parse({ ok: false, error: 'Failed to delete log entry' }));
      }
    },
  );

  /* ========================================
     ATTACHMENTS
     ======================================== */

  // POST /syncstation/log-entries/:logEntryId/attachments - Upload attachment
  app.post(
    'syncstation/log-entries/_logEntryID/attachments',
    {
      schema: {
        params: LogEntryIdParamsSchema,
      },
    },
    async (
      req: FastifyRequest<{ Params: z.infer<typeof LogEntryIdParamsSchema> }>,
      reply: FastifyReply,
    ) => {
    // 1. Verify tenant header
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send(
          ErrorResponse.parse({ ok: false, error: 'TENANT_HEADER_MISSING' }),
        );
      }

      const { logEntryId } = req.params;

      // 2. Verify long entry exists and belongs to this tenant - checked before file processing
      const logEntry = await syncLogRepo.getLogEntry(logEntryId, tenantId);
      if (!logEntry) {
        return reply.code(404).send(
          ErrorResponse.parse({
            ok: false,
            error: 'Log entry \'${logEntryId}\' not found.',
          }),
        );
      }

      // 3. Get the uploaded file from the multipart request
      // req.file() is provided by @fastify/multipart (registered in server.ts)
      const file = await req.file();
      if (!file) {
        return reply.code(404).send(ErrorResponse.parse({ ok: false, error: 'No file uploaded' }),
        );
      }

      try {
        // 4. Save file to disk using our storage service - file.file is the readable stream, we never load it all into memory
        const { storagePath, fileSize } = await fileStorage.saveFile(
          file.file,
          tenantId,
          file.filename,
        );

        // 5. Determine the attachment type from the MIME type
        const attachmentType = fileStorage.getAttachmentType(
          file.mimetype || 'application/octet-stream',
        );

        // 6. Create the attachment record in the database
        const attachment = await syncLogRepo.createAttachment({
          logEntryId,
          filename: file.filename,
          mimeType: file.mimetype || 'application/octet-stream',
          fileSize,
          storagePath,
          attachmentType,
        });

        // 7. Return the created attachment
        return reply.code(201).send(
          AttachmentUploadResponse.parse({ ok: true, attachment }),
        );
      } catch (error) {
        app.log.error(error, 'Failed to upload attachment');
        return reply.code(500).send(ErrorResponse.parse({ ok: false, error: 'Failed to upload attachment' }),
        );
      }
    },
  );

  // GET /syncstation/attachments/:attachmentId/download - Download attachment
  app.get(
    '/syncstation/attachments/:attachmentId/download',
    {
      schema: {
        params: z.object({ attachmentId: z.string().uuid() }),
      },
    },
    async (req: FastifyRequest<{ Params: { attachmentId: string } }>,
      reply: FastifyReply,
    ) => {
      // 1. Verify tenant header
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send(
          ErrorResponse.parse({ ok: false, error: 'TENANT_HEADER_MISSING' }),
        );
      }

      const { attachmentId } = req.params;

      // 2. Get attachment record with tenant verification - repo method joins through log-entries to check tenant ownership
      const attachment = await syncLogRepo.getAttachment(attachmentId, tenantId);
      if (!attachment) {
        return reply.code(404).send(
          ErrorResponse.parse({ ok: false, error: 'Attachment not found.' }),
        );
      }

      // 3. Check the file actually exists on disk before stream
      const exists = await fileStorage.fileExists(attachment.storagePath);
      if (!exists) {
        return reply.code(404).send(
          ErrorResponse.parse({ ok: false, error: 'File not found on filesystem.' }),
        );
      }

      // 4. Stream file back with correct headers
      const stream = fileStorage.getFileStream(attachment.storagePath);
      return reply
        .header('Content-Type', attachment.mimeType)
        .header(
          'Content-Disposition',
          `attachment; filename="${attachment.filename}"`,
        )
        .send(stream);
    },
  );

  // DELETE /syncstation/attachments/:attachmentId - Delete attachment
  app.delete(
    '/syncstation/attachments/:attachmentId',
    {
      schema: {
        params: z.object({ attachmentId: z.string().uuid() }),
      },
    },
    async (
      req: FastifyRequest<{ Params: { attachmentId: string } }>,
      reply: FastifyReply,
    ) => {
      // 1. Verify tenant header
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send(
          ErrorResponse.parse({ ok: false, error: 'TENANT_HEADER_MISSING' }),
        );
      }

      const { attachmentId } = req.params;

      // 2. Get attachment record with tenant verification
      const attachment = await syncLogRepo.getAttachment(attachmentId, tenantId);
      if (!attachment) {
        return reply.code(404).send(
          ErrorResponse.parse({ ok: false, error: 'Attachment not found.' }),
        );
      }

      try {
        // 3. Delete file from filesystem first - deleteFile is idempotent — if the file is already gone it succeeds
        await fileStorage.deleteFile(attachment.storagePath);

        // 4. Delete the database record
        await syncLogRepo.deleteAttachment(attachmentId);

        return reply.send(SuccessResponse.parse({ ok: true }));
      } catch (error) {
        app.log.error(error, 'Failed to delete attachment');
        return reply.code(500).send(
          ErrorResponse.parse({ ok: false, error: 'Failed to delete attachment.' }),
        );
      }
    },
  );

  /* ========================================
     SYNC STATUS
     ======================================== */

  // GET /syncstation/sync-status - Get sync queue status
  app.get('/syncstation/sync-status', async (req: FastifyRequest, reply: FastifyReply) => {
    const tenantId = requireTenant(req);
    if (!tenantId) {
      return reply.code(400).send(ErrorResponse.parse({ ok: false, error: 'TENANT_HEADER_MISSING' }));
    }

    try {
      const decoded = await req.jwtVerify<{ sub: string }>();
      const userId = decoded.sub;

      const status = await syncLogRepo.getSyncStatus(tenantId, userId);

      return reply.send(
        SyncStatusResponse.parse({
          ok: true,
          pendingCount: status.pendingCount,
          failedCount: status.failedCount,
          lastSyncAt: status.lastSyncAt,
        }),
      );
    } catch (error) {
      app.log.error(error, 'Failed to get sync status');
      return reply.code(500).send(ErrorResponse.parse({ ok: false, error: 'Failed to get sync status' }));
    }
  });
};
