// packages/timeline/src/hooks/viewport/useTimelineViewport.ts
import { useMemo } from 'react';

export interface UseTimelineViewportOptions {
  horizontalView: { start: number; end: number };
  durationMs: number;
  width: number;
  height: number;
  labelWidth: number;
  rulerHeight: number;
  scrollbarSize: number;
}

export interface UseTimelineViewportReturn {
  visibleStartMs: number;
  visibleEndMs: number;
  visibleDurationMs: number;
  contentWidth: number;
  contentHeight: number;
  pxPerMs: number;
}

/**
 * Computes timeline viewport dimensions and visible time range
 * - Calculates visible time range based on horizontal view
 * - Computes content dimensions (excluding UI chrome)
 * - Calculates pixel-per-millisecond ratio for coordinate conversion
 *
 * @example
 * const { visibleStartMs, visibleEndMs, pxPerMs, contentWidth, contentHeight } = useTimelineViewport({
 *   horizontalView: { start: 0, end: 1 },
 *   durationMs: 60000,
 *   width: 1200,
 *   height: 600,
 *   labelWidth: 150,
 *   rulerHeight: 40,
 *   scrollbarSize: 14,
 * });
 */
export function useTimelineViewport({
  horizontalView,
  durationMs,
  width,
  height,
  labelWidth,
  rulerHeight,
  scrollbarSize,
}: UseTimelineViewportOptions): UseTimelineViewportReturn {
  return useMemo(() => {
    // Calculate visible range based on zoom/pan
    const visibleStartMs = horizontalView.start * durationMs;
    const visibleEndMs = horizontalView.end * durationMs;
    const visibleDurationMs = visibleEndMs - visibleStartMs;

    // Content dimensions (excluding scrollbars and UI chrome)
    const contentWidth = width - labelWidth - scrollbarSize;
    const contentHeight = height - rulerHeight - scrollbarSize;

    // Calculate pixel-per-millisecond ratio
    const pxPerMs = contentWidth / visibleDurationMs;

    return {
      visibleStartMs,
      visibleEndMs,
      visibleDurationMs,
      contentWidth,
      contentHeight,
      pxPerMs,
    };
  }, [horizontalView, durationMs, width, height, labelWidth, rulerHeight, scrollbarSize]);
}
