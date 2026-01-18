// apps/api/src/repos/media.repo.ts
import {
  MediaAssetSchema,
  MediaVariantSchema,
  type MediaAsset,
  type MediaVariant,
  type MediaStatusT,
  type StorageProviderT,
  type MediaVariantTypeT,
  type MediaMetadata,
} from '@hk26/schema';
import { and, eq } from 'drizzle-orm';
import { dbWs, schema } from '../db.js';

/* ========================================
   HELPER: Map DB row to Schema
   ======================================== */

type MediaAssetRow = {
  media_asset_id: string;
  tenant_id: string;
  node_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_provider: StorageProviderT;
  storage_path: string;
  status: MediaStatusT;
  has_video: boolean | null;
  has_audio: boolean | null;
  duration_ms: number | null;
  width: number | null;
  height: number | null;
  frame_rate: number | null;
  video_codec: string | null;
  audio_codec: string | null;
  audio_channels: number | null;
  audio_sample_rate: number | null;
  format: string | null;
  color_space: string | null;
  dpi: number | null;
  orientation: number | null;
  exif_data: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

type MediaVariantRow = {
  variant_id: string;
  asset_id: string;
  variant_type: MediaVariantTypeT;
  mime_type: string;
  storage_path: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  bitrate: number | null;
  created_at: Date;
};

function mapAssetRowToDto(row: MediaAssetRow): MediaAsset {
  return MediaAssetSchema.parse({
    mediaAssetId: row.media_asset_id,
    tenantId: row.tenant_id,
    nodeId: row.node_id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storageProvider: row.storage_provider,
    storagePath: row.storage_path,
    status: row.status,
    hasVideo: row.has_video ?? undefined,
    hasAudio: row.has_audio ?? undefined,
    durationMs: row.duration_ms ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    frameRate: row.frame_rate ?? undefined,
    videoCodec: row.video_codec ?? undefined,
    audioCodec: row.audio_codec ?? undefined,
    audioChannels: row.audio_channels ?? undefined,
    audioSampleRate: row.audio_sample_rate ?? undefined,
    format: row.format ?? undefined,
    colorSpace: row.color_space ?? undefined,
    dpi: row.dpi ?? undefined,
    orientation: row.orientation ?? undefined,
    exifData: row.exif_data ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  });
}

function mapVariantRowToDto(row: MediaVariantRow): MediaVariant {
  return MediaVariantSchema.parse({
    variantId: row.variant_id,
    assetId: row.asset_id,
    variantType: row.variant_type,
    mimeType: row.mime_type,
    storagePath: row.storage_path,
    sizeBytes: row.size_bytes ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    bitrate: row.bitrate ?? undefined,
    createdAt: row.created_at.toISOString(),
  });
}

/* ========================================
   MEDIA ASSET CRUD
   ======================================== */

/**
 * Create a media asset for a node.
 * Note: unique constraint on node_id enforces one media per node.
 */
export async function createMediaAsset(input: {
  tenantId: string;
  nodeId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: StorageProviderT;
  storagePath: string;
  status?: MediaStatusT;
  hasVideo?: boolean;
  hasAudio?: boolean;
  durationMs?: number;
  width?: number;
  height?: number;
  frameRate?: number;
  videoCodec?: string;
  audioCodec?: string;
  audioChannels?: number;
  audioSampleRate?: number;
  format?: string;
  colorSpace?: string;
  dpi?: number;
  orientation?: number;
  exifData?: Record<string, unknown>;
}): Promise<MediaAsset> {
  const [row] = await dbWs
    .insert(schema.mediaAssets)
    .values({
      tenantId: input.tenantId,
      nodeId: input.nodeId,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageProvider: input.storageProvider,
      storagePath: input.storagePath,
      status: input.status ?? 'uploaded',
      hasVideo: input.hasVideo,
      hasAudio: input.hasAudio,
      durationMs: input.durationMs,
      width: input.width,
      height: input.height,
      frameRate: input.frameRate,
      videoCodec: input.videoCodec,
      audioCodec: input.audioCodec,
      audioChannels: input.audioChannels,
      audioSampleRate: input.audioSampleRate,
      format: input.format,
      colorSpace: input.colorSpace,
      dpi: input.dpi,
      orientation: input.orientation,
      exifData: input.exifData,
    })
    .returning({
      media_asset_id: schema.mediaAssets.mediaAssetId,
      tenant_id: schema.mediaAssets.tenantId,
      node_id: schema.mediaAssets.nodeId,
      filename: schema.mediaAssets.filename,
      mime_type: schema.mediaAssets.mimeType,
      size_bytes: schema.mediaAssets.sizeBytes,
      storage_provider: schema.mediaAssets.storageProvider,
      storage_path: schema.mediaAssets.storagePath,
      status: schema.mediaAssets.status,
      has_video: schema.mediaAssets.hasVideo,
      has_audio: schema.mediaAssets.hasAudio,
      duration_ms: schema.mediaAssets.durationMs,
      width: schema.mediaAssets.width,
      height: schema.mediaAssets.height,
      frame_rate: schema.mediaAssets.frameRate,
      video_codec: schema.mediaAssets.videoCodec,
      audio_codec: schema.mediaAssets.audioCodec,
      audio_channels: schema.mediaAssets.audioChannels,
      audio_sample_rate: schema.mediaAssets.audioSampleRate,
      format: schema.mediaAssets.format,
      color_space: schema.mediaAssets.colorSpace,
      dpi: schema.mediaAssets.dpi,
      orientation: schema.mediaAssets.orientation,
      exif_data: schema.mediaAssets.exifData,
      created_at: schema.mediaAssets.createdAt,
      updated_at: schema.mediaAssets.updatedAt,
    });

  return mapAssetRowToDto(row);
}

/**
 * Get media asset by ID.
 */
export async function getMediaAssetById(
  tenantId: string,
  mediaAssetId: string,
): Promise<MediaAsset | null> {
  const [row] = await dbWs
    .select({
      media_asset_id: schema.mediaAssets.mediaAssetId,
      tenant_id: schema.mediaAssets.tenantId,
      node_id: schema.mediaAssets.nodeId,
      filename: schema.mediaAssets.filename,
      mime_type: schema.mediaAssets.mimeType,
      size_bytes: schema.mediaAssets.sizeBytes,
      storage_provider: schema.mediaAssets.storageProvider,
      storage_path: schema.mediaAssets.storagePath,
      status: schema.mediaAssets.status,
      has_video: schema.mediaAssets.hasVideo,
      has_audio: schema.mediaAssets.hasAudio,
      duration_ms: schema.mediaAssets.durationMs,
      width: schema.mediaAssets.width,
      height: schema.mediaAssets.height,
      frame_rate: schema.mediaAssets.frameRate,
      video_codec: schema.mediaAssets.videoCodec,
      audio_codec: schema.mediaAssets.audioCodec,
      audio_channels: schema.mediaAssets.audioChannels,
      audio_sample_rate: schema.mediaAssets.audioSampleRate,
      format: schema.mediaAssets.format,
      color_space: schema.mediaAssets.colorSpace,
      dpi: schema.mediaAssets.dpi,
      orientation: schema.mediaAssets.orientation,
      exif_data: schema.mediaAssets.exifData,
      created_at: schema.mediaAssets.createdAt,
      updated_at: schema.mediaAssets.updatedAt,
    })
    .from(schema.mediaAssets)
    .where(
      and(
        eq(schema.mediaAssets.mediaAssetId, mediaAssetId),
        eq(schema.mediaAssets.tenantId, tenantId),
      ),
    );

  if (!row) return null;
  return mapAssetRowToDto(row);
}

/**
 * Get media asset by node ID.
 * Returns null if node has no media.
 */
export async function getMediaAssetByNodeId(
  tenantId: string,
  nodeId: string,
): Promise<MediaAsset | null> {
  const [row] = await dbWs
    .select({
      media_asset_id: schema.mediaAssets.mediaAssetId,
      tenant_id: schema.mediaAssets.tenantId,
      node_id: schema.mediaAssets.nodeId,
      filename: schema.mediaAssets.filename,
      mime_type: schema.mediaAssets.mimeType,
      size_bytes: schema.mediaAssets.sizeBytes,
      storage_provider: schema.mediaAssets.storageProvider,
      storage_path: schema.mediaAssets.storagePath,
      status: schema.mediaAssets.status,
      has_video: schema.mediaAssets.hasVideo,
      has_audio: schema.mediaAssets.hasAudio,
      duration_ms: schema.mediaAssets.durationMs,
      width: schema.mediaAssets.width,
      height: schema.mediaAssets.height,
      frame_rate: schema.mediaAssets.frameRate,
      video_codec: schema.mediaAssets.videoCodec,
      audio_codec: schema.mediaAssets.audioCodec,
      audio_channels: schema.mediaAssets.audioChannels,
      audio_sample_rate: schema.mediaAssets.audioSampleRate,
      format: schema.mediaAssets.format,
      color_space: schema.mediaAssets.colorSpace,
      dpi: schema.mediaAssets.dpi,
      orientation: schema.mediaAssets.orientation,
      exif_data: schema.mediaAssets.exifData,
      created_at: schema.mediaAssets.createdAt,
      updated_at: schema.mediaAssets.updatedAt,
    })
    .from(schema.mediaAssets)
    .where(
      and(
        eq(schema.mediaAssets.nodeId, nodeId),
        eq(schema.mediaAssets.tenantId, tenantId),
      ),
    );

  if (!row) return null;
  return mapAssetRowToDto(row);
}

/**
 * Update media asset status (e.g., uploaded → processing → ready).
 */
export async function updateMediaAssetStatus(
  tenantId: string,
  mediaAssetId: string,
  status: MediaStatusT,
): Promise<MediaAsset | null> {
  const [row] = await dbWs
    .update(schema.mediaAssets)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.mediaAssets.mediaAssetId, mediaAssetId),
        eq(schema.mediaAssets.tenantId, tenantId),
      ),
    )
    .returning({
      media_asset_id: schema.mediaAssets.mediaAssetId,
      tenant_id: schema.mediaAssets.tenantId,
      node_id: schema.mediaAssets.nodeId,
      filename: schema.mediaAssets.filename,
      mime_type: schema.mediaAssets.mimeType,
      size_bytes: schema.mediaAssets.sizeBytes,
      storage_provider: schema.mediaAssets.storageProvider,
      storage_path: schema.mediaAssets.storagePath,
      status: schema.mediaAssets.status,
      has_video: schema.mediaAssets.hasVideo,
      has_audio: schema.mediaAssets.hasAudio,
      duration_ms: schema.mediaAssets.durationMs,
      width: schema.mediaAssets.width,
      height: schema.mediaAssets.height,
      frame_rate: schema.mediaAssets.frameRate,
      video_codec: schema.mediaAssets.videoCodec,
      audio_codec: schema.mediaAssets.audioCodec,
      audio_channels: schema.mediaAssets.audioChannels,
      audio_sample_rate: schema.mediaAssets.audioSampleRate,
      format: schema.mediaAssets.format,
      color_space: schema.mediaAssets.colorSpace,
      dpi: schema.mediaAssets.dpi,
      orientation: schema.mediaAssets.orientation,
      exif_data: schema.mediaAssets.exifData,
      created_at: schema.mediaAssets.createdAt,
      updated_at: schema.mediaAssets.updatedAt,
    });

  if (!row) return null;
  return mapAssetRowToDto(row);
}

