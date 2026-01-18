// packages/schema/src/workstation/media.ts
import { z } from 'zod';

export const MediaStatus = z.enum(['uploaded', 'processing', 'ready', 'failed']);
export type MediaStatusT = z.infer<typeof MediaStatus>;

export const StorageProvider = z.enum(['local', 'azure-blob']);
export type StorageProviderT = z.infer<typeof StorageProvider>;

export const MediaVariantType = z.enum(['thumbnail', 'poster', 'hls', 'dash']);
export type MediaVariantTypeT = z.infer<typeof MediaVariantType>;

// Media Asset (one per node)
export const MediaAssetSchema = z.object({
  mediaAssetId: z.string().uuid(),
  tenantId: z.string().uuid(),
  nodeId: z.string().uuid(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  storageProvider: StorageProvider,
  storagePath: z.string(),
  status: MediaStatus,

  // Media type flags
  hasVideo: z.boolean().nullable().optional(),
  hasAudio: z.boolean().nullable().optional(),

  // Common metadata (video/audio/image)
  durationMs: z.number().int().nullable().optional(), // milliseconds for frame precision
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),

  // Video-specific metadata
  frameRate: z.number().nullable().optional(), // frames per second (e.g., 29.97, 60)
  videoCodec: z.string().nullable().optional(),

  // Audio-specific metadata
  audioCodec: z.string().nullable().optional(),
  audioChannels: z.number().int().nullable().optional(),
  audioSampleRate: z.number().int().nullable().optional(), // Hz (e.g., 44100, 48000)

  // Image-specific metadata
  format: z.string().nullable().optional(), // e.g., 'jpeg', 'png', 'webp'
  colorSpace: z.string().nullable().optional(), // e.g., 'srgb', 'cmyk'
  dpi: z.number().int().nullable().optional(),
  orientation: z.number().int().nullable().optional(), // EXIF orientation (1-8)
  exifData: z.record(z.unknown()).nullable().optional(), // Full EXIF metadata

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

// Media Variant (processed versions)
export const MediaVariantSchema = z.object({
  variantId: z.string().uuid(),
  assetId: z.string().uuid(),
  variantType: MediaVariantType,
  mimeType: z.string(),
  storagePath: z.string(),
  sizeBytes: z.number().int().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  bitrate: z.number().int().nullable().optional(),
  createdAt: z.string().datetime().optional(),
});
export type MediaVariant = z.infer<typeof MediaVariantSchema>;

// --- API Requests/Responses ---

// Init upload
export const InitUploadRequestSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
export type InitUploadRequest = z.infer<typeof InitUploadRequestSchema>;

export const InitUploadResponseSchema = z.object({
  ok: z.literal(true),
  uploadId: z.string().uuid(),
  uploadUrl: z.string().url().nullable(), // For Azure direct upload (null for local)
});
export type InitUploadResponse = z.infer<typeof InitUploadResponseSchema>;

// Complete upload (metadata is now extracted server-side, so request body is empty)
export const CompleteUploadRequestSchema = z.object({});
export type CompleteUploadRequest = z.infer<typeof CompleteUploadRequestSchema>;

export const CompleteUploadResponseSchema = z.object({
  ok: z.literal(true),
  asset: MediaAssetSchema,
});
export type CompleteUploadResponse = z.infer<typeof CompleteUploadResponseSchema>;

// List media for node
export const MediaListResponseSchema = z.object({
  ok: z.literal(true),
  asset: MediaAssetSchema.nullable(),
  variants: z.array(MediaVariantSchema),
});
export type MediaListResponse = z.infer<typeof MediaListResponseSchema>;

// Stream media (no request body, just URL params)
export const MediaStreamResponseSchema = z.object({
  ok: z.literal(true),
  streamUrl: z.string().url(),
});
export type MediaStreamResponse = z.infer<typeof MediaStreamResponseSchema>;

// --- Media Metadata (for extraction/updates) ---

/**
 * Media metadata extracted from files (video, audio, images).
 * This is a subset of MediaAsset fields used for metadata extraction and updates.
 * Note: Unlike MediaAsset, these fields cannot be null (only undefined for missing metadata).
 */
export const MediaMetadataSchema = z.object({
  hasVideo: z.boolean().optional(),
  hasAudio: z.boolean().optional(),
  durationMs: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  frameRate: z.number().optional(),
  videoCodec: z.string().optional(),
  audioCodec: z.string().optional(),
  audioChannels: z.number().int().optional(),
  audioSampleRate: z.number().int().optional(),
  format: z.string().optional(),
  colorSpace: z.string().optional(),
  dpi: z.number().int().optional(),
  orientation: z.number().int().optional(),
  exifData: z.record(z.unknown()).optional(),
});

export type MediaMetadata = z.infer<typeof MediaMetadataSchema>;
