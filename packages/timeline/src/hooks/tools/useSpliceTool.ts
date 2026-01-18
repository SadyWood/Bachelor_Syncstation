// packages/timeline/src/hooks/tools/useSpliceTool.ts
import { useEffect, useRef, type RefObject } from 'react';
import { getMaxSubTracks, reassignTrackSubTracks } from '../../core/services';
import { msToPx, pxToMs, snapToFrame } from '../../core/utils';
import type { TimelineItem, TimelineTrack } from '../../core/models';

export interface SpliceDragState {
  isActive: boolean;
  startX: number;
  currentX: number;
  startY: number;
  currentY: number;
}

export interface SpliceIndicator {
  timeMs: number;
  xPos: number;
  affectedItems: string[];
}

export interface UseSpliceToolOptions {
  spliceDragState: SpliceDragState | null;
  items: TimelineItem[];
  tracks: TimelineTrack[];
  containerRef: RefObject<HTMLDivElement | null>;
  visibleStartMs: number;
  pxPerMs: number;
  labelWidth: number;
  rulerHeight: number;
  currentSubTrackHeight: number;
  verticalScrollOffset: number;
  frameRate: number;
  selectedItemIds: Set<string>;
  onItemsChange?: ((items: TimelineItem[]) => void) | undefined;
  setSpliceDragState: (
    state: SpliceDragState | null | ((prev: SpliceDragState | null) => SpliceDragState | null),
  ) => void;
  setSelectedItemIds: (ids: Set<string>) => void;
  addToHistory: (items: TimelineItem[], action: string) => void;
}

/**
 * Hook for managing splice tool functionality
 * Handles vertical line drag to cut multiple items
 */
