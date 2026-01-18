// packages/timeline/src/Timeline.tsx
import React, { useRef, useState, useEffect } from 'react';
import { ContextMenu } from './components/interactive/ContextMenu';
import { TimelineMarkers } from './components/interactive/TimelineMarkers';
import { RulerMarks } from './components/layout/RulerMarks';
import { TrackContent } from './components/layout/TrackContent';
import { TrackLabel } from './components/layout/TrackLabel';
import { Playhead } from './components/overlays/Playhead';
import { SelectionBoxOverlay } from './components/overlays/SelectionBoxOverlay';
import { SpliceIndicatorOverlay } from './components/overlays/SpliceIndicator';
import { TIMELINE_CONSTANTS } from './core/constants';
import { debugLog, debugWarn, debugTable } from './core/debug';
import { getMaxSubTracks } from './core/services';
import { useContextMenus } from './hooks/contextmenu/useContextMenus';
import { useHistoryManager } from './hooks/history/useHistoryManager';
import { useItemDrag } from './hooks/interactions/useItemDrag';
import { useItemInteractions } from './hooks/interactions/useItemInteractions';
import { useMarkerDrag } from './hooks/interactions/useMarkerDrag';
import { usePlayheadDrag } from './hooks/interactions/usePlayheadDrag';
import { useRulerClick } from './hooks/interactions/useRulerClick';
import { useTrackDrag } from './hooks/interactions/useTrackDrag';
import { useTrackInteractions } from './hooks/interactions/useTrackInteractions';
import { useVerticalLayout } from './hooks/layout/useVerticalLayout';
import { useMarkerHandlers } from './hooks/markers/useMarkerHandlers';
import { useKeyboardShortcuts } from './hooks/shortcuts/useKeyboardShortcuts';
import { useSnapBehavior } from './hooks/snap/useSnapBehavior';
import { useControlledSelection } from './hooks/state/useControlledSelection';
import { useDeleteMode } from './hooks/tools/useDeleteMode';
import { useSelectionBox } from './hooks/tools/useSelectionBox';
import { useSpliceTool } from './hooks/tools/useSpliceTool';
import { useTrackReordering } from './hooks/tracks/useTrackReordering';
import { useMiddleClickPan } from './hooks/viewport/useMiddleClickPan';
import { useTimelineViewport } from './hooks/viewport/useTimelineViewport';
import { useWheelZoomPan } from './hooks/viewport/useWheelZoomPan';
import { ZoomPanScrollbar } from './ZoomPanScrollbar';
import type {
  TimelineItem,
  TimelineTrack,
  TimelineTrackGroup,
  Marker,
  ToolType,
} from './core/models';
import './Timeline.css';

/**
 * Determines the cursor style based on current interaction state
 */
function getCursorStyle(
  isPanning: boolean,
  activeTool: ToolType,
  isDeleteMode: boolean,
): string {
  if (isPanning) return 'grabbing';
  if (activeTool === 'pan') return 'grab';
  if (isDeleteMode) return 'not-allowed';
  return 'default';
}

// Re-export types for backward compatibility
export type { TimelineItem, TimelineTrack, TimelineTrackGroup, Marker, ToolType };

/**
 * Props for the Timeline component
 *
 * @example
 * ```tsx
 * <Timeline
 *   tracks={[
 *     { id: 'track1', label: 'Video Track', color: '#3b82f6' },
 *     { id: 'track2', label: 'Audio Track', color: '#10b981' }
 *   ]}
 *   items={[
 *     { id: 'item1', trackId: 'track1', startMs: 0, endMs: 5000, label: 'Clip 1' }
 *   ]}
 *   durationMs={120000}
 *   currentTimeMs={0}
 *   frameRate={30}
 *   onItemsChange={(items) => console.log('Items changed:', items)}
 *   onTimeChange={(timeMs) => console.log('Time:', timeMs)}
 * />
 * ```
 */