/**
 * Update media asset metadata (dimensions, duration, codecs, etc.).
 */
export async function updateMediaAssetMetadata(
  tenantId: string,
  mediaAssetId: string,
  metadata: MediaMetadata,
): Promise<MediaAsset | null> {
  const [row] = await dbWs
    .update(schema.mediaAssets)
    .set({
      ...metadata,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.mediaAssets.mediaAssetId, mediaAssetId),
        eq(schema.mediaAssets.tenantId, tenantId),
      ),
    )
    .returning({
      media_asset_id: schema.mediaAssets.mediaAssetId,
      tenant_id: schema.mediaAssets.tenantId,
      node_id: schema.mediaAssets.nodeId,
      filename: schema.mediaAssets.filename,
      mime_type: schema.mediaAssets.mimeType,
      size_bytes: schema.mediaAssets.sizeBytes,
      storage_provider: schema.mediaAssets.storageProvider,
      storage_path: schema.mediaAssets.storagePath,
      status: schema.mediaAssets.status,
      has_video: schema.mediaAssets.hasVideo,
      has_audio: schema.mediaAssets.hasAudio,
      duration_ms: schema.mediaAssets.durationMs,
      width: schema.mediaAssets.width,
      height: schema.mediaAssets.height,
      frame_rate: schema.mediaAssets.frameRate,
      video_codec: schema.mediaAssets.videoCodec,
      audio_codec: schema.mediaAssets.audioCodec,
      audio_channels: schema.mediaAssets.audioChannels,
      audio_sample_rate: schema.mediaAssets.audioSampleRate,
      format: schema.mediaAssets.format,
      color_space: schema.mediaAssets.colorSpace,
      dpi: schema.mediaAssets.dpi,
      orientation: schema.mediaAssets.orientation,
      exif_data: schema.mediaAssets.exifData,
      created_at: schema.mediaAssets.createdAt,
      updated_at: schema.mediaAssets.updatedAt,
    });

  if (!row) return null;
  return mapAssetRowToDto(row);
}

