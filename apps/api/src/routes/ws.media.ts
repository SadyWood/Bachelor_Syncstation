// apps/api/src/routes/ws.media.ts
import * as fsSync from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pipeline } from 'node:stream/promises';
import {
  InitUploadRequestSchema,
  InitUploadResponseSchema,
  CompleteUploadRequestSchema,
  CompleteUploadResponseSchema,
  MediaListResponseSchema,
} from '@hk26/schema';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import { extractMediaMetadata } from '../lib/media-metadata.js';
import * as contentRepo from '../repos/content.repo.js';
import * as mediaRepo from '../repos/media.repo.js';
import { requireTenant } from '../utils/tenant.js';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

/* ========================================
   UPLOAD SESSION STORAGE
   ======================================== */

// In-memory storage for upload sessions
// In production, use Redis or similar
interface UploadSession {
  uploadId: string;
  tenantId: string;
  nodeId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath?: string; // Set after file is uploaded
  createdAt: Date;
}

const uploadSessions = new Map<string, UploadSession>();

// Clean up old sessions (> 1 hour)
setInterval(
  () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [uploadId, session] of uploadSessions.entries()) {
      if (session.createdAt.getTime() < oneHourAgo) {
        uploadSessions.delete(uploadId);
      }
    }
  },
  5 * 60 * 1000,
); // Run every 5 minutes

/* ========================================
   UPLOAD DIRECTORY
   ======================================== */

const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || './uploads';

