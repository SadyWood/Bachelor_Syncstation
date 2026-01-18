// packages/timeline/src/hooks/interactions/useTrackInteractions.ts
import { useCallback, type RefObject } from 'react';
import type { ToolType } from '../../core/models';
import type { SelectionBox } from '../tools/useSelectionBox';
import type { SpliceDragState } from '../tools/useSpliceTool';

export interface UseTrackInteractionsOptions {
  activeTool: ToolType;
  deleteMode: { isActive: boolean };
  containerRef: RefObject<HTMLDivElement | null>;
  startPan: (clientX: number, clientY: number) => void;
  setSpliceDragState: (
    state: SpliceDragState | null | ((prev: SpliceDragState | null) => SpliceDragState | null),
  ) => void;
  startDeleteMode: () => void;
  setSelectedItemIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setSelectionBox: (box: SelectionBox | null) => void;
}

export interface UseTrackInteractionsReturn {
  handleTrackMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Hook for managing track background interactions
 * Routes interactions to correct tool mode (pan, splice, delete, selection box)
 */
export function useTrackInteractions({
  activeTool,
  deleteMode,
  containerRef,
  startPan,
  setSpliceDragState,
  startDeleteMode,
  setSelectedItemIds,
  setSelectionBox,
}: UseTrackInteractionsOptions): UseTrackInteractionsReturn {
  const handleTrackMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Check if the click was on an item - if so, ignore this track handler
      const target = e.target as HTMLElement;
      if (target.classList.contains('timeline-item') || target.closest('.timeline-item')) {
        return; // Let item handler deal with it
      }

      // MIDDLE CLICK: Start pan mode (temporary override)
      if (e.button === 1) {
        e.preventDefault();
        startPan(e.clientX, e.clientY);
        return;
      }

      // PAN TOOL: Start pan on track background
      if (e.button === 0 && activeTool === 'pan') {
        startPan(e.clientX, e.clientY);
        return;
      }

      // SPLICE TOOL: Start splice drag
      if (e.button === 0 && activeTool === 'splice') {
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
        startDeleteMode();
      } else if (e.button === 0 && activeTool === 'select') {
        // LEFT CLICK: Deselect all or start selection box
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Always deselect when clicking empty space (unless Shift is held)
        if (!e.shiftKey) {
          setSelectedItemIds(new Set());
        }

        // Start selection box
        setSelectionBox({
          isActive: true,
          startX: e.clientX - rect.left,
          startY: e.clientY - rect.top,
          currentX: e.clientX - rect.left,
          currentY: e.clientY - rect.top,
          shiftHeld: e.shiftKey,
        });
      }
    },
    [
      activeTool,
      deleteMode,
      containerRef,
      startPan,
      setSpliceDragState,
      startDeleteMode,
      setSelectedItemIds,
      setSelectionBox,
    ],
  );

  return {
    handleTrackMouseDown,
  };
}
