// packages/timeline/src/core/index.ts

// Models
export type {
  TimelineItem,
  TimelineTrack,
  TimelineTrackGroup,
  Marker,
  ToolType,
  HistoryEntry,
} from './models';

export { getItemDuration, isValidItem } from './models';

// Services
export {
  itemsOverlap,
  assignSubTracks,
  findAvailableSubTrack,
  getMaxSubTracks,
  reassignTrackSubTracks,
} from './services';

// Utils
export { msToPx, pxToMs, clamp, formatTime, formatTimeWithFrame, snapToFrame } from './utils';

// Constants
export { TIMELINE_CONSTANTS } from './constants';

// Debug utilities
export { debugLog, debugWarn, debugError, debugTime, isDebugEnabled } from './debug';
export type { DebugCategory } from './debug';