export function useSpliceTool({
  spliceDragState,
  items,
  tracks,
  containerRef,
  visibleStartMs,
  pxPerMs,
  labelWidth,
  rulerHeight,
  currentSubTrackHeight,
  verticalScrollOffset,
  frameRate,
  selectedItemIds,
  onItemsChange,
  setSpliceDragState,
  setSelectedItemIds,
  addToHistory,
}: UseSpliceToolOptions): void {
  // Refs to persist state across drag
  const itemsSnapshotRef = useRef<TimelineItem[]>([]);
  const crossedItemsSetRef = useRef<Set<string>>(new Set());
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const currentTimeMsRef = useRef<number>(0);

  useEffect(() => {
    if (!spliceDragState?.isActive) return;

    // Capture items at the START of the drag (first time effect runs with active drag)
    if (itemsSnapshotRef.current.length === 0) {
      itemsSnapshotRef.current = items;
      crossedItemsSetRef.current = new Set();
      lastMousePosRef.current = null;
      currentTimeMsRef.current = 0;
    }
    const itemsSnapshot = itemsSnapshotRef.current;
    const crossedItemsSet = crossedItemsSetRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate vertical line X position
      const lineX = spliceDragState.startX;

      // Update drag state to track current position
      setSpliceDragState((prev) => {
        if (!prev) return null;
        return { ...prev, currentX: mouseX, currentY: mouseY };
      });
      const timelineX = lineX - labelWidth;
      const timeMs = visibleStartMs + pxToMs(timelineX, pxPerMs);
      currentTimeMsRef.current = timeMs;

      // Check all items that the vertical line intersects within the Y range
      const checkTracksForItems = (minY: number, maxY: number) => {
        itemsSnapshot.forEach((item) => {
          if (crossedItemsSet.has(item.id)) return;

          const itemLeft = labelWidth + msToPx(item.startMs - visibleStartMs, pxPerMs);
          const itemRight = labelWidth + msToPx(item.endMs - visibleStartMs, pxPerMs);

          let itemTop = rulerHeight;
          for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track?.id === item.trackId) {
              const subTrackIndex = item.subTrackIndex ?? 0;
              itemTop += subTrackIndex * currentSubTrackHeight;
              break;
            }
            itemTop += getMaxSubTracks(track?.id || '', itemsSnapshot) * currentSubTrackHeight;
          }
          itemTop += verticalScrollOffset;
          const itemBottom = itemTop + currentSubTrackHeight;

          const lineIntersectsItem =
            lineX >= itemLeft &&
            lineX <= itemRight &&
            itemBottom >= minY &&
            itemTop <= maxY;

          if (lineIntersectsItem) {
            crossedItemsSet.add(item.id);
          }
        });
      };

      const minY = Math.min(spliceDragState.startY, mouseY);
      const maxY = Math.max(spliceDragState.startY, mouseY);

      checkTracksForItems(minY, maxY);
      lastMousePosRef.current = { x: mouseX, y: mouseY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Do one final check to ensure we caught all items
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseY = e.clientY - rect.top;
        const lineX = spliceDragState.startX;
        const minY = Math.min(spliceDragState.startY, mouseY);
        const maxY = Math.max(spliceDragState.startY, mouseY);

        const timelineX = lineX - labelWidth;
        const timeMs = visibleStartMs + pxToMs(timelineX, pxPerMs);
        currentTimeMsRef.current = timeMs;

        itemsSnapshot.forEach((item) => {
          if (crossedItemsSet.has(item.id)) return;

          const itemLeft = labelWidth + msToPx(item.startMs - visibleStartMs, pxPerMs);
          const itemRight = labelWidth + msToPx(item.endMs - visibleStartMs, pxPerMs);

          let itemTop = rulerHeight;
          for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track?.id === item.trackId) {
              const subTrackIndex = item.subTrackIndex ?? 0;
              itemTop += subTrackIndex * currentSubTrackHeight;
              break;
            }
            itemTop += getMaxSubTracks(track?.id || '', itemsSnapshot) * currentSubTrackHeight;
          }
          itemTop += verticalScrollOffset;
          const itemBottom = itemTop + currentSubTrackHeight;

          const lineIntersectsItem =
            lineX >= itemLeft && lineX <= itemRight && itemBottom >= minY && itemTop <= maxY;

          if (lineIntersectsItem) {
            crossedItemsSet.add(item.id);
          }
        });
      }

      // Determine affected items
      let affectedItemIds: string[] = [];

      if (crossedItemsSet.size > 0) {
        affectedItemIds = Array.from(crossedItemsSet);
      } else if (selectedItemIds.size > 0) {
        affectedItemIds = Array.from(selectedItemIds);
      }

      if (affectedItemIds.length > 0) {
        const rawCutTimeMs = currentTimeMsRef.current;
        const cutTimeMs = snapToFrame(rawCutTimeMs, frameRate);

        const newItems = itemsSnapshot.flatMap((item) => {
          if (affectedItemIds.includes(item.id)) {
            const leftItem: TimelineItem = {
              ...item,
              id: `${item.id}-left-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              endMs: cutTimeMs,
            };
            const rightItem: TimelineItem = {
              ...item,
              id: `${item.id}-right-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              startMs: cutTimeMs,
            };
            return [leftItem, rightItem];
          }
          return [item];
        });

        const affectedTrackIds = new Set(
          itemsSnapshot
            .filter((item) => affectedItemIds.includes(item.id))
            .map((item) => item.trackId),
        );

        let updatedItems = newItems;
        affectedTrackIds.forEach((trackId) => {
          updatedItems = reassignTrackSubTracks(trackId, updatedItems);
        });

        addToHistory(itemsSnapshot, `Before splice (${affectedItemIds.length} items)`);
        onItemsChange?.(updatedItems);

        if (selectedItemIds.size > 0 && crossedItemsSet.size === 0) {
          setSelectedItemIds(new Set());
        }
      } else {
        // Fallback to single item under cursor
        const rect2 = containerRef.current?.getBoundingClientRect();
        if (!rect2) {
          setSpliceDragState(null);
          itemsSnapshotRef.current = [];
          return;
        }

        const mouseX = e.clientX - rect2.left;
        const mouseY = e.clientY - rect2.top;
        const timelineX = mouseX - labelWidth;
        const rawCutTimeMs = visibleStartMs + pxToMs(timelineX, pxPerMs);
        const cutTimeMs = snapToFrame(rawCutTimeMs, frameRate);

        let clickedItem: TimelineItem | null = null;
        for (const item of itemsSnapshot) {
          const itemLeft = labelWidth + msToPx(item.startMs - visibleStartMs, pxPerMs);
          const itemRight = labelWidth + msToPx(item.endMs - visibleStartMs, pxPerMs);

          let itemTop = rulerHeight;
          for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track?.id === item.trackId) {
              const subTrackIndex = item.subTrackIndex ?? 0;
              itemTop += subTrackIndex * currentSubTrackHeight;
              break;
            }
            itemTop += getMaxSubTracks(track?.id || '', itemsSnapshot) * currentSubTrackHeight;
          }
          itemTop += verticalScrollOffset;
          const itemBottom = itemTop + currentSubTrackHeight;

          if (
            mouseX >= itemLeft &&
            mouseX <= itemRight &&
            mouseY >= itemTop &&
            mouseY <= itemBottom &&
            cutTimeMs > item.startMs &&
            cutTimeMs < item.endMs
          ) {
            clickedItem = item;
            break;
          }
        }

        if (clickedItem) {
          addToHistory(itemsSnapshot, 'Before single splice');

          const newItems = itemsSnapshot.flatMap((item) => {
            if (item.id === clickedItem.id) {
              const leftItem: TimelineItem = {
                ...item,
                id: `${item.id}-left-${Date.now()}`,
                endMs: cutTimeMs,
              };
              const rightItem: TimelineItem = {
                ...item,
                id: `${item.id}-right-${Date.now()}`,
                startMs: cutTimeMs,
              };
              return [leftItem, rightItem];
            }
            return [item];
          });

          const updatedItems = reassignTrackSubTracks(clickedItem.trackId, newItems);
          onItemsChange?.(updatedItems);
        }
      }

      // Cleanup
      setSpliceDragState(null);
      itemsSnapshotRef.current = [];
      crossedItemsSetRef.current = new Set();
      lastMousePosRef.current = null;
      currentTimeMsRef.current = 0;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      itemsSnapshotRef.current = [];
    };
  }, [
    spliceDragState,
    items,
    onItemsChange,
    containerRef,
    visibleStartMs,
    pxPerMs,
    labelWidth,
    tracks,
    rulerHeight,
    currentSubTrackHeight,
    verticalScrollOffset,
    frameRate,
    selectedItemIds,
    setSpliceDragState,
    setSelectedItemIds,
    addToHistory,
  ]);
}
