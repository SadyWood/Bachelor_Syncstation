// apps/api/src/routes/sync.log.ts
import {
  CreateLogEntryRequest,
  UpdateLogEntryRequest,
  LogEntryResponse,
  LogEntriesListResponse,
  SyncStatusResponse,
  ErrorResponse,
  SyncStatus,
} from '@hk26/schema';
import { z } from 'zod';
import * as syncLogRepo from '../repos/sync.log.repo.js';
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
          return reply.code(404).send(ErrorResponse.parse({ ok: false, error: 'Log entry not found' }));
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
      } catch (error) {
        app.log.error(error, 'Failed to create log entry');
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
          return reply.code(404).send(ErrorResponse.parse({ ok: false, error: 'Log entry not found' }));
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
          return reply.code(404).send(ErrorResponse.parse({ ok: false, error: 'Log entry not found' }));
        }

        return reply.code(204).send();
      } catch (error) {
        app.log.error(error, 'Failed to delete log entry');
        return reply.code(500).send(ErrorResponse.parse({ ok: false, error: 'Failed to delete log entry' }));
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
