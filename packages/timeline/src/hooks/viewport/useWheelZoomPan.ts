// packages/timeline/src/hooks/viewport/useWheelZoomPan.ts
import { useCallback, useEffect, type RefObject } from 'react';

export interface UseWheelZoomPanOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  horizontalView: { start: number; end: number };
  verticalView: { start: number; end: number };
  verticalZoom: number;
  totalTracksHeight: number;
  contentHeight: number;
  currentSubTrackHeight: number;
  setHorizontalView: (view: { start: number; end: number }) => void;
  setVerticalView: (view: { start: number; end: number }) => void;
  setVerticalZoom: (zoom: number) => void;
}

/**
 * Hook for managing wheel-based zoom and pan
 * Handles Ctrl+Scroll (vertical zoom), Alt+Scroll (horizontal zoom),
 * Shift+Scroll (horizontal pan), and Normal Scroll (vertical pan)
 */
export function useWheelZoomPan({
  containerRef,
  horizontalView,
  verticalView,
  verticalZoom,
  totalTracksHeight,
  contentHeight,
  currentSubTrackHeight,
  setHorizontalView,
  setVerticalView,
  setVerticalZoom,
}: UseWheelZoomPanOptions): void {
  // Scroll and zoom with mouse wheel
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const scrollAmount = e.deltaY;
      const scrollSpeed = 0.0003;

      if (e.ctrlKey || e.metaKey) {
        // Ctrl + Scroll: Vertical zoom (track height)
        const zoomFactor = scrollAmount > 0 ? 0.95 : 1.05;
        const newZoom = Math.min(3.0, Math.max(0.5, verticalZoom * zoomFactor));
        setVerticalZoom(newZoom);
      } else if (e.altKey) {
        // Alt + Scroll: Horizontal zoom
        const zoomFactor = scrollAmount > 0 ? 1.05 : 0.95;
        const currentRange = horizontalView.end - horizontalView.start;
        const minRange = 0.00005;
        const newRange = Math.min(1, Math.max(minRange, currentRange * zoomFactor));

        // Zoom towards center
        const center = (horizontalView.start + horizontalView.end) / 2;
        const newStart = Math.max(0, center - (newRange / 2));
        const newEnd = Math.min(1, newStart + newRange);

        setHorizontalView({ start: newStart, end: newEnd });
      } else if (e.shiftKey) {
        // Shift + Scroll: Horizontal scroll
        const range = horizontalView.end - horizontalView.start;
        const zoomFactor = Math.max(0.1, range);
        const adjustedScrollSpeed = scrollSpeed * zoomFactor * 2;
        const delta = scrollAmount * adjustedScrollSpeed;

        let newStart = horizontalView.start + delta;
        let newEnd = horizontalView.end + delta;

        // Clamp to bounds
        if (newStart < 0) {
          newStart = 0;
          newEnd = range;
        } else if (newEnd > 1) {
          newEnd = 1;
          newStart = 1 - range;
        }

        setHorizontalView({ start: newStart, end: newEnd });
      } else {
        // Normal scroll: Vertical scroll
        const scrollBufferHeight = currentSubTrackHeight * 0.5;
        const scrollableHeight = totalTracksHeight + scrollBufferHeight;
        const viewportToContentRatio = scrollableHeight > 0 ? contentHeight / scrollableHeight : 1;
        const maxRange = Math.min(1, viewportToContentRatio);

        const range = verticalView.end - verticalView.start;
        const delta = scrollAmount * scrollSpeed * 1.5;

        let newStart = verticalView.start + delta;
        let newEnd = verticalView.end + delta;

        // Clamp to bounds
        if (newStart < 0) {
          newStart = 0;
          newEnd = Math.min(1, newStart + range);
        } else if (newEnd > 1) {
          newEnd = 1;
          newStart = Math.max(0, newEnd - range);
        }

        // Ensure the range doesn't exceed what can fit in the viewport
        if (newEnd - newStart > maxRange) {
          newEnd = newStart + maxRange;
        }

        setVerticalView({ start: newStart, end: newEnd });
      }
    },
    [
      horizontalView,
      verticalView,
      verticalZoom,
      totalTracksHeight,
      contentHeight,
      currentSubTrackHeight,
      setHorizontalView,
      setVerticalView,
      setVerticalZoom,
    ],
  );

  // Attach wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [containerRef, handleWheel]);
}
