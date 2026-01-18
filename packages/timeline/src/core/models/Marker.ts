// packages/timeline/src/core/models/Marker.ts

/**
 * Represents a marker on the timeline
 */
export interface Marker {
  /** Unique identifier for the marker */
  markerId: string;

  /** Time position in milliseconds */
  timeMs: number;

  /** Optional display label */
  label?: string;

  /** Optional comment/description */
  comment?: string;

  /** Optional color override */
  color?: string;
}