async function ensureUploadDir(tenantId: string, nodeId: string): Promise<string> {
  const dir = path.join(UPLOAD_BASE_DIR, 'media', tenantId, nodeId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/* ========================================
   ROUTE PARAMS SCHEMAS
   ======================================== */

const NodeIdParamsSchema = z.object({
  nodeId: z.string().uuid(),
});

const MediaAssetIdParamsSchema = z.object({
  assetId: z.string().uuid(),
});

const UploadIdParamsSchema = z.object({
  uploadId: z.string().uuid(),
});

/* ========================================
   ROUTES
   ======================================== */

export const wsMediaRoutes: FastifyPluginAsyncZod = async (app) => {
  /* ========================================
     INIT UPLOAD
     POST /ws/nodes/:nodeId/media/init
     ======================================== */

  app.addHook('preHandler', app.authenticate);

  app.post(
    '/ws/nodes/:nodeId/media/init',
    {
      preHandler: app.needsPerm('content.media.upload'),
      schema: {
        params: NodeIdParamsSchema,
        body: InitUploadRequestSchema,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const { nodeId } = NodeIdParamsSchema.parse(req.params);
      const body = InitUploadRequestSchema.parse(req.body);

      try {
        // 1. Verify node exists and belongs to tenant
        const node = await contentRepo.getNodeById(tenantId, nodeId);
        if (!node) {
          return reply.code(404).send({ ok: false, code: 'NODE_NOT_FOUND' });
        }

        // 2. Verify node is content type (not group)
        if (node.nodeType === 'group') {
          return reply.code(400).send({
            ok: false,
            code: 'INVALID_NODE_TYPE',
            message: 'Cannot upload media to group nodes',
          });
        }

        // 3. Check if node already has media (should replace if exists)
        const existingMedia = await mediaRepo.getMediaAssetByNodeId(tenantId, nodeId);

        // For now, prevent duplicate uploads - user must delete first
        if (existingMedia) {
          return reply.code(409).send({
            ok: false,
            code: 'MEDIA_ALREADY_EXISTS',
            message: 'Node already has media. Delete existing media first.',
          });
        }

        // 4. Generate upload ID for tracking this upload session
        const uploadId = uuidv7();

        // Store upload session in memory
        uploadSessions.set(uploadId, {
          uploadId,
          tenantId,
          nodeId,
          filename: body.filename,
          mimeType: body.mimeType,
          sizeBytes: body.sizeBytes,
          createdAt: new Date(),
        });

        // TODO: For Azure, generate presigned upload URL here
        // For now (local storage), we'll just return uploadId

        return reply.code(200).send(
          InitUploadResponseSchema.parse({
            ok: true,
            uploadId,
            uploadUrl: null, // Will be populated for Azure
          }),
        );
      } catch (error) {
        app.log.error(error, 'Failed to init upload');
        return reply.code(500).send({
          ok: false,
          code: 'INTERNAL_ERROR',
          message: 'Failed to initialize upload',
        });
      }
    },
  );

  /* ========================================
     GET MEDIA FOR NODE
     GET /ws/nodes/:nodeId/media
     ======================================== */

  app.get(
    '/ws/nodes/:nodeId/media',
    {
      preHandler: app.needsPerm('content.media.view'),
      schema: {
        params: NodeIdParamsSchema,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      app.log.info(
        { tenantId, headers: req.headers },
        '[GET /ws/nodes/:nodeId/media] Request received',
      );

      if (!tenantId) {
        app.log.warn('[GET /ws/nodes/:nodeId/media] Tenant header missing');
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const { nodeId } = NodeIdParamsSchema.parse(req.params);
      app.log.info({ tenantId, nodeId }, '[GET /ws/nodes/:nodeId/media] Fetching media for node');

      try {
        // Get media asset for node
        const asset = await mediaRepo.getMediaAssetByNodeId(tenantId, nodeId);

        // If no media, return null asset with empty variants
        if (!asset) {
          app.log.info(
            { tenantId, nodeId },
            '[GET /ws/nodes/:nodeId/media] No media found for node',
          );
          return reply.send(
            MediaListResponseSchema.parse({
              ok: true,
              asset: null,
              variants: [],
            }),
          );
        }

        app.log.info(
          {
            tenantId,
            nodeId,
            assetId: asset.mediaAssetId,
            filename: asset.filename,
            metadata: {
              durationMs: asset.durationMs,
              width: asset.width,
              height: asset.height,
              frameRate: asset.frameRate,
            },
          },
          '[GET /ws/nodes/:nodeId/media] Media asset found',
        );

        // Get variants for this asset
        const variants = await mediaRepo.listMediaVariants(asset.mediaAssetId);
        app.log.info(
          { assetId: asset.mediaAssetId, variantsCount: variants.length },
          '[GET /ws/nodes/:nodeId/media] Variants fetched',
        );

        return reply.send(
          MediaListResponseSchema.parse({
            ok: true,
            asset,
            variants,
          }),
        );
      } catch (error) {
        app.log.error(
          { error, tenantId, nodeId },
          '[GET /ws/nodes/:nodeId/media] Failed to get media for node',
        );
        return reply.code(500).send({
          ok: false,
          code: 'INTERNAL_ERROR',
          message: 'Failed to get media',
        });
      }
    },
  );

  /* ========================================
     DELETE MEDIA
     DELETE /ws/media/:assetId
     ======================================== */

  app.delete(
    '/ws/media/:assetId',
    {
      preHandler: app.needsPerm('content.media.delete'),
      schema: {
        params: MediaAssetIdParamsSchema,
      },
    },
    async (req, reply) => {
      const tenantId = requireTenant(req);
      if (!tenantId) {
        return reply.code(400).send({ ok: false, code: 'TENANT_HEADER_MISSING' });
      }

      const { assetId } = MediaAssetIdParamsSchema.parse(req.params);

      try {
        // Verify asset exists and belongs to tenant
        const asset = await mediaRepo.getMediaAssetById(tenantId, assetId);
        if (!asset) {
          return reply.code(404).send({ ok: false, code: 'MEDIA_NOT_FOUND' });
        }

        // TODO: Delete actual file from storage
        // For now, just delete DB record (cascade deletes variants)
        const deleted = await mediaRepo.deleteMediaAsset(tenantId, assetId);

        if (!deleted) {
          return reply.code(404).send({ ok: false, code: 'MEDIA_NOT_FOUND' });
        }

        return reply.send({ ok: true });
      } catch (error) {
        app.log.error(error, 'Failed to delete media');
        return reply.code(500).send({
          ok: false,
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete media',
        });
      }
    },
  );

  /* ========================================
     UPLOAD FILE
     POST /ws/media/:uploadId/upload
     ======================================== */

  app.post(
    '/ws/media/:uploadId/upload',
    {
      preHandler: app.needsPerm('content.media.upload'),
      schema: {
        params: UploadIdParamsSchema,
      },
    },
    async (req, reply) => {
      const { uploadId } = UploadIdParamsSchema.parse(req.params);

      app.log.info({ uploadId, headers: req.headers }, 'Upload request received');

      try {
        // 1. Get upload session
        const session = uploadSessions.get(uploadId);
        if (!session) {
          app.log.warn({ uploadId }, 'Upload session not found');
          return reply.code(404).send({
            ok: false,
            code: 'UPLOAD_SESSION_NOT_FOUND',
            message: 'Upload session not found or expired',
          });
        }

        // 2. Verify tenant matches
        const tenantId = requireTenant(req);
        if (!tenantId || tenantId !== session.tenantId) {
          app.log.warn({ uploadId, tenantId, sessionTenant: session.tenantId }, 'Tenant mismatch');
          return reply.code(403).send({
            ok: false,
            code: 'TENANT_MISMATCH',
          });
        }

        // 3. Get uploaded file from multipart
        app.log.info({ uploadId }, 'Parsing multipart data...');
        const data = await req.file();
        if (!data) {
          app.log.warn({ uploadId }, 'No file in multipart request');
          return reply.code(400).send({
            ok: false,
            code: 'NO_FILE_PROVIDED',
            message: 'No file in request',
          });
        }

        app.log.info(
          { uploadId, filename: data.filename, mimetype: data.mimetype },
          'File received',
        );

        // 4. Ensure upload directory exists
        const uploadDir = await ensureUploadDir(session.tenantId, session.nodeId);

        // 5. Generate storage path
        const filename = `${uploadId}-${session.filename}`;
        const storagePath = path.join(uploadDir, filename);

        app.log.info({ uploadId, storagePath }, 'Saving file to disk...');

        // 6. Save file to disk
        await pipeline(data.file, fsSync.createWriteStream(storagePath));

        // 7. Update session with storage path
        session.storagePath = storagePath;
        uploadSessions.set(uploadId, session);

        app.log.info({ uploadId, storagePath }, 'File uploaded successfully');

        return reply.send({ ok: true });
      } catch (error) {
        app.log.error({ error, uploadId }, 'Failed to upload file');
        return reply.code(500).send({
          ok: false,
          code: 'UPLOAD_FAILED',
          message: 'Failed to save file',
        });
      }
    },
  );

  /* ========================================
     COMPLETE UPLOAD
     POST /ws/media/:uploadId/complete
     ======================================== */

  app.post(
    '/ws/media/:uploadId/complete',
    {
      preHandler: app.needsPerm('content.media.upload'),
      schema: {
        params: UploadIdParamsSchema,
        body: CompleteUploadRequestSchema,
      },
    },
    async (req, reply) => {
      const { uploadId } = UploadIdParamsSchema.parse(req.params);

      try {
        // 1. Get upload session
        const session = uploadSessions.get(uploadId);
        if (!session) {
          return reply.code(404).send({
            ok: false,
            code: 'UPLOAD_SESSION_NOT_FOUND',
            message: 'Upload session not found or expired',
          });
        }

        // 2. Verify tenant matches
        const tenantId = requireTenant(req);
        if (!tenantId || tenantId !== session.tenantId) {
          return reply.code(403).send({
            ok: false,
            code: 'TENANT_MISMATCH',
          });
        }

        // 3. Verify file was uploaded
        if (!session.storagePath) {
          return reply.code(400).send({
            ok: false,
            code: 'FILE_NOT_UPLOADED',
            message: 'File must be uploaded before completing',
          });
        }

        // 4. Extract metadata from uploaded file
        let metadata;
        try {
          metadata = await extractMediaMetadata(session.storagePath);
          app.log.info({ nodeId: session.nodeId, metadata }, 'Metadata extracted successfully');
        } catch (err) {
          // Log error but continue - metadata extraction is not critical
          const message = err instanceof Error ? err.message : String(err);
          app.log.warn({ nodeId: session.nodeId, error: message }, 'Failed to extract metadata');
        }

        // 5. Create media asset in database with extracted metadata
        const asset = await mediaRepo.createMediaAsset({
          tenantId: session.tenantId,
          nodeId: session.nodeId,
          filename: session.filename,
          mimeType: session.mimeType,
          sizeBytes: session.sizeBytes,
          storageProvider: 'local',
          storagePath: session.storagePath,
          status: 'ready',
          // Include extracted metadata
          ...metadata,
        });

        // 6. Clean up session
        uploadSessions.delete(uploadId);

        app.log.info({ assetId: asset.mediaAssetId, nodeId: session.nodeId }, 'Upload completed');

        return reply.code(201).send(
          CompleteUploadResponseSchema.parse({
            ok: true,
            asset,
          }),
        );
      } catch (error) {
        app.log.error(error, 'Failed to complete upload');
        return reply.code(500).send({
          ok: false,
          code: 'COMPLETE_FAILED',
          message: 'Failed to finalize upload',
        });
      }
    },
  );

  /* ========================================
     STREAMING ENDPOINT
     ======================================== */

  /**
   * Stream media file with Range header support (for video seeking)
   * GET /ws/media/:assetId/stream
   */
  app.get(
    '/ws/media/:assetId/stream',
    {
      preHandler: async (req, reply) => {
        // For video/audio streaming, we need to support token in query string
        // since HTML5 media elements cannot send Authorization headers
        const query = req.query as Record<string, string | undefined>;
        const queryToken = query?.token;
        const queryTenant = query?.tenant;
        if (queryToken && !req.headers.authorization) {
          // Temporarily set the Authorization header so jwtVerify can work
          req.headers.authorization = `Bearer ${queryToken}`;
        }
        if (queryTenant && !req.headers['x-ws-tenant']) {
          // Set the tenant header from query string
          req.headers['x-ws-tenant'] = queryTenant;
        }
        // Now check permission as normal
        return app.needsPerm('content.media.view')(req, reply);
      },
      schema: {
        params: z.object({
          assetId: z.string().uuid(),
        }),
        querystring: z.object({
          download: z.enum(['true', 'false']).optional(),
          filename: z.string().optional(),
          token: z.string().optional(),
          tenant: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      try {
        const { assetId } = req.params as { assetId: string };
        const { download, filename } = req.query as {
          download?: 'true' | 'false';
          filename?: string;
        };
        const tenantId = requireTenant(req);

        if (!tenantId) {
          return reply.code(400).send({
            ok: false,
            code: 'TENANT_REQUIRED',
            message: 'Tenant ID required',
          });
        }

        // 1. Get media asset from database
        const asset = await mediaRepo.getMediaAssetById(tenantId, assetId);
        if (!asset) {
          return reply.code(404).send({
            ok: false,
            code: 'ASSET_NOT_FOUND',
            message: 'Media asset not found',
          });
        }

        if (asset.storageProvider !== 'local') {
          return reply.code(400).send({
            ok: false,
            code: 'STREAMING_NOT_SUPPORTED',
            message: 'Streaming only supported for local storage',
          });
        }

        if (!asset.storagePath) {
          return reply.code(500).send({
            ok: false,
            code: 'STORAGE_PATH_MISSING',
            message: 'Storage path not found',
          });
        }

        // 2. Check if file exists
        const filePath = path.resolve(asset.storagePath);
        try {
          await fs.access(filePath);
        } catch {
          return reply.code(404).send({
            ok: false,
            code: 'FILE_NOT_FOUND',
            message: 'Media file not found on disk',
          });
        }

        // 3. Get file stats
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;

        // 4. Set headers
        const downloadFilename = filename || asset.filename;

        reply.header('Accept-Ranges', 'bytes');
        reply.header('Content-Type', asset.mimeType);

        if (download === 'true') {
          reply.header('Content-Disposition', `attachment; filename="${downloadFilename}"`);
        } else {
          reply.header('Content-Disposition', `inline; filename="${downloadFilename}"`);
        }

        // 5. Handle Range request (for video seeking)
        const { range } = req.headers;

        if (range) {
          // Parse range header (e.g., "bytes=0-1023")
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunkSize = end - start + 1;

          reply.code(206); // Partial Content
          reply.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
          reply.header('Content-Length', chunkSize.toString());

          // Stream the requested range
          const stream = fsSync.createReadStream(filePath, { start, end });
          return reply.send(stream);
        }
        // Stream entire file
        reply.header('Content-Length', fileSize.toString());
        const stream = fsSync.createReadStream(filePath);
        return reply.send(stream);
      } catch (error) {
        app.log.error(error, 'Failed to stream media');
        return reply.code(500).send({
          ok: false,
          code: 'STREAM_FAILED',
          message: 'Failed to stream media file',
        });
      }
    },
  );
};
