// packages/timeline/src/index.ts
/**
 * @hoolsy/timeline - Production-ready React timeline component
 *
 * PUBLIC API - This is the stable interface for consuming applications.
 * Import from this file for production use.
 *
 * For testing or advanced customization, see ./internal.ts
 */

// ============================================================================
// PRIMARY COMPONENT
// ============================================================================

/**
 * Timeline - Main timeline component
 * @see {@link TimelineProps} for configuration options
 */
export { Timeline } from './Timeline';

/**
 * Timeline component props
 * @see {@link Timeline} for usage examples
 */
export type { TimelineProps } from './Timeline';

// ============================================================================
// CORE TYPES (Required for using Timeline)
// ============================================================================

/**
 * TimelineItem - Represents a clip/segment on the timeline
 * @property id - Unique identifier
 * @property trackId - Track this item belongs to
 * @property startMs - Start time in milliseconds
 * @property endMs - End time in milliseconds
 * @property label - Display label
 * @property color - Optional color override
 * @property subTrackIndex - Sub-track for collision avoidance
 */
export type { TimelineItem } from './core/models';

/**
 * TimelineTrack - Represents a track (lane) in the timeline
 * @property id - Unique identifier
 * @property label - Display label
 * @property color - Track color
 */
export type { TimelineTrack } from './core/models';

/**
 * TimelineTrackGroup - Groups multiple tracks together
 * @property id - Unique identifier
 * @property label - Display label
 * @property trackIds - Array of track IDs in this group
 * @property collapsed - Whether group is collapsed
 */
export type { TimelineTrackGroup } from './core/models';

/**
 * ToolType - Available editing tools
 * - 'select': Select and manipulate items
 * - 'pan': Pan the timeline view
 * - 'splice': Cut items at a point
 */
export type { ToolType } from './core/models';

/**
 * Marker - Time marker/indicator on the timeline
 * @property markerId - Unique identifier
 * @property timeMs - Time position in milliseconds
 * @property label - Display label
 * @property color - Marker color
 */
export type { Marker } from './core/models';

/**
 * HistoryEntry - Undo/redo history entry
 */
export type { HistoryEntry } from './core/models';

// ============================================================================
// COMPANION UI COMPONENTS (Optional helpers)
// ============================================================================

export { Toolbox } from './components/Toolbox';
export type { ToolboxProps } from './components/Toolbox';

export { MediaPlayer } from './components/MediaPlayer';
export type { MediaPlayerProps } from './components/MediaPlayer';

export { ThemeProvider, useTheme } from './components/ThemeProvider';
export type { Theme } from './components/ThemeProvider';

export { ThemeToggle } from './components/ThemeToggle';

export { ZoomPanScrollbar } from './ZoomPanScrollbar';

// ============================================================================
// UTILITIES (Commonly needed helpers)
// ============================================================================

export {
  msToPx,
  pxToMs,
  formatTime,
  formatTimeWithFrame,
  snapToFrame,
} from './core/utils';

// Collision detection and sub-track assignment
export { assignSubTracks, getMaxSubTracks } from './core/services';

// ============================================================================
// CONSTANTS
// ============================================================================

export { TIMELINE_CONSTANTS } from './core/constants';

// ============================================================================
// HOOKS (For custom timeline implementations)
// ============================================================================

// Video synchronization
export { useVideoSync } from './hooks/useVideoSync';
export type { UseVideoSyncOptions, UseVideoSyncReturn } from './hooks/useVideoSync';

// Note: Most internal hooks are NOT exported here.
// Use ./internal.ts if you need access to low-level hooks.
