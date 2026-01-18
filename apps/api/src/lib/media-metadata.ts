// apps/api/src/lib/media-metadata.ts
import ffprobeStatic from 'ffprobe-static';
import { fileTypeFromFile } from 'file-type';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import type { MediaMetadata } from '@workstation/schema';

// Configure ffmpeg to use static ffprobe binary
ffmpeg.setFfprobePath(ffprobeStatic.path);

/* ========================================
   HELPER FUNCTIONS
   ======================================== */

/**
 * Parse frame rate string from ffprobe (e.g., "30000/1001" → 29.97)
 */
function parseFrameRate(rFrameRate: string): number | undefined {
  if (!rFrameRate) return undefined;

  const parts = rFrameRate.split('/');
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const denom = parseFloat(parts[1]);
    if (denom === 0) return undefined;
    return num / denom;
  }

  const parsed = parseFloat(rFrameRate);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Extract EXIF data from Sharp metadata
 */
function extractExifData(sharpMetadata: sharp.Metadata): Record<string, unknown> | undefined {
  if (!sharpMetadata.exif) return undefined;

  try {
    // Sharp stores EXIF as a Buffer, we can return basic metadata
    const exif: Record<string, unknown> = {};

    // Include key metadata that's already parsed by Sharp
    if (sharpMetadata.orientation) exif.orientation = sharpMetadata.orientation;
    if (sharpMetadata.density) exif.density = sharpMetadata.density;
    if (sharpMetadata.chromaSubsampling) exif.chromaSubsampling = sharpMetadata.chromaSubsampling;
    if (sharpMetadata.isProgressive !== undefined) exif.isProgressive = sharpMetadata.isProgressive;
    if (sharpMetadata.pages) exif.pages = sharpMetadata.pages;
    if (sharpMetadata.pageHeight) exif.pageHeight = sharpMetadata.pageHeight;
    if (sharpMetadata.pagePrimary) exif.pagePrimary = sharpMetadata.pagePrimary;
    if (sharpMetadata.hasProfile) exif.hasProfile = sharpMetadata.hasProfile;
    if (sharpMetadata.hasAlpha) exif.hasAlpha = sharpMetadata.hasAlpha;

    return Object.keys(exif).length > 0 ? exif : undefined;
  } catch {
    return undefined;
  }
}

/* ========================================
   METADATA EXTRACTION
   ======================================== */

/**
 * Extract metadata from video or audio file using ffprobe
 */
async function extractVideoAudioMetadata(filePath: string): Promise<MediaMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`ffprobe failed: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

      const hasVideo = videoStream !== undefined;
      const hasAudio = audioStream !== undefined;

      // Duration in milliseconds (metadata.format.duration is in seconds)
      const durationMs = metadata.format.duration
        ? Math.floor(metadata.format.duration * 1000)
        : undefined;

      // Video metadata
      const width = videoStream?.width;
      const height = videoStream?.height;
      const frameRate = videoStream?.r_frame_rate
        ? parseFrameRate(videoStream.r_frame_rate)
        : undefined;
      const videoCodec = videoStream?.codec_name;

      // Audio metadata
      const audioCodec = audioStream?.codec_name;
      const audioChannels = audioStream?.channels;
      const audioSampleRate = audioStream?.sample_rate
        ? parseInt(String(audioStream.sample_rate), 10)
        : undefined;

      resolve({
        hasVideo,
        hasAudio,
        durationMs,
        width,
        height,
        frameRate,
        videoCodec,
        audioCodec,
        audioChannels,
        audioSampleRate,
      });
    });
  });
}

/**
 * Extract metadata from image file using Sharp
 */
async function extractImageMetadata(filePath: string): Promise<MediaMetadata> {
  const image = sharp(filePath);
  const metadata = await image.metadata();

  return {
    hasVideo: false,
    hasAudio: false,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    colorSpace: metadata.space,
    dpi: metadata.density,
    orientation: metadata.orientation,
    exifData: extractExifData(metadata),
  };
}

/* ========================================
   PUBLIC API
   ======================================== */

/**
 * Extract metadata from any media file (video, audio, or image).
 * Automatically detects file type and uses appropriate extraction method.
 *
 * @param filePath Absolute path to the media file
 * @returns Promise with extracted metadata
 * @throws Error if file type cannot be detected or extraction fails
 */
export async function extractMediaMetadata(filePath: string): Promise<MediaMetadata> {
  // Detect actual file type from file content (not extension)
  const fileType = await fileTypeFromFile(filePath);

  if (!fileType) {
    throw new Error('Could not detect file type');
  }

  const mediaType = fileType.mime.split('/')[0]; // 'video', 'audio', 'image'

  // Extract based on detected type
  if (mediaType === 'image') {
    return extractImageMetadata(filePath);
  }

  if (mediaType === 'video' || mediaType === 'audio') {
    return extractVideoAudioMetadata(filePath);
  }

  throw new Error(`Unsupported media type: ${mediaType}`);
}
