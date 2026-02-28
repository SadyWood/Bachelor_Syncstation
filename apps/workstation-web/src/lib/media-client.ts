// apps/workstation-web/src/lib/media-client.ts
import {
  InitUploadRequestSchema,
  InitUploadResponseSchema,
  CompleteUploadRequestSchema,
  CompleteUploadResponseSchema,
  MediaListResponseSchema,
  SuccessResponse,
  type MediaAsset,
  type MediaVariant,
} from '@hk26/schema';
import { createLogger } from '@hoolsy/logger';
import { httpTyped, getAccessToken, getCurrentTenantId } from './http';
import type { z } from 'zod';

const logger = createLogger('media-client');

// Infer TypeScript types from Zod schemas
type InitUploadRequest = z.infer<typeof InitUploadRequestSchema>;
type InitUploadResponse = z.infer<typeof InitUploadResponseSchema>;
type CompleteUploadRequest = z.infer<typeof CompleteUploadRequestSchema>;

// ------------------------------------------------------------------------------
// Media Upload Flow
// ------------------------------------------------------------------------------

/**
 * Initialize a media upload session.
 * @param nodeId UUID of the content node.
 * @param file File to upload.
 * @returns Upload session with uploadId (and uploadUrl for Azure).
 */
export async function initUpload(nodeId: string, file: File): Promise<InitUploadResponse> {
  const body: InitUploadRequest = {
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  };

  const response = await httpTyped(`/ws/nodes/${nodeId}/media/init`, {
    method: 'POST',
    body,
    schema: {
      req: InitUploadRequestSchema,
      res: InitUploadResponseSchema,
    },
  });

  return response;
}

/**
 * Upload file to server (multipart).
 *
 * @param uploadId Upload session ID from initUpload.
 * @param file File to upload.
 * @param onProgress Optional progress callback (0-100).
 * @returns Promise that resolves when upload completes.
 */
export async function uploadFile(
  uploadId: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    // Progress tracking
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(Math.round(percentComplete));
        }
      });
    }

    // Success
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        // Parse error response if available
        let errorMsg = `Upload failed: ${xhr.statusText}`;
        try {
          const errorBody = JSON.parse(xhr.responseText);
          if (errorBody.message) {
            errorMsg = errorBody.message;
          } else if (errorBody.code) {
            errorMsg = `Upload failed: ${errorBody.code}`;
          }
        } catch {
          // Use default error message
        }
        reject(new Error(errorMsg));
      }
    });

    // Error
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: Network error'));
    });

    // Abort
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Send request
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333';
    const url = `${baseUrl}/ws/media/${uploadId}/upload`;

    xhr.open('POST', url);

    // Get auth token from in-memory storage
    const token = getAccessToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Get tenant ID from in-memory storage
    const tenantId = getCurrentTenantId();
    if (tenantId) {
      xhr.setRequestHeader('X-WS-Tenant', tenantId);
    }

    xhr.send(formData);
  });
}

/**
 * Mark upload as complete and finalize media asset.
 *
 * @param uploadId Upload session ID.
 * @param metadata Optional metadata (dimensions, duration).
 * @returns Created media asset.
 */
export async function completeUpload(
  uploadId: string,
  metadata?: {
    durationSeconds?: number;
    width?: number;
    height?: number;
  },
): Promise<MediaAsset> {
  const body: CompleteUploadRequest = metadata || {};

  const response = await httpTyped(`/ws/media/${uploadId}/complete`, {
    method: 'POST',
    body,
    schema: {
      req: CompleteUploadRequestSchema,
      res: CompleteUploadResponseSchema,
    },
  });

  return response.asset;
}

// ------------------------------------------------------------------------------
// Media Retrieval
// ------------------------------------------------------------------------------

/**
 * Get media for a content node.
 * @param nodeId UUID of the content node.
 * @returns Media asset and variants (or null if no media).
 */
export async function getMediaForNode(
  nodeId: string,
): Promise<{ asset: MediaAsset | null; variants: MediaVariant[] }> {
  logger.debug(`getMediaForNode called with nodeId: ${nodeId}`);

  try {
    const response = await httpTyped(`/ws/nodes/${nodeId}/media`, {
      method: 'GET',
      schema: {
        res: MediaListResponseSchema,
      },
    });

    logger.debug('getMediaForNode response', {
      hasAsset: !!response.asset,
      assetId: response.asset?.mediaAssetId,
      filename: response.asset?.filename,
      mimeType: response.asset?.mimeType,
      metadata: response.asset
        ? {
          durationMs: response.asset.durationMs,
          width: response.asset.width,
          height: response.asset.height,
          frameRate: response.asset.frameRate,
        }
        : null,
      variantsCount: response.variants.length,
    });

    return {
      asset: response.asset,
      variants: response.variants,
    };
  } catch (error) {
    logger.error('getMediaForNode failed', error);
    throw error;
  }
}

/**
 * Delete a media asset.
 * @param assetId UUID of the media asset.
 */
export async function deleteMedia(assetId: string): Promise<void> {
  await httpTyped(`/ws/media/${assetId}`, {
    method: 'DELETE',
    schema: {
      res: SuccessResponse,
    },
  });
}

// ------------------------------------------------------------------------------
// Media Streaming
// ------------------------------------------------------------------------------

/**
 * Get streaming URL for a media asset.
 * @param assetId UUID of the media asset.
 * @returns Absolute URL for streaming.
 */
export function getStreamUrl(assetId: string): string {
  // Get base URL from current location
  const base = window.location.origin;

  // TODO: When streaming endpoint is implemented, use:
  // return `${base}/api/ws/media/${assetId}/stream`;

  // For now, return placeholder
  return `${base}/api/ws/media/${assetId}/stream`;
}

/**
 * Get download URL for a media asset.
 * @param assetId UUID of the media asset.
 * @param filename Optional filename for download.
 * @returns Absolute URL for download.
 */
export function getDownloadUrl(assetId: string, filename?: string): string {
  const base = window.location.origin;
  const url = `${base}/api/ws/media/${assetId}/stream`;

  if (filename) {
    return `${url}?download=true&filename=${encodeURIComponent(filename)}`;
  }

  return `${url}?download=true`;
}

// ------------------------------------------------------------------------------
// Compat Aliases (PascalCase) for consistency
// ------------------------------------------------------------------------------

export const InitUpload = initUpload;
export const UploadFile = uploadFile;
export const CompleteUpload = completeUpload;
export const GetMediaForNode = getMediaForNode;
export const DeleteMedia = deleteMedia;
export const GetStreamUrl = getStreamUrl;
export const GetDownloadUrl = getDownloadUrl;
