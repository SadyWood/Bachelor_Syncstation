import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { env } from '../config/env.js';
import type { AttachmentTypeT } from '@hk26/schema';
import type { Readable } from 'node:stream';

/**
Responsible for saving, retrieving and deleting files from filesystem
The service abstracts file storage so routes don't care about where a file lives just that they can be saved and retrieved
*/


// Save an uploaded file to the organized folder structure - Uses streams so large files never load entirely into memory
export async function saveFile(
  fileStream: Readable,
  tenantId: string,
  originalFilename: string,
): Promise<{ storagePath: string; fileSize: number }> {
  // Extracts the file extension from the original filename
  const ext = path.extname(originalFilename).toLowerCase() || '.bin';

  // Build the date-based folder path to prevent any single directory from accumulating thousands of files
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Full directory
  const dir = path.join(env?.UPLOAD_DIR, tenantId, year, month);

  // Create directory tree if it dost exist yet and its parent folders
  await fsp.mkdir(dir, { recursive: true });

  // Generate a unique filename using UUID to prevent collision
  const uniqueName = `${randomUUID()}${ext}`;
  const fullPath = path.join(dir, uniqueName);

  // Storage path we save to the database is relative to UPLOAD_DIR making it portable - base directory change won't affect old paths
  const storagePath = path.join(tenantId, year, month, uniqueName);

  // Stream file to disk - Pipe the incoming stream directly to a write stream - This allows large files to work properly
  const fileSize = await new Promise<number>((resolve, reject) => {
    const writeStream = fs.createWriteStream(fullPath);
    let bytes = 0;

    // Count bytes as they flow through so we know the actual file size
    fileStream.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
    });

    // WHen stream finishes resolve with the total byte count
    fileStream.on('end', () => {
      writeStream.end(() => resolve(bytes));
    });

    // If either stream errors, clean up and reject
    fileStream.on('error', (err) => {
      writeStream.destroy();
      reject(err);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });

    // Pipe the read stream into the write stream
    fileStream.pipe(writeStream);
  });

  return { storagePath, fileSize };
}

// Get a readable stream for downloading a file - The route handler pipes this stream directly to the HTTP response

export function getFileStream(storagePath: string): fs.ReadStream {
  const fullPath = path.join(env?.UPLOAD_DIR, storagePath);
  return fs.createReadStream(fullPath);
}

// Delete file from filesystem - Does not THROW if file is missing making it safe for retry. Second call succeeds silently
export async function deleteFile(storagePath: string): Promise<void> {
  const fullPath = path.join(env?.UPLOAD_DIR, storagePath);
  try {
    await fsp.unlink(fullPath);
  } catch (err: unknown) {
    // ENOENT means "file not found"
    const code = err instanceof Error && 'code' in err ? (err as { code: string }).code : '';
    if (code === 'ENOENT') return;
    // Any other error should still throw
    throw err;
  }
}

// Check if a file exists on filesystem - used by download endpoint for proper return of 404
export async function fileExists(storagePath: string): Promise<boolean> {
  const fullPath = path.join(env?.UPLOAD_DIR, storagePath);
  try {
    await fsp.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

// Gets attachment type from a MIME type string and maps to the attachment_type enum in database
export function getAttachmentType(mimeType: string): AttachmentTypeT {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}