export interface TimelineProps {
  /** Array of tracks (lanes) in the timeline */
  tracks: TimelineTrack[];
  /** Optional track groups for organizing tracks */
  trackGroups?: TimelineTrackGroup[];
  /** Array of timeline items (clips/segments) */
  items: TimelineItem[];
  /** Total duration of timeline in milliseconds */
  durationMs: number;
  /** Current playhead position in milliseconds */
  currentTimeMs?: number;
  /** Active editing tool (select, pan, splice) */
  activeTool?: ToolType;
  /** Array of selected item IDs (controlled mode) */
  selectedItemIds?: string[];
  /** Callback when items change (add, delete, move, resize) */
  onItemsChange?: (items: TimelineItem[]) => void;
  /** Callback when tracks change (reorder, add, delete) */
  onTracksChange?: (tracks: TimelineTrack[]) => void;
  /** Callback when playhead position changes */
  onTimeChange?: (timeMs: number) => void;
  /** Callback for preview time (during hover/scrub) */
  onPreviewTimeChange?: (timeMs: number) => void;
  /** Callback when track groups change */
  onTrackGroupsChange?: (groups: TimelineTrackGroup[]) => void;
  /** Callback when temporary tool is activated (e.g. middle-click pan) */
  onTemporaryToolChange?: (tool: ToolType | null) => void;
  /** Callback when selection changes */
  onSelectionChange?: (selectedItemIds: string[]) => void;
  /** Callback when snap is temporarily overridden (Alt key) */
  onTemporarySnapChange?: (override: boolean | null) => void;
  /** Timeline width in pixels (default: 800) */
  width?: number;
  /** Timeline height in pixels (default: 400) */
  height?: number;
  /** Maximum undo/redo history size (default: 50) */
  maxHistorySize?: number;
  /** Enable undo/redo functionality (default: true) */
  enableHistory?: boolean;
  /** Frame rate for frame-based operations (default: 30) */
  frameRate?: number;
  /** Array of markers (time indicators) */
  markers?: Marker[];
  /** Callback when markers change */
  onMarkersChange?: (markers: Marker[]) => void;
  /** Enable marker functionality (default: true) */
  enableMarkers?: boolean;
  /** Enable snap-to-grid/markers (default: false) */
  snapEnabled?: boolean;
  /** Callback when snap is toggled */
  onSnapToggle?: (enabled: boolean) => void;
}

// ============================================================================
// CONSTANTS (using centralized constants)
// ============================================================================

const {
  RULER_HEIGHT,
  LABEL_WIDTH,
  SCROLLBAR_SIZE,
} = TIMELINE_CONSTANTS;

// ============================================================================
// TIMELINE COMPONENT
// ============================================================================

/**
 * Timeline - Production-ready timeline component for video/audio editing
 *
 * A comprehensive timeline component with:
 * - Multi-track support with automatic collision detection
 * - Drag-and-drop item manipulation (move, resize)
 * - Multiple editing tools (select, pan, splice)
 * - Snap-to-grid and marker snapping
 * - Undo/redo history
 * - Keyboard shortcuts
 * - Zoom and pan controls
 * - Frame-accurate operations
 *
 * @example Basic usage
 * ```tsx
 * import { Timeline } from '@hoolsy/timeline';
 *
 * function App() {
 *   const [tracks] = useState([
 *     { id: '1', label: 'Video', color: '#3b82f6' }
 *   ]);
 *   const [items, setItems] = useState([
 *     { id: 'a', trackId: '1', startMs: 0, endMs: 5000, label: 'Clip 1' }
 *   ]);
 *
 *   return (
 *     <Timeline
 *       tracks={tracks}
 *       items={items}
 *       durationMs={60000}
 *       onItemsChange={setItems}
 *     />
 *   );
 * }
 * ```
 *
 * @example With markers and snap
 * ```tsx
 * <Timeline
 *   tracks={tracks}
 *   items={items}
 *   durationMs={120000}
 *   markers={[
 *     { markerId: 'm1', timeMs: 5000, label: 'Intro', color: '#ef4444' }
 *   ]}
 *   snapEnabled={true}
 *   onSnapToggle={(enabled) => console.log('Snap:', enabled)}
 * />
 * ```
 *
 * @param props - Timeline configuration and callbacks
 * @returns React component
 */
