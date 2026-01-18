// packages/timeline/src/ZoomPanScrollbar.tsx
import React, { useRef, useState, useCallback } from 'react';
import { debugLog } from './core/debug';

/**
 * Gets background color for the scrollbar thumb
 */
function getThumbBackground(
  isZooming: boolean,
  isActive: boolean,
): string {
  if (isZooming) return 'var(--timeline-status-warning)';
  if (isActive) return 'var(--timeline-accent-primary-hover)';
  return 'var(--timeline-accent-primary)';
}

/**
 * Gets handle background color
 */
function getHandleBackground(
  isZooming: boolean,
  isActive: boolean,
): string {
  if (isZooming) return 'rgba(245, 158, 11, 0.8)';
  if (isActive) return 'rgba(255, 255, 255, 0.5)';
  return 'rgba(255, 255, 255, 0.3)';
}

interface ZoomPanScrollbarProps {
  orientation: 'horizontal' | 'vertical';
  viewStart: number; // 0-1 range
  viewEnd: number; // 0-1 range
  onViewChange: (start: number, end: number) => void;
  onZoomChange?: (zoomLevel: number) => void; // NEW: For vertical zoom (optional)
  currentZoom?: number; // NEW: Current zoom level (for display)
  size?: number; // width for vertical, height for horizontal
}

