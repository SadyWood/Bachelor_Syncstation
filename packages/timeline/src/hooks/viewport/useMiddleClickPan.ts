// packages/timeline/src/hooks/viewport/useMiddleClickPan.ts
import { useState, useEffect, useCallback, type RefObject } from 'react';

export interface MiddleClickPanState {
  isPanning: boolean;
  startX: number;
  startY: number;
  startHorizontalView: { start: number; end: number };
  startVerticalView: { start: number; end: number };
}

export interface UseMiddleClickPanOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  horizontalView: { start: number; end: number };
  verticalView: { start: number; end: number };
  setHorizontalView: (view: { start: number; end: number }) => void;
  setVerticalView: (view: { start: number; end: number }) => void;
  onTemporaryToolChange?: ((tool: 'pan' | null) => void) | undefined;
}

export interface UseMiddleClickPanReturn {
  middleClickPanState: MiddleClickPanState | null;
  startPan: (clientX: number, clientY: number) => void;
}

/**
 * Hook for managing middle-click pan functionality
 * Handles mouse move/up during pan and updates viewport
 */
export function useMiddleClickPan({
  containerRef,
  horizontalView,
  verticalView,
  setHorizontalView,
  setVerticalView,
  onTemporaryToolChange,
}: UseMiddleClickPanOptions): UseMiddleClickPanReturn {
  const [middleClickPanState, setMiddleClickPanState] = useState<MiddleClickPanState | null>(null);

  // Start pan operation
  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      setMiddleClickPanState({
        isPanning: true,
        startX: clientX,
        startY: clientY,
        startHorizontalView: horizontalView,
        startVerticalView: verticalView,
      });
    },
    [horizontalView, verticalView],
  );

  // Notify parent when temporary tool (middle-click pan) changes
  useEffect(() => {
    if (middleClickPanState) {
      onTemporaryToolChange?.('pan');
    } else {
      onTemporaryToolChange?.(null);
    }
  }, [middleClickPanState, onTemporaryToolChange]);

  // Middle-click pan handler
  useEffect(() => {
    if (!middleClickPanState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const deltaX = e.clientX - middleClickPanState.startX;
      const deltaY = e.clientY - middleClickPanState.startY;

      // Convert pixel deltas to normalized view deltas
      const horizontalRange =
        middleClickPanState.startHorizontalView.end - middleClickPanState.startHorizontalView.start;
      const horizontalDelta = -(deltaX / rect.width) * horizontalRange;

      let newHStart = middleClickPanState.startHorizontalView.start + horizontalDelta;
      let newHEnd = middleClickPanState.startHorizontalView.end + horizontalDelta;

      // Clamp horizontal
      if (newHStart < 0) {
        newHStart = 0;
        newHEnd = horizontalRange;
      } else if (newHEnd > 1) {
        newHEnd = 1;
        newHStart = 1 - horizontalRange;
      }

      setHorizontalView({ start: newHStart, end: newHEnd });

      // Vertical: move in opposite direction of mouse (natural panning)
      const verticalRange =
        middleClickPanState.startVerticalView.end - middleClickPanState.startVerticalView.start;
      const verticalDelta = -(deltaY / rect.height) * verticalRange;

      let newVStart = middleClickPanState.startVerticalView.start + verticalDelta;
      let newVEnd = middleClickPanState.startVerticalView.end + verticalDelta;

      // Clamp vertical
      if (newVStart < 0) {
        newVStart = 0;
        newVEnd = verticalRange;
      } else if (newVEnd > 1) {
        newVEnd = 1;
        newVStart = 1 - verticalRange;
      }

      setVerticalView({ start: newVStart, end: newVEnd });
    };

    const handleMouseUp = () => {
      setMiddleClickPanState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [middleClickPanState, containerRef, setHorizontalView, setVerticalView]);

  return {
    middleClickPanState,
    startPan,
  };
}