export function Timeline({
  tracks,
  trackGroups: _trackGroups = [],
  items,
  durationMs,
  currentTimeMs = 0,
  activeTool = 'select',
  selectedItemIds: controlledSelectedItemIds,
  onItemsChange,
  onTracksChange,
  onTimeChange,
  onPreviewTimeChange,
  onTrackGroupsChange: _onTrackGroupsChange,
  onTemporaryToolChange,
  onSelectionChange,
  onTemporarySnapChange,
  width = 800,
  height = 400,
  maxHistorySize = 50,
  enableHistory = true,
  frameRate = 30,
  markers = [],
  onMarkersChange,
  enableMarkers = true,
  snapEnabled = false,
  onSnapToggle,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // History management (using hook)
  const { addToHistory, performUndo, performRedo } = useHistoryManager({
    enableHistory,
    maxHistorySize,
    onItemsChange,
  });

  // Snap behavior (using hook)
  const {
    snapEnabled: internalSnapEnabled,
    effectiveSnapEnabled,
    setTemporarySnapOverride,
    findSnapPoints,
    handleSnapToggle,
  } = useSnapBehavior({
    snapEnabled,
    onSnapToggle,
    onTemporarySnapChange,
    currentTimeMs,
    markers,
    items,
    snapRadiusPx: 20, // Snap radius in pixels
  });

  // Splice drag state (for multi-item splice)
  const [spliceDragState, setSpliceDragState] = useState<{
    isActive: boolean;
    startX: number;
    currentX: number;
    startY: number;
    currentY: number;
  } | null>(null);

  // Selected items state (for multi-select with Shift) - using hook
  const { selectedItems: selectedItemIds, setSelectedItems: setSelectedItemIds } =
    useControlledSelection({
      controlledValue: controlledSelectedItemIds,
      onChange: onSelectionChange,
    });

  // Selection box state (for drag-to-select)
  const [selectionBox, setSelectionBox] = useState<{
    isActive: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    shiftHeld: boolean; // Track if Shift was held when box started
  } | null>(null);

  // Zoom/Pan state - start with full view
  const [horizontalView, setHorizontalView] = useState({ start: 0, end: 1 }); // Show all
  const [verticalView, setVerticalView] = useState({ start: 0, end: 1 }); // Show all vertical content
  const [verticalZoom, setVerticalZoom] = useState(1.0); // NEW: 1.0 = 100% zoom (default 40px per sub-track)

  // Middle-click pan (using hook)
  const { middleClickPanState, startPan } = useMiddleClickPan({
    containerRef,
    horizontalView,
    verticalView,
    setHorizontalView,
    setVerticalView,
    onTemporaryToolChange,
  });

  // Delete mode (using hook)
  const { deleteMode, startDeleteMode, markForDeletion } = useDeleteMode({
    items,
    activeTool,
    onItemsChange,
  });

  // DEBUG: Log zoom changes
  React.useEffect(() => {
    debugLog('layout', 'Vertical zoom changed', { verticalZoom, percentage: `${Math.round(verticalZoom * 100)}%` });
  }, [verticalZoom]);

  // Development warnings (only in dev mode)
  useEffect(() => {
    if (import.meta.env?.MODE === 'development' || import.meta.env?.DEV) {
      // Validate duration
      if (durationMs <= 0) {
        debugWarn('init', 'durationMs should be > 0', { durationMs });
      }

      // Validate items within bounds
      const outOfBounds = items.filter((item) => item.startMs < 0 || item.endMs > durationMs);
      if (outOfBounds.length > 0) {
        debugWarn('init', `${outOfBounds.length} items are outside timeline duration (0-${durationMs}ms)`);
        debugTable(
          'init',
          'Out of bounds items',
          outOfBounds.map((item) => ({
            id: item.id,
            label: item.label,
            start: item.startMs,
            end: item.endMs,
            duration: item.endMs - item.startMs,
          })),
        );
      }

      // Validate tracks have unique IDs
      const trackIds = new Set(tracks.map((t) => t.id));
      if (trackIds.size !== tracks.length) {
        debugWarn('init', 'Duplicate track IDs detected!');
        const duplicates = tracks.filter(
          (track, index) => tracks.findIndex((t) => t.id === track.id) !== index,
        );
        debugTable('init', 'Duplicate tracks', duplicates.map((t) => ({ id: t.id, label: t.label })));
      }

      // Validate items reference existing tracks
      const orphanedItems = items.filter((item) => !trackIds.has(item.trackId));
      if (orphanedItems.length > 0) {
        debugWarn('init', `${orphanedItems.length} items reference non-existent tracks`);
        debugTable(
          'init',
          'Orphaned items',
          orphanedItems.map((item) => ({
            id: item.id,
            label: item.label,
            trackId: item.trackId,
          })),
        );
      }

      // Validate frame rate
      if (frameRate <= 0) {
        debugWarn('init', 'frameRate should be > 0', { frameRate });
      }
    }
  }, [durationMs, items, tracks, frameRate]);

  // Viewport calculations (using hook)
  const { visibleStartMs, visibleEndMs, visibleDurationMs, contentWidth, contentHeight, pxPerMs } =
    useTimelineViewport({
      horizontalView,
      durationMs,
      width,
      height,
      labelWidth: LABEL_WIDTH,
      rulerHeight: RULER_HEIGHT,
      scrollbarSize: SCROLLBAR_SIZE,
    });

  // Vertical layout calculations (using hook)
  const {
    currentSubTrackHeight,
    showLabels,
    totalTracksHeight,
    verticalScrollOffset,
  } = useVerticalLayout({
    tracks,
    items,
    verticalView,
    verticalZoom,
    contentHeight,
    setVerticalView,
  });

  // Context menus (using hook)
  const {
    markerContextMenu,
    rulerContextMenu,
    setMarkerContextMenu,
    setRulerContextMenu,
    handleRulerContextMenu,
  } = useContextMenus({
    enableMarkers,
    pxPerMs,
    durationMs,
    visibleStartMs,
    frameRate,
  });

  // Playhead drag behavior (using hook)
  const { playheadDragState, handlePlayheadMouseDown } = usePlayheadDrag({
    containerRef,
    labelWidth: LABEL_WIDTH,
    visibleStartMs,
    pxPerMs,
    durationMs,
    frameRate,
    onTimeChange,
  });

  // Marker drag behavior (using hook)
  const { markerDragState, handleMarkerDragStart } = useMarkerDrag({
    markers,
    pxPerMs,
    durationMs,
    frameRate,
    onMarkersChange,
  });

  // Track drag behavior (using hook)
  const { trackDragState, handleTrackDragStart } = useTrackDrag({
    tracks,
    onTracksChange,
  });

  // Item drag behavior (using hook)
  const { dragState, handleDragStart } = useItemDrag({
    items,
    contentWidth,
    visibleDurationMs,
    frameRate,
    durationMs,
    findSnapPoints,
    onItemsChange,
    onPreviewTimeChange,
    isSnapControlled: onSnapToggle !== undefined,
    snapEnabled: effectiveSnapEnabled,
    internalSnapEnabled,
    setTemporarySnapOverride,
    addToHistory,
  });

  // Item interactions (using hook)
  const { handleItemMouseDown } = useItemInteractions({
    activeTool,
    items,
    containerRef,
    deleteMode,
    selectedItemIds,
    startPan,
    setSpliceDragState,
    startDeleteMode,
    setSelectedItemIds,
    handleDragStart,
  });

  // Track interactions (using hook)
  const { handleTrackMouseDown } = useTrackInteractions({
    activeTool,
    deleteMode,
    containerRef,
    startPan,
    setSpliceDragState,
    startDeleteMode,
    setSelectedItemIds,
    setSelectionBox,
  });

  // Handle RULER click for seeking (using hook)
  const { handleRulerClick } = useRulerClick({
    visibleStartMs,
    pxPerMs,
    durationMs,
    frameRate,
    isDragging: !!(dragState || playheadDragState || markerDragState),
    onTimeChange,
  });

  // Marker handlers (using hook)
  const {
    handleMarkerClick,
    handleMarkerRightClick,
    handleAddMarker,
    handleToggleMarkerAtPlayhead,
    handleDeleteMarker,
    handleRenameMarker,
    handleChangeMarkerColor,
  } = useMarkerHandlers({
    markers,
    currentTimeMs,
    frameRate,
    enableMarkers,
    onMarkersChange,
    onTimeChange,
    setMarkerContextMenu,
  });

  // Track reordering functions (using hook)
  // moveTrackUp and moveTrackDown available for future UI controls
  useTrackReordering({
    tracks,
    onTracksChange,
  });

  // Keyboard shortcuts (handles Undo/Redo, Copy/Cut/Paste, Delete, Toggle Marker, Toggle Snap)
  // clipboard state available for paste operations
  useKeyboardShortcuts({
    items,
    selectedItemIds,
    currentTimeMs,
    enableHistory,
    enableMarkers,
    effectiveSnapEnabled,
    onItemsChange,
    setSelectedItemIds,
    performUndo,
    performRedo,
    addToHistory,
    handleToggleMarkerAtPlayhead,
    handleSnapToggle,
  });

  // Wheel zoom/pan (using hook)
  useWheelZoomPan({
    containerRef,
    horizontalView,
    verticalView,
    verticalZoom,
    totalTracksHeight,
    contentHeight,
    currentSubTrackHeight,
    setHorizontalView,
    setVerticalView,
    setVerticalZoom,
  });

  // Splice tool (using hook)
  useSpliceTool({
    spliceDragState,
    items,
    tracks,
    containerRef,
    visibleStartMs,
    pxPerMs,
    labelWidth: LABEL_WIDTH,
    rulerHeight: RULER_HEIGHT,
    currentSubTrackHeight,
    verticalScrollOffset,
    frameRate,
    selectedItemIds,
    onItemsChange,
    setSpliceDragState,
    setSelectedItemIds,
    addToHistory,
  });

  // Selection box (using hook)
  useSelectionBox({
    selectionBox,
    items,
    tracks,
    containerRef,
    visibleStartMs,
    pxPerMs,
    labelWidth: LABEL_WIDTH,
    rulerHeight: RULER_HEIGHT,
    currentSubTrackHeight,
    verticalScrollOffset,
    selectedItemIds,
    setSelectionBox,
    setSelectedItemIds,
  });

  return (
    <div
      ref={containerRef}
      className="timeline-container"
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        cursor: getCursorStyle(middleClickPanState !== null, activeTool, deleteMode.isActive),
      }}
      onContextMenu={(e) => {
        // ALWAYS prevent default Chrome context menu in timeline
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Main content area with ruler and tracks */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Ruler */}
          <div
            className="timeline-ruler"
            style={{ height: RULER_HEIGHT, display: 'flex', position: 'relative', zIndex: 1 }}
          >
            <div className="ruler-label-spacer" style={{ width: LABEL_WIDTH }} />
            <div
              className="ruler-content"
              style={{ flex: 1, position: 'relative' }}
              onClick={handleRulerClick}
              onContextMenu={handleRulerContextMenu}
            >
              <RulerMarks
                visibleStartMs={visibleStartMs}
                visibleEndMs={visibleEndMs}
                pxPerMs={pxPerMs}
                width={contentWidth}
                frameRate={frameRate}
              />
              {enableMarkers && (
                <TimelineMarkers
                  markers={markers}
                  visibleStartMs={visibleStartMs}
                  visibleEndMs={visibleEndMs}
                  pxPerMs={pxPerMs}
                  contentHeight={contentHeight}
                  onMarkerClick={handleMarkerClick}
                  onMarkerRightClick={handleMarkerRightClick}
                  onMarkerDragStart={handleMarkerDragStart}
                />
              )}
            </div>
          </div>

          {/* Tracks */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Track labels */}
            <div
              style={{
                width: LABEL_WIDTH,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  transform: `translateY(${verticalScrollOffset}px)`,
                  willChange: 'transform',
                  transition: 'transform 0.1s ease-out', // Smooth scroll animation
                }}
              >
                {tracks.map((track, _trackIndex) => {
                  const maxSubTracks = getMaxSubTracks(track.id, items);
                  const trackHeight = maxSubTracks * currentSubTrackHeight;

                  return (
                    <TrackLabel
                      key={track.id}
                      track={track}
                      height={trackHeight}
                      laneCount={maxSubTracks}
                      isGrouped={!!track.groupId}
                      isDragging={trackDragState?.trackId === track.id}
                      onDragStart={handleTrackDragStart}
                      canReorder={!!onTracksChange}
                    />
                  );
                })}
              </div>{' '}
              {/* Close translateY wrapper */}
            </div>

            {/* Track content */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  transform: `translateY(${verticalScrollOffset}px)`,
                  willChange: 'transform',
                  transition: 'transform 0.1s ease-out', // Smooth scroll animation
                }}
              >
                <TrackContent
                  tracks={tracks}
                  items={items}
                  visibleStartMs={visibleStartMs}
                  visibleEndMs={visibleEndMs}
                  pxPerMs={pxPerMs}
                  currentSubTrackHeight={currentSubTrackHeight}
                  showLabels={showLabels}
                  selectedItemIds={selectedItemIds}
                  deleteMode={deleteMode}
                  dragState={dragState}
                  activeTool={activeTool}
                  onTrackMouseDown={handleTrackMouseDown}
                  onItemMouseDown={handleItemMouseDown}
                  markForDeletion={markForDeletion}
                />
              </div>{' '}
              {/* Close translateY wrapper */}
            </div>
          </div>
        </div>

        {/* Playhead overlay */}
        <Playhead
          currentTimeMs={currentTimeMs}
          visibleStartMs={visibleStartMs}
          visibleEndMs={visibleEndMs}
          pxPerMs={pxPerMs}
          labelWidth={LABEL_WIDTH}
          rulerHeight={RULER_HEIGHT}
          contentHeight={contentHeight}
          isDragging={!!playheadDragState}
          isPanning={!!middleClickPanState?.isPanning}
          onMouseDown={handlePlayheadMouseDown}
        />

        {/* Vertical splice drag line */}
        {spliceDragState?.isActive && (
          <SpliceIndicatorOverlay
            startX={spliceDragState.startX}
            startY={spliceDragState.startY}
            currentY={spliceDragState.currentY}
          />
        )}

        {/* Snap guides removed - no visual feedback */}

        {/* Selection box overlay */}
        {selectionBox?.isActive && (
          <SelectionBoxOverlay
            startX={selectionBox.startX}
            startY={selectionBox.startY}
            currentX={selectionBox.currentX}
            currentY={selectionBox.currentY}
          />
        )}

        {/* Vertical scrollbar with integrated zoom (right side) */}
        <ZoomPanScrollbar
          orientation="vertical"
          viewStart={verticalView.start}
          viewEnd={verticalView.end}
          onViewChange={(start, end) => setVerticalView({ start, end })}
          onZoomChange={setVerticalZoom}
          currentZoom={verticalZoom}
          size={SCROLLBAR_SIZE}
        />
      </div>

      {/* Horizontal scrollbar (bottom) */}
      <div style={{ display: 'flex', height: SCROLLBAR_SIZE, flexShrink: 0 }}>
        <div style={{ width: LABEL_WIDTH, flexShrink: 0 }} /> {/* Spacer for label column */}
        <div style={{ flex: 1 }}>
          <ZoomPanScrollbar
            orientation="horizontal"
            viewStart={horizontalView.start}
            viewEnd={horizontalView.end}
            onViewChange={(start, end) => setHorizontalView({ start, end })}
            size={SCROLLBAR_SIZE}
          />
        </div>
        <div style={{ width: SCROLLBAR_SIZE, flexShrink: 0 }} />{' '}
        {/* Spacer for vertical scrollbar */}
      </div>

      {/* Marker context menu */}
      {markerContextMenu && (
        <ContextMenu
          x={markerContextMenu.x}
          y={markerContextMenu.y}
          items={[
            {
              label: 'Rename Marker',
              onClick: () => handleRenameMarker(markerContextMenu.marker.markerId),
            },
            {
              label: 'Change Color',
              onClick: () => handleChangeMarkerColor(markerContextMenu.marker.markerId),
            },
            {
              label: 'Delete Marker',
              color: '#dc2626',
              onClick: () => handleDeleteMarker(markerContextMenu.marker.markerId),
            },
          ]}
          onClose={() => setMarkerContextMenu(null)}
        />
      )}

      {/* Ruler context menu */}
      {rulerContextMenu && (
        <ContextMenu
          x={rulerContextMenu.x}
          y={rulerContextMenu.y}
          items={[
            {
              label: 'Add Marker Here',
              onClick: () => {
                debugLog('marker', 'Add Marker clicked', { timeMs: rulerContextMenu.timeMs });
                handleAddMarker(rulerContextMenu.timeMs);
              },
            },
          ]}
          onClose={() => setRulerContextMenu(null)}
        />
      )}
    </div>
  );
}
