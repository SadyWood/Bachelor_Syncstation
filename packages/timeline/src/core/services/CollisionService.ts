// packages/timeline/src/core/services/CollisionService.ts
import { debugWarn } from '../debug';
import type { TimelineItem } from '../models/TimelineItem';

/**
 * Maximum number of sub-tracks allowed per track.
 * This prevents infinite loops in collision detection and keeps the UI manageable.
 * 20 sub-tracks should be more than enough for any realistic use case.
 */
const MAX_SUB_TRACKS = 20;

/**
 * Check if two timeline items overlap in time.
 * @param item1 First timeline item
 * @param item2 Second timeline item
 * @returns True if items overlap, false otherwise
 */
export function itemsOverlap(item1: TimelineItem, item2: TimelineItem): boolean {
  try {
    // Validate inputs
    if (!item1 || !item2) return false;
    if (
      typeof item1.startMs !== 'number' ||
      typeof item1.endMs !== 'number' ||
      typeof item2.startMs !== 'number' ||
      typeof item2.endMs !== 'number'
    ) {
      debugWarn('collision', 'Invalid time values in itemsOverlap');
      return false;
    }
    return !(item1.endMs <= item2.startMs || item1.startMs >= item2.endMs);
  } catch (error) {
    debugWarn('collision', 'Error in itemsOverlap', error);
    return false;
  }
}

/**
 * Auto-assign sub-tracks to timeline items to avoid collisions.
 * Items on the same track that overlap in time will be placed on different sub-tracks.
 * @param items Array of timeline items
 * @returns Array of items with subTrackIndex assigned
 * @example
 * const items = [
 *   { id: '1', trackId: 'track1', startMs: 0, endMs: 1000 },
 *   { id: '2', trackId: 'track1', startMs: 500, endMs: 1500 }, // Overlaps with item 1
 * ];
 * const assigned = assignSubTracks(items);
 * // Result: item 1 on subTrackIndex 0, item 2 on subTrackIndex 1
 */
export function assignSubTracks(items: TimelineItem[]): TimelineItem[] {
  const result: TimelineItem[] = [];

  for (const item of items) {
    // Get all items on the same track that we've already placed
    const trackItems = result.filter((i) => i.trackId === item.trackId);

    // Find the lowest available sub-track
    let subTrackIndex = 0;
    while (true) {
      const hasCollision = trackItems.some(
        (other) => other.subTrackIndex === subTrackIndex && itemsOverlap(item, other),
      );

      if (!hasCollision) break;
      subTrackIndex++;

      // Safety limit to prevent infinite loops
      if (subTrackIndex > MAX_SUB_TRACKS) {
        debugWarn('collision', `Exceeded MAX_SUB_TRACKS (${MAX_SUB_TRACKS}), defaulting to 0`);
        subTrackIndex = 0;
        break;
      }
    }

    result.push({ ...item, subTrackIndex });
  }

  return result;
}

/**
 * Find the lowest available sub-track for an item on a given track.
 * @param item Item to place
 * @param trackId Track to place item on
 * @param allItems All timeline items
 * @returns Sub-track index (0-based)
 */
export function findAvailableSubTrack(
  item: TimelineItem,
  trackId: string,
  allItems: TimelineItem[],
): number {
  // Get all items on the same track
  const trackItems = allItems.filter((i) => i.trackId === trackId && i.id !== item.id);

  // Try sub-tracks starting from 0
  let subTrackIndex = 0;
  while (true) {
    // Check if this sub-track is free (no overlapping items)
    const hasCollision = trackItems.some(
      (other) => other.subTrackIndex === subTrackIndex && itemsOverlap(item, other),
    );

    if (!hasCollision) {
      return subTrackIndex; // Found a free sub-track!
    }

    subTrackIndex++;

    // Safety limit (prevent infinite loop)
    if (subTrackIndex > MAX_SUB_TRACKS) {
      debugWarn('collision', `Exceeded MAX_SUB_TRACKS (${MAX_SUB_TRACKS}), defaulting to 0`);
      return 0;
    }
  }
}

/**
 * Calculate the maximum number of sub-tracks needed for a track.
 * @param trackId Track ID
 * @param allItems All timeline items
 * @returns Number of sub-tracks (minimum 1)
 */
export function getMaxSubTracks(trackId: string, allItems: TimelineItem[]): number {
  try {
    if (!Array.isArray(allItems)) {
      debugWarn('collision', 'allItems is not an array in getMaxSubTracks');
      return 1;
    }

    const trackItems = allItems.filter((i) => i?.trackId === trackId);
    if (trackItems.length === 0) return 1;

    const maxSubTrack = Math.max(...trackItems.map((item) => item.subTrackIndex ?? 0));

    // Validate result
    if (!isFinite(maxSubTrack) || maxSubTrack < 0) {
      debugWarn('collision', 'Invalid maxSubTrack', maxSubTrack);
      return 1;
    }

    return maxSubTrack + 1; // +1 because index is 0-based
  } catch (error) {
    debugWarn('collision', 'Error in getMaxSubTracks', error);
    return 1; // Safe fallback
  }
}

/**
 * Re-assign all items on a track to optimal sub-tracks.
 * This compacts items back to lower lanes when space becomes available.
 * @param trackId Track ID to reassign
 * @param allItems All timeline items
 * @returns Updated items with optimized sub-track assignments
 */
export function reassignTrackSubTracks(trackId: string, allItems: TimelineItem[]): TimelineItem[] {
  // Get all items on this track, sorted by start time
  const trackItems = allItems
    .filter((i) => i.trackId === trackId)
    .sort((a, b) => a.startMs - b.startMs);

  // Reset all sub-track indices for this track
  const updatedItems = allItems.map((item) =>
    item.trackId === trackId ? { ...item, subTrackIndex: undefined } : item,
  );

  // Re-assign each item optimally
  const result = [...updatedItems];
  for (const trackItem of trackItems) {
    const itemIndex = result.findIndex((i) => i.id === trackItem.id);
    if (itemIndex === -1) continue;

    const newSubTrack = findAvailableSubTrack(trackItem, trackId, result);
    result[itemIndex] = { ...result[itemIndex], subTrackIndex: newSubTrack } as TimelineItem;
  }

  return result;
}
