// packages/timeline/src/core/models/TimelineTrack.ts

/**
 * Represents a track on the timeline
 */
export interface TimelineTrack {
  /** Unique identifier for the track */
  id: string;

  /** Display label for the track */
  label: string;

  /** Optional parent group ID */
  groupId?: string;

  /** Optional color override */
  color?: string;
}

/**
 * Represents a group of tracks
 */
export interface TimelineTrackGroup {
  /** Unique identifier for the group */
  id: string;

  /** Display label for the group */
  label: string;

  /** Optional color override */
  color?: string;

  /** Whether the group is collapsed */
  collapsed?: boolean;
}
