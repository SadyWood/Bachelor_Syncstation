// packages/timeline/src/hooks/interactions/useItemInteractions.ts
import { useCallback, type RefObject } from 'react';
import type { TimelineItem, ToolType } from '../../core/models';
import type { DeleteModeState } from '../tools/useDeleteMode';
import type { SpliceDragState } from '../tools/useSpliceTool';

export interface UseItemInteractionsOptions {
  activeTool: ToolType;
  items: TimelineItem[];
  containerRef: RefObject<HTMLDivElement | null>;
  deleteMode: DeleteModeState;
  selectedItemIds: Set<string>;
  startPan: (clientX: number, clientY: number) => void;
  setSpliceDragState: (
    state: SpliceDragState | null | ((prev: SpliceDragState | null) => SpliceDragState | null),
  ) => void;
  startDeleteMode: (itemId: string) => void;
  setSelectedItemIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  handleDragStart: (
    item: TimelineItem,
    mode: 'move' | 'resize-start' | 'resize-end',
    clientX: number,
    itemsToDrag?: Array<{ id: string; startMs: number; endMs: number }>,
  ) => void;
}

export interface UseItemInteractionsReturn {
  handleItemMouseDown: (
    e: React.MouseEvent,
    item: TimelineItem,
    mode: 'move' | 'resize-start' | 'resize-end',
  ) => void;
}

/**
 * Hook for managing item mouse interactions
 * Routes interactions to correct tool mode (pan, splice, delete, select, drag)
 */
export function useItemInteractions({
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
}: UseItemInteractionsOptions): UseItemInteractionsReturn {
  const handleItemMouseDown = useCallback(
    (e: React.MouseEvent, item: TimelineItem, mode: 'move' | 'resize-start' | 'resize-end') => {
      e.preventDefault();
      e.stopPropagation();

      // MIDDLE CLICK: Start pan mode (temporary override of current tool)
      if (e.button === 1) {
        e.preventDefault();
        startPan(e.clientX, e.clientY);
        return;
      }

      // PAN TOOL: Start pan on item
      if (activeTool === 'pan') {
        startPan(e.clientX, e.clientY);
        return;
      }

      // SPLICE TOOL: Start splice drag on item (same as track background)
      if (activeTool === 'splice') {
        e.stopPropagation();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setSpliceDragState({
          isActive: true,
          startX: mouseX,
          currentX: mouseX,
          startY: mouseY,
          currentY: mouseY,
        });
        return;
      }

      // RIGHT CLICK: Enter delete mode (only in select mode)
      if (e.button === 2 && activeTool === 'select' && !deleteMode.isActive) {
        startDeleteMode(item.id);
        return;
      }

      // SELECT TOOL: Handle selection and drag
      if (mode === 'move') {
        // Handle selection logic
        if (e.shiftKey) {
          // Shift+Click: Add to selection
          const newSelection = new Set(selectedItemIds);
          if (newSelection.has(item.id)) {
            newSelection.delete(item.id);
          } else {
            newSelection.add(item.id);
          }
          setSelectedItemIds(newSelection);
        } else if (!selectedItemIds.has(item.id)) {
          // Regular click on unselected item: Select only this item
          setSelectedItemIds(new Set([item.id]));
        }
        // If clicking on already selected item without Shift, keep current selection
      }

      // Start drag operation
      const itemsToDrag =
        selectedItemIds.has(item.id) && selectedItemIds.size > 1
          ? (Array.from(selectedItemIds)
            .map((id) => {
              const foundItem = items.find((i) => i.id === id);
              return foundItem
                ? { id: foundItem.id, startMs: foundItem.startMs, endMs: foundItem.endMs }
                : null;
            })
            .filter(Boolean) as Array<{ id: string; startMs: number; endMs: number }>)
          : undefined;

      // Call handleDragStart from useItemDrag hook
      handleDragStart(item, mode, e.clientX, itemsToDrag);
    },
    [
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
    ],
  );

  return {
    handleItemMouseDown,
  };
}
