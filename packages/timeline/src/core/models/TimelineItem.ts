// packages/timeline/src/core/models/TimelineItem.ts

/**
 * Represents a single item on the timeline
 */
export interface TimelineItem {
  /** Unique identifier for the item */
  id: string;

  /** ID of the track this item belongs to */
  trackId: string;

  /** Sub-track index within the main track (for vertical stacking) */
  subTrackIndex?: number | undefined;

  /** Start time in milliseconds */
  startMs: number;

  /** End time in milliseconds */
  endMs: number;

  /** Optional display label */
  label?: string;

  /** Optional color override */
  color?: string;
}

/**
 * Calculate duration of an item
 */
export function getItemDuration(item: TimelineItem): number {
  return item.endMs - item.startMs;
}

/**
 * Check if item is valid
 */
export function isValidItem(item: TimelineItem): boolean {
  return (
    item.endMs > item.startMs && item.startMs >= 0 && item.id.length > 0 && item.trackId.length > 0
  );
}
