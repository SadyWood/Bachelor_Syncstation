/**
 * Generate a UUIDv7 (time-ordered UUID)
 *
 * UUIDv7 features:
 * - Time-ordered: IDs are sortable by creation time
 * - Better database performance: Sequential IDs reduce index fragmentation
 * - Compatible with standard UUID format
 *
 * Based on IETF draft: https://datatracker.ietf.org/doc/html/draft-peabody-dispatch-new-uuid-format
 */
export function uuidv7(): string {
  // Get current timestamp in milliseconds
  const timestamp = BigInt(Date.now());

  // Generate random bytes for the rest of the UUID
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);

  // Build the UUID
  const timestampHex = timestamp.toString(16).padStart(12, '0');

  // Set version (7) and variant (2) bits
  const rand1 = randomBytes[0];
  const rand2 = randomBytes[1];
  const rand3 = randomBytes[2];
  const rand4 = randomBytes[3];
  const rand5 = randomBytes[4];
  const rand6 = (randomBytes[5] & 0x0f) | 0x70; // Version 7
  const rand7 = randomBytes[6];
  const rand8 = (randomBytes[7] & 0x3f) | 0x80; // Variant 2
  const rand9 = randomBytes[8];
  const rand10 = randomBytes[9];

  return [
    timestampHex.slice(0, 8),
    timestampHex.slice(8, 12),
    rand6.toString(16).padStart(2, '0') + rand7.toString(16).padStart(2, '0'),
    rand8.toString(16).padStart(2, '0') + rand9.toString(16).padStart(2, '0'),
    rand1.toString(16).padStart(2, '0') +
    rand2.toString(16).padStart(2, '0') +
    rand3.toString(16).padStart(2, '0') +
    rand4.toString(16).padStart(2, '0') +
    rand5.toString(16).padStart(2, '0') +
    rand10.toString(16).padStart(2, '0'),
  ].join('-');
}

/**
 * Extract timestamp from a UUIDv7
 */
export function extractTimestamp(uuid: string): Date {
  const timestampHex = uuid.replace(/-/g, '').slice(0, 12);
  const timestamp = parseInt(timestampHex, 16);
  return new Date(timestamp);
}

/**
 * Check if a UUID is version 7
 */
export function isUUIDv7(uuid: string): boolean {
  const versionByte = uuid.replace(/-/g, '')[12];
  return versionByte === '7';
}
