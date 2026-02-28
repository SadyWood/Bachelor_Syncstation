// apps/workstation-web/src/utils/timeline-helpers.ts
import { DEFAULT_TIMELINE_TRACKS } from '@hk26/schema';
import type { SubjectType } from '@hk26/schema';

/**
 * Convert milliseconds to HH:MM:SS format (no milliseconds)
 */
export function msToTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get human-readable track label from subject type code
 */
export function getTrackLabel(type: SubjectType | string): string {
  const track = DEFAULT_TIMELINE_TRACKS.find((t) => t.id === type);
  return track?.label || type;
}
