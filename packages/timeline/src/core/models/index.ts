// packages/timeline/src/core/models/index.ts

import type { TimelineItem as TimelineItemType } from './TimelineItem';

export type { TimelineItem } from './TimelineItem';
export { getItemDuration, isValidItem } from './TimelineItem';

export type { TimelineTrack, TimelineTrackGroup } from './TimelineTrack';

export type { Marker } from './Marker';

/**
 * Tool types for timeline interaction
 */
export type ToolType = 'select' | 'splice' | 'pan';

/**
 * History entry for undo/redo
 */
export interface HistoryEntry {
  items: TimelineItemType[];
  action: string;
  timestamp: number;
}
