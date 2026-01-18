// packages/timeline/src/hooks/interactions/useItemDrag.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { reassignTrackSubTracks } from '../../core/services';
import { pxToMs, snapToFrame } from '../../core/utils';
import type { TimelineItem } from '../../core/models';

export interface UseItemDragOptions {
  items: TimelineItem[];
  contentWidth: number;
  visibleDurationMs: number;
  frameRate: number;
  durationMs: number;
  findSnapPoints: (timeMs: number, pxPerMs: number, excludeIds: string[]) => number | null;
  onItemsChange?: ((items: TimelineItem[]) => void) | undefined;
  onPreviewTimeChange?: ((timeMs: number) => void) | undefined;
  isSnapControlled?: boolean;
  snapEnabled?: boolean;
  internalSnapEnabled?: boolean;
  setTemporarySnapOverride: (override: boolean | null) => void;
  addToHistory: (items: TimelineItem[], action: string) => void;
}

export interface DragState {
  itemId: string;
  mode: 'move' | 'resize-start' | 'resize-end';
  startX: number;
  startMs: number;
  endMs: number;
  selectedItems?: Array<{ id: string; startMs: number; endMs: number }> | undefined;
}

export interface UseItemDragReturn {
  dragState: DragState | null;
  handleDragStart: (
    item: TimelineItem,
    mode: 'move' | 'resize-start' | 'resize-end',
    clientX: number,
    selectedItems?: Array<{ id: string; startMs: number; endMs: number }>,
  ) => void;
}

/**
 * Hook for managing item drag behavior (move and resize)
 * Handles both single and multi-select dragging with snapping
 */