/**
 * Delete a media asset (cascade deletes variants via DB constraint).
 */
export async function deleteMediaAsset(
  tenantId: string,
  mediaAssetId: string,
): Promise<boolean> {
  const result = await dbWs
    .delete(schema.mediaAssets)
    .where(
      and(
        eq(schema.mediaAssets.mediaAssetId, mediaAssetId),
        eq(schema.mediaAssets.tenantId, tenantId),
      ),
    );

  return result.rowCount !== null && result.rowCount > 0;
}

/* ========================================
   MEDIA VARIANTS
   ======================================== */

/**
 * Create a media variant (thumbnail, HLS, etc.).
 */
export async function createMediaVariant(input: {
  assetId: string;
  variantType: MediaVariantTypeT;
  mimeType: string;
  storagePath: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  bitrate?: number;
}): Promise<MediaVariant> {
  const [row] = await dbWs
    .insert(schema.mediaVariants)
    .values({
      assetId: input.assetId,
      variantType: input.variantType,
      mimeType: input.mimeType,
      storagePath: input.storagePath,
      sizeBytes: input.sizeBytes,
      width: input.width,
      height: input.height,
      bitrate: input.bitrate,
    })
    .returning({
      variant_id: schema.mediaVariants.variantId,
      asset_id: schema.mediaVariants.assetId,
      variant_type: schema.mediaVariants.variantType,
      mime_type: schema.mediaVariants.mimeType,
      storage_path: schema.mediaVariants.storagePath,
      size_bytes: schema.mediaVariants.sizeBytes,
      width: schema.mediaVariants.width,
      height: schema.mediaVariants.height,
      bitrate: schema.mediaVariants.bitrate,
      created_at: schema.mediaVariants.createdAt,
    });

  return mapVariantRowToDto(row);
}

/**
 * List all variants for a media asset.
 */
export async function listMediaVariants(
  assetId: string,
): Promise<MediaVariant[]> {
  const rows = await dbWs
    .select({
      variant_id: schema.mediaVariants.variantId,
      asset_id: schema.mediaVariants.assetId,
      variant_type: schema.mediaVariants.variantType,
      mime_type: schema.mediaVariants.mimeType,
      storage_path: schema.mediaVariants.storagePath,
      size_bytes: schema.mediaVariants.sizeBytes,
      width: schema.mediaVariants.width,
      height: schema.mediaVariants.height,
      bitrate: schema.mediaVariants.bitrate,
      created_at: schema.mediaVariants.createdAt,
    })
    .from(schema.mediaVariants)
    .where(eq(schema.mediaVariants.assetId, assetId));

  return rows.map(mapVariantRowToDto);
}

/**
 * Delete a specific variant.
 */
export async function deleteMediaVariant(variantId: string): Promise<boolean> {
  const result = await dbWs
    .delete(schema.mediaVariants)
    .where(eq(schema.mediaVariants.variantId, variantId));

  return result.rowCount !== null && result.rowCount > 0;
}
