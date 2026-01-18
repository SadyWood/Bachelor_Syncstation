// packages/timeline/src/hooks/interactions/useRulerClick.ts
import { useCallback } from 'react';
import { pxToMs, clamp, snapToFrame } from '../../core/utils';

export interface UseRulerClickOptions {
  visibleStartMs: number;
  pxPerMs: number;
  durationMs: number;
  frameRate: number;
  isDragging: boolean;
  onTimeChange?: ((timeMs: number) => void) | undefined;
}

export interface UseRulerClickReturn {
  handleRulerClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Handles ruler clicks for seeking playhead
 * - Converts click position to time
 * - Snaps to frame boundaries
 * - Updates current time
 * - Prevents seeking during drag operations
 *
 * @example
 * const { handleRulerClick } = useRulerClick({
 *   visibleStartMs: 0,
 *   pxPerMs: 0.5,
 *   durationMs: 60000,
 *   frameRate: 30,
 *   isDragging: false,
 *   onTimeChange: (timeMs) => setCurrentTime(timeMs),
 * });
 */
export function useRulerClick({
  visibleStartMs,
  pxPerMs,
  durationMs,
  frameRate,
  isDragging,
  onTimeChange,
}: UseRulerClickOptions): UseRulerClickReturn {
  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't seek if we just finished dragging something
      if (isDragging) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const timeMs = visibleStartMs + pxToMs(clickX, pxPerMs);
      const clampedTimeMs = clamp(timeMs, 0, durationMs);
      const snappedTimeMs = snapToFrame(clampedTimeMs, frameRate);

      onTimeChange?.(snappedTimeMs);
    },
    [isDragging, pxPerMs, durationMs, onTimeChange, visibleStartMs, frameRate],
  );

  return {
    handleRulerClick,
  };
}
