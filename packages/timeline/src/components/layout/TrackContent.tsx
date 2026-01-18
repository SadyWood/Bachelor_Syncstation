// packages/timeline/src/components/layout/TrackContent.tsx
import React from 'react';
import { getMaxSubTracks } from '../../core/services';
import { msToPx } from '../../core/utils';
import { TimelineItem as TimelineItemComponent } from '../interactive/TimelineItem';
import type { TimelineTrack, TimelineItem, ToolType } from '../../core/models';
import type { DragState } from '../../hooks/interactions/useItemDrag';
import type { DeleteModeState } from '../../hooks/tools/useDeleteMode';

export interface TrackContentProps {
  tracks: TimelineTrack[];
  items: TimelineItem[];
  visibleStartMs: number;
  visibleEndMs: number;
  pxPerMs: number;
  currentSubTrackHeight: number;
  showLabels: boolean;
  selectedItemIds: Set<string>;
  deleteMode: DeleteModeState;
  dragState: DragState | null;
  activeTool: ToolType;
  onTrackMouseDown: (e: React.MouseEvent) => void;
  onItemMouseDown: (
    e: React.MouseEvent,
    item: TimelineItem,
    mode: 'move' | 'resize-start' | 'resize-end',
  ) => void;
  markForDeletion: (itemId: string) => void;
}

/**
 * Renders all tracks with their items
 * Handles sub-track dividers, item positioning, and visible item filtering
 */
export const TrackContent = React.memo<TrackContentProps>(
  ({
    tracks,
    items,
    visibleStartMs,
    visibleEndMs,
    pxPerMs,
    currentSubTrackHeight,
    showLabels,
    selectedItemIds,
    deleteMode,
    dragState,
    activeTool,
    onTrackMouseDown,
    onItemMouseDown,
    markForDeletion,
  }) => {
    // Memoize visible items to avoid refiltering on every render
    const visibleItems = React.useMemo(() => items.filter((item) => item.startMs < visibleEndMs && item.endMs > visibleStartMs), [items, visibleStartMs, visibleEndMs]);

    // Memoize items grouped by track for faster lookup
    const itemsByTrack = React.useMemo(() => {
      const map = new Map<string, TimelineItem[]>();
      visibleItems.forEach((item) => {
        if (!map.has(item.trackId)) {
          map.set(item.trackId, []);
        }
        map.get(item.trackId)?.push(item);
      });
      return map;
    }, [visibleItems]);

    return (
      <>
        {tracks.map((track, trackIndex) => {
          const maxSubTracks = getMaxSubTracks(track.id, items);
          const trackHeight = maxSubTracks * currentSubTrackHeight;

          // Calculate cumulative Y position
          let cumulativeY = 0;
          for (let i = 0; i < trackIndex; i++) {
            const prevTrack = tracks[i];
            if (prevTrack) {
              const prevMaxSubTracks = getMaxSubTracks(prevTrack.id, items);
              cumulativeY += prevMaxSubTracks * currentSubTrackHeight;
            }
          }

          // Generate divider objects with stable IDs
          const dividers = Array.from({ length: maxSubTracks }, (_, i) => ({
            id: `${track.id}-divider-${i}`,
            top: i * currentSubTrackHeight,
          }));

          return (
            <div
              key={track.id}
              className="timeline-track"
              style={{
                height: trackHeight,
                position: 'absolute',
                top: cumulativeY,
                left: 0,
                right: 0,
              }}
              onMouseDown={onTrackMouseDown}
            >
              {/* Render sub-track dividers */}
              {dividers.map((divider) => (
                <div
                  key={divider.id}
                  style={{
                    position: 'absolute',
                    top: divider.top,
                    left: 0,
                    right: 0,
                    height: currentSubTrackHeight,
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    transition: 'top 0.15s ease, height 0.15s ease', // Smooth resize
                  }}
                />
              ))}

              {(itemsByTrack.get(track.id) || []).map((item) => {
                // Clamp item to visible range
                const visibleItemStartMs = Math.max(item.startMs, visibleStartMs);
                const visibleItemEndMs = Math.min(item.endMs, visibleEndMs);

                const left = msToPx(visibleItemStartMs - visibleStartMs, pxPerMs);
                const itemWidth = msToPx(visibleItemEndMs - visibleItemStartMs, pxPerMs);

                const isDragging = dragState?.itemId === item.id;
                const subTrackIndex = item.subTrackIndex ?? 0;

                // Calculate item dimensions based on zoom
                const itemPaddingTop = Math.max(2, currentSubTrackHeight * 0.1);
                const itemPaddingBottom = Math.max(2, currentSubTrackHeight * 0.1);
                const itemHeight = currentSubTrackHeight - itemPaddingTop - itemPaddingBottom;

                // Handle mouse enter while in delete mode
                const handleItemMouseEnter = (_e: React.MouseEvent) => {
                  if (
                    deleteMode.isActive &&
                    activeTool === 'select' &&
                    !deleteMode.deletedIds.has(item.id)
                  ) {
                    markForDeletion(item.id);
                  }
                };

                const isSelected = selectedItemIds.has(item.id);
                const isBeingDragged =
                  isDragging ||
                  dragState?.selectedItems?.find((si) => si.id === item.id) !== undefined;
                const isDeleted = deleteMode.deletedIds.has(item.id);

                return (
                  <TimelineItemComponent
                    key={item.id}
                    item={item}
                    left={left}
                    width={itemWidth}
                    height={itemHeight}
                    top={(subTrackIndex * currentSubTrackHeight) + itemPaddingTop}
                    isSelected={isSelected}
                    isBeingDragged={isBeingDragged}
                    isDeleted={isDeleted}
                    activeTool={activeTool}
                    showLabel={showLabels}
                    deleteMode={deleteMode}
                    onMouseDown={(e, mode) => onItemMouseDown(e, item, mode)}
                    onMouseEnter={handleItemMouseEnter}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                );
              })}
            </div>
          );
        })}
      </>
    );
  },
  (prevProps, nextProps) =>
    // Custom comparison: only re-render if critical props changed
    (
      prevProps.visibleStartMs === nextProps.visibleStartMs &&
      prevProps.visibleEndMs === nextProps.visibleEndMs &&
      prevProps.pxPerMs === nextProps.pxPerMs &&
      prevProps.currentSubTrackHeight === nextProps.currentSubTrackHeight &&
      prevProps.showLabels === nextProps.showLabels &&
      prevProps.tracks === nextProps.tracks &&
      prevProps.items === nextProps.items &&
      prevProps.selectedItemIds === nextProps.selectedItemIds &&
      prevProps.deleteMode === nextProps.deleteMode &&
      prevProps.dragState === nextProps.dragState &&
      prevProps.activeTool === nextProps.activeTool
    ),

);

TrackContent.displayName = 'TrackContent';
