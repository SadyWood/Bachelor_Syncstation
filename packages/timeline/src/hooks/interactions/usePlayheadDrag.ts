// packages/timeline/src/hooks/interactions/usePlayheadDrag.ts
import { useState, useCallback, useEffect, type RefObject } from 'react';
import { pxToMs, clamp, snapToFrame } from '../../core/utils';

export interface UsePlayheadDragOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  labelWidth: number;
  visibleStartMs: number;
  pxPerMs: number;
  durationMs: number;
  frameRate: number;
  onTimeChange?: ((timeMs: number) => void) | undefined;
}

export interface UsePlayheadDragReturn {
  playheadDragState: { isDragging: boolean; startX: number } | null;
  handlePlayheadMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Hook for managing playhead drag behavior
 * Handles dragging the playhead to seek through the timeline
 */
export function usePlayheadDrag({
  containerRef,
  labelWidth,
  visibleStartMs,
  pxPerMs,
  durationMs,
  frameRate,
  onTimeChange,
}: UsePlayheadDragOptions): UsePlayheadDragReturn {
  const [playheadDragState, setPlayheadDragState] = useState<{
    isDragging: boolean;
    startX: number;
  } | null>(null);

  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPlayheadDragState({ isDragging: true, startX: e.clientX });
  }, []);

  useEffect(() => {
    if (!playheadDragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left - labelWidth;
      const timeMs = visibleStartMs + pxToMs(clickX, pxPerMs);
      const clampedTimeMs = clamp(timeMs, 0, durationMs);

      onTimeChange?.(clampedTimeMs);
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Snap to nearest frame when releasing playhead
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const clickX = e.clientX - rect.left - labelWidth;
        const timeMs = visibleStartMs + pxToMs(clickX, pxPerMs);
        const clampedTimeMs = clamp(timeMs, 0, durationMs);
        const snappedTimeMs = snapToFrame(clampedTimeMs, frameRate);
        onTimeChange?.(snappedTimeMs);
      }
      setPlayheadDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    playheadDragState,
    containerRef,
    labelWidth,
    pxPerMs,
    durationMs,
    onTimeChange,
    visibleStartMs,
    frameRate,
  ]);

  return {
    playheadDragState,
    handlePlayheadMouseDown,
  };
}
