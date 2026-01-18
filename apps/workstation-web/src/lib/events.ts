// apps/workstation-web/src/lib/events.ts
/**
 * Typed CustomEvent definitions for inter-widget communication.
 * Provides type safety for window event listeners.
 */

import type {
  VideoTimeUpdateDetail,
  NodeSelectedDetail,
  SelectNodeByIdDetail,
  TimelineSeekDetail,
} from '../types/events';

// Re-export types for backward compatibility (import from types/ instead)
export type {
  VideoTimeUpdateDetail,
  VideoTimeUpdateEvent,
  NodeSelectedDetail,
  NodeSelectedEvent,
  SelectNodeByIdDetail,
  SelectNodeByIdEvent,
  TimelineSeekDetail,
  TimelineSeekEvent,
} from '../types/events';

// ============================================================================
// EVENT NAMES (for consistency)
// ============================================================================

export const EVENT_NAMES = {
  VIDEO_TIME_UPDATE: 'video:timeupdate',
  NODE_SELECTED: 'content:nodeSelected',
  SELECT_NODE_BY_ID: 'content:selectNodeById',
  TIMELINE_SEEK: 'timeline:seek',
} as const;

// ============================================================================
// TYPE-SAFE EVENT HELPERS
// ============================================================================

/**
 * Type-safe wrapper for adding event listeners
 */
export function addTypedEventListener<T extends CustomEvent>(
  eventName: string,
  handler: (event: T) => void,
): () => void {
  const wrappedHandler = (e: Event) => handler(e as T);
  window.addEventListener(eventName, wrappedHandler);
  return () => window.removeEventListener(eventName, wrappedHandler);
}

/**
 * Type-safe wrapper for dispatching events
 */
export function dispatchTypedEvent<T>(eventName: string, detail: T): void {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

// ============================================================================
// CONVENIENCE DISPATCHERS
// ============================================================================

export const dispatchVideoTimeUpdate = (detail: VideoTimeUpdateDetail) =>
  dispatchTypedEvent(EVENT_NAMES.VIDEO_TIME_UPDATE, detail);

export const dispatchNodeSelected = (detail: NodeSelectedDetail) =>
  dispatchTypedEvent(EVENT_NAMES.NODE_SELECTED, detail);

export const dispatchSelectNodeById = (detail: SelectNodeByIdDetail) =>
  dispatchTypedEvent(EVENT_NAMES.SELECT_NODE_BY_ID, detail);

export const dispatchTimelineSeek = (detail: TimelineSeekDetail) =>
  dispatchTypedEvent(EVENT_NAMES.TIMELINE_SEEK, detail);
