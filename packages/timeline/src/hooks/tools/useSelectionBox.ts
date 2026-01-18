// packages/timeline/src/hooks/tools/useSelectionBox.ts
import { useEffect, type RefObject } from 'react';
import { getMaxSubTracks } from '../../core/services';
import { msToPx } from '../../core/utils';
import type { TimelineItem, TimelineTrack } from '../../core/models';

export interface SelectionBox {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  shiftHeld: boolean; // Track if Shift was held when box started
}

export interface UseSelectionBoxOptions {
  selectionBox: SelectionBox | null;
  items: TimelineItem[];
  tracks: TimelineTrack[];
  containerRef: RefObject<HTMLDivElement | null>;
  visibleStartMs: number;
  pxPerMs: number;
  labelWidth: number;
  rulerHeight: number;
  currentSubTrackHeight: number;
  verticalScrollOffset: number;
  selectedItemIds: Set<string>;
  setSelectionBox: (
    box: SelectionBox | null | ((prev: SelectionBox | null) => SelectionBox | null),
  ) => void;
  setSelectedItemIds: (ids: Set<string>) => void;
}

/**
 * Hook for managing drag-to-select box functionality
 * Handles mouse move during selection box drag and updates selected items
 */
export function useSelectionBox({
  selectionBox,
  items,
  tracks,
  containerRef,
  visibleStartMs,
  pxPerMs,
  labelWidth,
  rulerHeight,
  currentSubTrackHeight,
  verticalScrollOffset,
  selectedItemIds,
  setSelectionBox,
  setSelectedItemIds,
}: UseSelectionBoxOptions): void {
  // Handle selection box drag
  useEffect(() => {
    if (!selectionBox?.isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setSelectionBox((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentX: e.clientX - rect.left,
          currentY: e.clientY - rect.top,
        };
      });

      // Calculate selection box bounds
      const box = {
        left: Math.min(selectionBox.startX, e.clientX - rect.left),
        right: Math.max(selectionBox.startX, e.clientX - rect.left),
        top: Math.min(selectionBox.startY, e.clientY - rect.top),
        bottom: Math.max(selectionBox.startY, e.clientY - rect.top),
      };

      // Find items within selection box
      // If Shift was held when box started, preserve existing selection
      const selectedIds = selectionBox.shiftHeld ? new Set(selectedItemIds) : new Set<string>();

      items.forEach((item) => {
        // Calculate item position
        const itemLeft = labelWidth + msToPx(item.startMs - visibleStartMs, pxPerMs);
        const itemRight = labelWidth + msToPx(item.endMs - visibleStartMs, pxPerMs);

        // Calculate item Y position (considering vertical scroll)
        let itemTop = rulerHeight;
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];
          if (!track) continue;
          if (track.id === item.trackId) {
            const subTrackIndex = item.subTrackIndex ?? 0;
            itemTop += subTrackIndex * currentSubTrackHeight;
            break;
          }
          itemTop += getMaxSubTracks(track.id, items) * currentSubTrackHeight;
        }
        itemTop += verticalScrollOffset; // Apply vertical scroll offset
        const itemBottom = itemTop + currentSubTrackHeight;

        // Check if item intersects with selection box
        const intersects = !(
          itemRight < box.left ||
          itemLeft > box.right ||
          itemBottom < box.top ||
          itemTop > box.bottom
        );

        if (intersects) {
          selectedIds.add(item.id);
        }
      });

      // Update selected items
      setSelectedItemIds(selectedIds);
    };

    const handleMouseUp = () => {
      setSelectionBox(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    selectionBox,
    items,
    tracks,
    containerRef,
    visibleStartMs,
    pxPerMs,
    labelWidth,
    rulerHeight,
    currentSubTrackHeight,
    verticalScrollOffset,
    selectedItemIds,
    setSelectionBox,
    setSelectedItemIds,
  ]);
}
