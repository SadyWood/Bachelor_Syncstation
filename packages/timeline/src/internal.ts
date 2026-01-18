// packages/timeline/src/internal.ts
/**
 * @hoolsy/timeline - INTERNAL API
 *
 * ⚠️ WARNING: This file exports internal implementation details.
 * These APIs are NOT guaranteed to be stable across minor versions.
 *
 * USE CASES:
 * - Unit testing Timeline internals
 * - Building custom timeline variants
 * - Advanced customization beyond public API
 *
 * RECOMMENDATION:
 * Prefer importing from './index' for production code.
 * Only use this file when absolutely necessary.
 */

// ============================================================================
// Re-export public API for convenience
// ============================================================================

export * from './index';

// ============================================================================
// INTERNAL COMPONENTS
// ============================================================================

// Layout components
export { TrackContent } from './components/layout/TrackContent';
export type { TrackContentProps } from './components/layout/TrackContent';

export { TrackLabel } from './components/layout/TrackLabel';
export type { TrackLabelProps } from './components/layout/TrackLabel';

export { RulerMarks } from './components/layout/RulerMarks';
export type { RulerMarksProps } from './components/layout/RulerMarks';

// Overlay components
export { Playhead } from './components/overlays/Playhead';
export type { PlayheadProps } from './components/overlays/Playhead';

export { SpliceIndicatorOverlay } from './components/overlays/SpliceIndicator';
export type { SpliceIndicatorOverlayProps } from './components/overlays/SpliceIndicator';

export { SelectionBoxOverlay } from './components/overlays/SelectionBoxOverlay';
export type { SelectionBoxOverlayProps } from './components/overlays/SelectionBoxOverlay';

// Interactive components
export { TimelineItem as TimelineItemComponent } from './components/interactive/TimelineItem';
export type { TimelineItemProps } from './components/interactive/TimelineItem';

export { TimelineMarkers } from './components/interactive/TimelineMarkers';
export type { TimelineMarkersProps } from './components/interactive/TimelineMarkers';

export { ContextMenu } from './components/interactive/ContextMenu';
export type { ContextMenuProps, ContextMenuItem } from './components/interactive/ContextMenu';

// ============================================================================
// INTERNAL HOOKS
// ============================================================================

// Interaction hooks
export { usePlayheadDrag } from './hooks/interactions/usePlayheadDrag';
export type {
  UsePlayheadDragOptions,
  UsePlayheadDragReturn,
} from './hooks/interactions/usePlayheadDrag';

export { useMarkerDrag } from './hooks/interactions/useMarkerDrag';
export type { UseMarkerDragOptions, UseMarkerDragReturn } from './hooks/interactions/useMarkerDrag';

export { useTrackDrag } from './hooks/interactions/useTrackDrag';
export type { UseTrackDragOptions, UseTrackDragReturn } from './hooks/interactions/useTrackDrag';

export { useItemDrag } from './hooks/interactions/useItemDrag';
export type {
  UseItemDragOptions,
  UseItemDragReturn,
  DragState,
} from './hooks/interactions/useItemDrag';

export { useItemInteractions } from './hooks/interactions/useItemInteractions';
export type {
  UseItemInteractionsOptions,
  UseItemInteractionsReturn,
} from './hooks/interactions/useItemInteractions';

export { useTrackInteractions } from './hooks/interactions/useTrackInteractions';
export type {
  UseTrackInteractionsOptions,
  UseTrackInteractionsReturn,
} from './hooks/interactions/useTrackInteractions';

export { useRulerClick } from './hooks/interactions/useRulerClick';
export type { UseRulerClickOptions, UseRulerClickReturn } from './hooks/interactions/useRulerClick';

// History hooks
export { useHistoryManager } from './hooks/history/useHistoryManager';
export type {
  UseHistoryManagerOptions,
  UseHistoryManagerReturn,
} from './hooks/history/useHistoryManager';

// Keyboard shortcuts
export { useKeyboardShortcuts } from './hooks/shortcuts/useKeyboardShortcuts';
export type {
  UseKeyboardShortcutsOptions,
  UseKeyboardShortcutsReturn,
} from './hooks/shortcuts/useKeyboardShortcuts';

// Marker hooks
export { useMarkerHandlers } from './hooks/markers/useMarkerHandlers';
export type {
  UseMarkerHandlersOptions,
  UseMarkerHandlersReturn,
} from './hooks/markers/useMarkerHandlers';

// Viewport hooks
export { useWheelZoomPan } from './hooks/viewport/useWheelZoomPan';
export type { UseWheelZoomPanOptions } from './hooks/viewport/useWheelZoomPan';

export { useMiddleClickPan } from './hooks/viewport/useMiddleClickPan';
export type {
  UseMiddleClickPanOptions,
  UseMiddleClickPanReturn,
  MiddleClickPanState,
} from './hooks/viewport/useMiddleClickPan';

export { useTimelineViewport } from './hooks/viewport/useTimelineViewport';
export type {
  UseTimelineViewportOptions,
  UseTimelineViewportReturn,
} from './hooks/viewport/useTimelineViewport';

// Tool hooks
export { useSelectionBox } from './hooks/tools/useSelectionBox';
export type { UseSelectionBoxOptions, SelectionBox } from './hooks/tools/useSelectionBox';

export { useSpliceTool } from './hooks/tools/useSpliceTool';
export type {
  UseSpliceToolOptions,
  SpliceDragState,
  SpliceIndicator,
} from './hooks/tools/useSpliceTool';

export { useDeleteMode } from './hooks/tools/useDeleteMode';
export type {
  UseDeleteModeOptions,
  UseDeleteModeReturn,
  DeleteModeState,
} from './hooks/tools/useDeleteMode';

// Context menu hooks
export { useContextMenus } from './hooks/contextmenu/useContextMenus';
export type {
  UseContextMenusOptions,
  UseContextMenusReturn,
  MarkerContextMenu,
  RulerContextMenu,
} from './hooks/contextmenu/useContextMenus';

// Snap hooks
export { useSnapBehavior } from './hooks/snap/useSnapBehavior';
export type { UseSnapBehaviorOptions, UseSnapBehaviorReturn } from './hooks/snap/useSnapBehavior';

// Layout hooks
export { useVerticalLayout } from './hooks/layout/useVerticalLayout';
export type {
  UseVerticalLayoutOptions,
  UseVerticalLayoutReturn,
} from './hooks/layout/useVerticalLayout';

// State hooks
export { useControlledSelection } from './hooks/state/useControlledSelection';
export type {
  UseControlledSelectionOptions,
  UseControlledSelectionReturn,
} from './hooks/state/useControlledSelection';

// Track hooks
export { useTrackReordering } from './hooks/tracks/useTrackReordering';
export type {
  UseTrackReorderingOptions,
  UseTrackReorderingReturn,
} from './hooks/tracks/useTrackReordering';

// ============================================================================
// INTERNAL SERVICES
// ============================================================================

export {
  itemsOverlap,
  assignSubTracks,
  findAvailableSubTrack,
  getMaxSubTracks,
  reassignTrackSubTracks,
} from './core/services';

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

export { debugLog, debugWarn, debugError, debugTime, isDebugEnabled } from './core/debug';
export type { DebugCategory } from './core/debug';