export function ZoomPanScrollbar({
  orientation,
  viewStart,
  viewEnd,
  onViewChange,
  onZoomChange,
  currentZoom = 1.0,
  size = 20,
}: ZoomPanScrollbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    mode: 'pan' | 'resize-start' | 'resize-end' | 'zoom'; // NEW: Added 'zoom' mode
    startPos: number;
    startViewStart: number;
    startViewEnd: number;
    startZoom?: number | undefined; // NEW: For zoom mode
  } | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const isHorizontal = orientation === 'horizontal';
  const isVertical = orientation === 'vertical';

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: 'pan' | 'resize-start' | 'resize-end') => {
      e.preventDefault();
      e.stopPropagation();

      // NEW: For vertical scrollbar with zoom support, resize handles = zoom instead of resize view
      const actualMode =
        isVertical && onZoomChange && (mode === 'resize-start' || mode === 'resize-end')
          ? 'zoom'
          : mode;

      setDragState({
        mode: actualMode,
        startPos: isHorizontal ? e.clientX : e.clientY,
        startViewStart: viewStart,
        startViewEnd: viewEnd,
        startZoom: actualMode === 'zoom' ? currentZoom : undefined,
      });
    },
    [isHorizontal, isVertical, viewStart, viewEnd, currentZoom, onZoomChange],
  );

  React.useEffect(() => {
    if (!dragState || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const containerSize = isHorizontal ? rect.width : rect.height;
      const currentPos = isHorizontal ? e.clientX : e.clientY;
      const delta = (currentPos - dragState.startPos) / containerSize;

      let newStart = dragState.startViewStart;
      let newEnd = dragState.startViewEnd;

      if (dragState.mode === 'zoom') {
        // NEW: Zoom mode - adjust view size based on zoom level
        // Drag up = zoom in (smaller view), drag down = zoom out (larger view)
        const zoomDelta = -delta * 3; // Sensitivity multiplier (3x for good feel)
        const zoomFactor = Math.exp(zoomDelta); // Exponential zoom for smooth feel
        const startZoom = dragState.startZoom ?? 1.0;
        const newZoom = clamp(startZoom * zoomFactor, 0.4, 3.0);

        debugLog('layout', 'Zoom mode drag', {
          delta,
          zoomDelta,
          zoomFactor,
          oldZoom: dragState.startZoom,
          newZoom,
        });

        if (onZoomChange) {
          onZoomChange(newZoom);
        }

        // NEW: Also adjust view size - higher zoom = smaller view (see less of timeline)
        // The view size should be inversely proportional to zoom
        const baseViewSize = 0.6; // Base size at 100% zoom
        const newViewSize = clamp(baseViewSize / newZoom, 0.1, 1.0);

        // Keep center of view stable while zooming
        const viewCenter = (dragState.startViewStart + dragState.startViewEnd) / 2;
        newStart = clamp(viewCenter - (newViewSize / 2), 0, 1 - newViewSize);
        newEnd = newStart + newViewSize;

        debugLog('layout', 'View adjusted', { newZoom, newViewSize, newStart, newEnd });

        onViewChange(newStart, newEnd);
        return;
      } if (dragState.mode === 'pan') {
        // Pan: move both start and end
        newStart = clamp(dragState.startViewStart + delta, 0, 1 - (viewEnd - viewStart));
        newEnd = newStart + (viewEnd - viewStart);
      } else if (dragState.mode === 'resize-start') {
        // Resize from start (left/top edge)
        newStart = clamp(dragState.startViewStart + delta, 0, dragState.startViewEnd - 0.05);
      } else if (dragState.mode === 'resize-end') {
        // Resize from end (right/bottom edge)
        newEnd = clamp(dragState.startViewEnd + delta, dragState.startViewStart + 0.05, 1);
      }

      onViewChange(newStart, newEnd);
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, isHorizontal, onViewChange, onZoomChange, viewEnd, viewStart]);

  // NEW: Mouse wheel for zoom (vertical scrollbar only)
  React.useEffect(() => {
    if (!isVertical || !onZoomChange || !containerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; // Scroll down = zoom out, up = zoom in
      const newZoom = clamp(currentZoom * zoomFactor, 0.4, 3.0);

      debugLog('layout', 'Wheel zoom', {
        deltaY: e.deltaY,
        zoomFactor,
        oldZoom: currentZoom,
        newZoom,
      });

      onZoomChange(newZoom);

      // NEW: Also adjust view size
      const baseViewSize = 0.6; // Base size at 100% zoom
      const newViewSize = clamp(baseViewSize / newZoom, 0.1, 1.0);

      // Keep center of view stable
      const viewCenter = (viewStart + viewEnd) / 2;
      const newStart = clamp(viewCenter - (newViewSize / 2), 0, 1 - newViewSize);
      const newEnd = newStart + newViewSize;

      onViewChange(newStart, newEnd);
    };

    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isVertical, onZoomChange, currentZoom, viewStart, viewEnd, onViewChange]);

  const viewSize = viewEnd - viewStart;

  // NEW: Determine cursor based on mode and state
  const getCursor = () => {
    if (dragState?.mode === 'zoom') return 'ns-resize';
    return 'grab';
  };

  const containerStyle: React.CSSProperties = isHorizontal
    ? {
      width: '100%',
      height: size,
      position: 'relative',
      background: 'var(--timeline-bg-secondary)',
      borderTop: '1px solid var(--timeline-border-primary)',
      cursor: 'default',
      boxSizing: 'border-box',
    }
    : {
      width: size,
      height: '100%',
      position: 'relative',
      background: 'var(--timeline-bg-secondary)',
      borderLeft: '1px solid var(--timeline-border-primary)',
      cursor: 'default',
      boxSizing: 'border-box',
    };

  const thumbStyle: React.CSSProperties = isHorizontal
    ? {
      position: 'absolute',
      left: `${viewStart * 100}%`,
      width: `${viewSize * 100}%`,
      height: '100%',
      background:
          isHovering || dragState
            ? 'var(--timeline-accent-primary-hover)'
            : 'var(--timeline-accent-primary)',
      border: '1px solid var(--timeline-border-tertiary)',
      cursor: dragState?.mode === 'zoom' ? 'ns-resize' : getCursor(),
      boxSizing: 'border-box',
      transition: dragState ? 'none' : 'background 0.15s ease',
      borderRadius: '3px',
    }
    : {
      position: 'absolute',
      top: `${viewStart * 100}%`,
      height: `${viewSize * 100}%`,
      width: '100%',
      background: getThumbBackground(
        dragState?.mode === 'zoom',
        isHovering || Boolean(dragState),
      ),
      border:
          dragState?.mode === 'zoom'
            ? '1px solid var(--timeline-status-warning)'
            : '1px solid var(--timeline-border-tertiary)',
      cursor: dragState?.mode === 'zoom' ? 'ns-resize' : getCursor(),
      boxSizing: 'border-box',
      transition: dragState ? 'none' : 'background 0.15s ease',
      borderRadius: '3px',
    };

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    background: 'rgba(255, 255, 255, 0.3)',
    zIndex: 2,
  };

  const startHandleStyle: React.CSSProperties = isHorizontal
    ? {
      ...handleStyle,
      left: 0,
      top: 0,
      width: '6px',
      height: '100%',
      cursor: 'ew-resize',
      background:
          isHovering || dragState ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)',
      borderRadius: '3px 0 0 3px',
    }
    : {
      ...handleStyle,
      top: 0,
      left: 0,
      width: '100%',
      height: '6px',
      cursor: 'ns-resize',
      background: getHandleBackground(
        dragState?.mode === 'zoom',
        isHovering || Boolean(dragState),
      ),
      borderRadius: '3px 3px 0 0',
    };

  const endHandleStyle: React.CSSProperties = isHorizontal
    ? {
      ...handleStyle,
      right: 0,
      top: 0,
      width: '6px',
      height: '100%',
      cursor: 'ew-resize',
      background: getHandleBackground(false, isHovering || Boolean(dragState)),
      borderRadius: '0 3px 3px 0',
    }
    : {
      ...handleStyle,
      bottom: 0,
      left: 0,
      width: '100%',
      height: '6px',
      cursor: 'ns-resize',
      background: getHandleBackground(
        dragState?.mode === 'zoom',
        isHovering || Boolean(dragState),
      ),
      borderRadius: '0 0 3px 3px',
    };

  return (
    <div ref={containerRef} style={containerStyle}>
      <div
        style={thumbStyle}
        onMouseDown={(e) => handleMouseDown(e, 'pan')}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          style={startHandleStyle}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown(e, 'resize-start');
          }}
        />

        <div
          style={endHandleStyle}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown(e, 'resize-end');
          }}
        />
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