export function useItemDrag({
  items,
  contentWidth,
  visibleDurationMs,
  frameRate,
  durationMs,
  findSnapPoints,
  onItemsChange,
  onPreviewTimeChange,
  isSnapControlled,
  snapEnabled,
  internalSnapEnabled,
  setTemporarySnapOverride,
  addToHistory,
}: UseItemDragOptions): UseItemDragReturn {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const itemsBeforeDragRef = useRef<TimelineItem[]>([]);

  // Track previous snap override to avoid unnecessary state updates
  const prevSnapOverrideRef = useRef<boolean | null>(null);

  const handleDragStart = useCallback(
    (
      item: TimelineItem,
      mode: 'move' | 'resize-start' | 'resize-end',
      clientX: number,
      selectedItems?: Array<{ id: string; startMs: number; endMs: number }>,
    ) => {
      // Capture current state before drag
      itemsBeforeDragRef.current = items;

      setDragState({
        itemId: item.id,
        mode,
        startX: clientX,
        startMs: item.startMs,
        endMs: item.endMs,
        selectedItems,
      });
    },
    [items],
  );

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Handle ALT key for temporary snap override
      const baseSnapEnabled = isSnapControlled ? snapEnabled : internalSnapEnabled;
      const shouldToggleSnap = e.altKey;
      const temporarySnap = shouldToggleSnap ? !baseSnapEnabled : null;

      // Only update state if the value actually changed
      if (prevSnapOverrideRef.current !== temporarySnap) {
        prevSnapOverrideRef.current = temporarySnap;
        setTemporarySnapOverride(temporarySnap);
      }

      const deltaX = e.clientX - dragState.startX;
      // Use current pxPerMs for accurate drag calculation
      const currentPxPerMs = contentWidth / visibleDurationMs;
      const deltaMs = pxToMs(deltaX, currentPxPerMs);

      let newStartMs = dragState.startMs;
      let newEndMs = dragState.endMs;

      if (dragState.mode === 'move') {
        // Move entire item(s)
        newStartMs = dragState.startMs + deltaMs;
        newEndMs = dragState.endMs + deltaMs;

        // Build list of items to exclude from snapping (the dragged item and any selected items)
        const excludeIds = dragState.selectedItems
          ? [dragState.itemId, ...dragState.selectedItems.map((i) => i.id)]
          : [dragState.itemId];

        // Apply snapping to start or end (whichever is closer to a snap point)
        const snapToStart = findSnapPoints(newStartMs, currentPxPerMs, excludeIds);
        const snapToEnd = findSnapPoints(newEndMs, currentPxPerMs, excludeIds);

        if (snapToStart !== null) {
          const snapDelta = snapToStart - newStartMs;
          newStartMs = snapToStart;
          newEndMs = newEndMs + snapDelta;
        } else if (snapToEnd !== null) {
          const snapDelta = snapToEnd - newEndMs;
          newEndMs = snapToEnd;
          newStartMs = newStartMs + snapDelta;
        }

        // Clamp to timeline bounds
        if (newStartMs < 0) {
          newStartMs = 0;
          newEndMs = dragState.endMs - dragState.startMs;
        }
        if (newEndMs > durationMs) {
          newEndMs = durationMs;
          newStartMs = newEndMs - (dragState.endMs - dragState.startMs);
        }
      } else if (dragState.mode === 'resize-start') {
        // Resize from start (left edge)
        newStartMs = dragState.startMs + deltaMs;
        newStartMs = Math.max(0, Math.min(newStartMs, dragState.endMs - 100)); // Min 100ms duration

        // Apply snapping (exclude the item being resized)
        const snappedStart = findSnapPoints(newStartMs, currentPxPerMs, [dragState.itemId]);
        if (snappedStart !== null && snappedStart < dragState.endMs - 100) {
          newStartMs = snappedStart;
        }

        // Preview the frame at the new start position
        onPreviewTimeChange?.(newStartMs);
      } else if (dragState.mode === 'resize-end') {
        // Resize from end (right edge)
        newEndMs = dragState.endMs + deltaMs;
        newEndMs = Math.max(dragState.startMs + 100, Math.min(newEndMs, durationMs)); // Min 100ms duration

        // Apply snapping (exclude the item being resized)
        const snappedEnd = findSnapPoints(newEndMs, currentPxPerMs, [dragState.itemId]);
        if (snappedEnd !== null && snappedEnd > dragState.startMs + 100) {
          newEndMs = snappedEnd;
        }

        // Preview the frame at the new end position
        onPreviewTimeChange?.(newEndMs);
      }

      // Update items - handle multi-select
      const updatedItems = items.map((item) => {
        if (item.id === dragState.itemId) {
          // Primary dragged item
          return { ...item, startMs: newStartMs, endMs: newEndMs };
        } if (dragState.selectedItems) {
          const selectedItem = dragState.selectedItems.find((si) => si.id === item.id);
          if (selectedItem) {
            // Secondary selected items - apply same delta
            if (dragState.mode === 'move') {
              // Move: Apply same time delta
              let itemNewStartMs = selectedItem.startMs + deltaMs;
              let itemNewEndMs = selectedItem.endMs + deltaMs;

              // Clamp to timeline bounds
              if (itemNewStartMs < 0) {
                itemNewStartMs = 0;
                itemNewEndMs = selectedItem.endMs - selectedItem.startMs;
              }
              if (itemNewEndMs > durationMs) {
                itemNewEndMs = durationMs;
                itemNewStartMs = itemNewEndMs - (selectedItem.endMs - selectedItem.startMs);
              }

              return { ...item, startMs: itemNewStartMs, endMs: itemNewEndMs };
            } if (dragState.mode === 'resize-start') {
              // Resize start: Apply same delta to start time
              let itemNewStartMs = selectedItem.startMs + deltaMs;
              itemNewStartMs = Math.max(0, Math.min(itemNewStartMs, item.endMs - 100));
              return { ...item, startMs: itemNewStartMs };
            } if (dragState.mode === 'resize-end') {
              // Resize end: Apply same delta to end time
              let itemNewEndMs = selectedItem.endMs + deltaMs;
              itemNewEndMs = Math.max(item.startMs + 100, Math.min(itemNewEndMs, durationMs));
              return { ...item, endMs: itemNewEndMs };
            }
          }
        }
        return item;
      });

      onItemsChange?.(updatedItems);
    };

    const handleMouseUp = () => {
      // Reset temporary snap override
      prevSnapOverrideRef.current = null;
      setTemporarySnapOverride(null);

      // SNAP TO FRAMES: Apply frame snapping to all items after drag/resize
      const snappedItems = items.map((item) => ({
        ...item,
        startMs: snapToFrame(item.startMs, frameRate),
        endMs: snapToFrame(item.endMs, frameRate),
      }));

      // Re-assign all sub-tracks on the affected track(s) to compact lanes
      if (dragState && onItemsChange) {
        // Get all affected track IDs (primary + selected items)
        const affectedTrackIds = new Set<string>();

        const draggedItem = snappedItems.find((i) => i.id === dragState.itemId);
        if (draggedItem) {
          affectedTrackIds.add(draggedItem.trackId);
        }

        if (dragState.selectedItems) {
          dragState.selectedItems.forEach((si) => {
            const item = items.find((i) => i.id === si.id);
            if (item) {
              affectedTrackIds.add(item.trackId);
            }
          });
        }

        // Reassign sub-tracks for all affected tracks (use snapped items)
        let updatedItems = snappedItems;
        affectedTrackIds.forEach((trackId) => {
          updatedItems = reassignTrackSubTracks(trackId, updatedItems);
        });

        // Add to history
        let actionType: string;
        if (dragState.mode === 'move') {
          actionType = 'Move items';
        } else if (dragState.mode === 'resize-start') {
          actionType = 'Resize items (start)';
        } else {
          actionType = 'Resize items (end)';
        }
        addToHistory(itemsBeforeDragRef.current, `Before ${actionType}`);

        onItemsChange(updatedItems);
      }

      setDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Reset snap override ref on cleanup
      prevSnapOverrideRef.current = null;
    };
  }, [
    dragState,
    items,
    onItemsChange,
    contentWidth,
    visibleDurationMs,
    durationMs,
    frameRate,
    findSnapPoints,
    onPreviewTimeChange,
    isSnapControlled,
    snapEnabled,
    internalSnapEnabled,
    setTemporarySnapOverride,
    addToHistory,
  ]);

  return {
    dragState,
    handleDragStart,
  };
}
