// src/types/events.ts
/**
 * Typed CustomEvent definitions for inter-widget communication.
 * Provides type safety for window event listeners.
 */

// ============================================================================
// EVENT DETAIL TYPES
// ============================================================================

export interface VideoTimeUpdateDetail {
  currentTime: number;
  duration?: number;
}

export interface NodeSelectedDetail {
  nodeId: string | null;
  title: string | null;
}

export interface SelectNodeByIdDetail {
  nodeId: string;
}

export interface TimelineSeekDetail {
  time: number;
}

// ============================================================================
// TYPED CUSTOM EVENTS
// ============================================================================

export type VideoTimeUpdateEvent = CustomEvent<VideoTimeUpdateDetail>;
export type NodeSelectedEvent = CustomEvent<NodeSelectedDetail>;
export type SelectNodeByIdEvent = CustomEvent<SelectNodeByIdDetail>;
export type TimelineSeekEvent = CustomEvent<TimelineSeekDetail>;
