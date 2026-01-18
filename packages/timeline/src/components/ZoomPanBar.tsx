// packages/timeline/src/components/ZoomPanBar.tsx
import React, { useRef, useState, useEffect } from 'react';
import './ZoomPanBar.css';

interface ZoomPanBarProps {
  /** Horizontal or vertical orientation */
  orientation: 'horizontal' | 'vertical';
  /** Current viewport start (0-1 normalized) */
  viewportStart: number;
  /** Current viewport end (0-1 normalized) */
  viewportEnd: number;
  /** Callback when viewport changes */
  onViewportChange: (start: number, end: number) => void;
  /** Callback for previous/next buttons */
  onStep?: (direction: -1 | 1) => void;
  /** Minimum viewport size (0-1 normalized) */
  minSize?: number;
}

type DragMode = 'move' | 'resize-start' | 'resize-end' | null;

export function ZoomPanBar({
  orientation,
  viewportStart,
  viewportEnd,
  onViewportChange,
  onStep,
  minSize = 0.01,
}: ZoomPanBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStartPos, setDragStartPos] = useState(0);
  const [dragStartViewport, setDragStartViewport] = useState({ start: 0, end: 0 });

  const isHorizontal = orientation === 'horizontal';

  const handleMouseDown = (e: React.MouseEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode(mode);
    setDragStartPos(isHorizontal ? e.clientX : e.clientY);
    setDragStartViewport({ start: viewportStart, end: viewportEnd });
  };

  useEffect(() => {
    if (!dragMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const size = isHorizontal ? rect.width : rect.height;
      const currentPos = isHorizontal ? e.clientX : e.clientY;
      const delta = (currentPos - dragStartPos) / size;

      let newStart = dragStartViewport.start;
      let newEnd = dragStartViewport.end;

      if (dragMode === 'move') {
        // Move entire viewport
        const viewportSize = dragStartViewport.end - dragStartViewport.start;
        newStart = Math.max(0, Math.min(1 - viewportSize, dragStartViewport.start + delta));
        newEnd = newStart + viewportSize;
      } else if (dragMode === 'resize-start') {
        // Resize left/top edge
        newStart = Math.max(
          0,
          Math.min(dragStartViewport.end - minSize, dragStartViewport.start + delta),
        );
      } else if (dragMode === 'resize-end') {
        // Resize right/bottom edge
        newEnd = Math.max(
          dragStartViewport.start + minSize,
          Math.min(1, dragStartViewport.end + delta),
        );
      }

      onViewportChange(newStart, newEnd);
    };

    const handleMouseUp = () => {
      setDragMode(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, dragStartPos, dragStartViewport, isHorizontal, minSize, onViewportChange]);

  const viewportSize = viewportEnd - viewportStart;
  const viewportSizePercent = viewportSize * 100;
  const viewportStartPercent = viewportStart * 100;

  const containerStyle: React.CSSProperties = isHorizontal
    ? { width: '100%', height: '24px', flexDirection: 'row' }
    : { width: '24px', height: '100%', flexDirection: 'column' };

  const trackStyle: React.CSSProperties = isHorizontal
    ? { width: '100%', height: '100%' }
    : { width: '100%', height: '100%' };

  const handleStyle: React.CSSProperties = isHorizontal
    ? {
      left: `${viewportStartPercent}%`,
      width: `${viewportSizePercent}%`,
      height: '100%',
    }
    : {
      top: `${viewportStartPercent}%`,
      height: `${viewportSizePercent}%`,
      width: '100%',
    };

  return (
    <div className={`zoom-pan-bar zoom-pan-bar--${orientation}`} style={containerStyle}>
      {/* Previous button */}
      {onStep && (
        <button
          className="zoom-pan-bar__arrow"
          onClick={() => onStep(-1)}
          title={isHorizontal ? 'Pan Left' : 'Pan Up'}
        >
          {isHorizontal ? '◀' : '▲'}
        </button>
      )}

      {/* Track */}
      <div ref={containerRef} className="zoom-pan-bar__track" style={trackStyle}>
        {/* Viewport handle */}
        <div
          className={`zoom-pan-bar__handle ${dragMode ? 'zoom-pan-bar__handle--dragging' : ''}`}
          style={handleStyle}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
          {/* Resize handles */}
          <div
            className="zoom-pan-bar__resize zoom-pan-bar__resize--start"
            onMouseDown={(e) => handleMouseDown(e, 'resize-start')}
            title={isHorizontal ? 'Resize Left' : 'Resize Top'}
          />
          <div
            className="zoom-pan-bar__resize zoom-pan-bar__resize--end"
            onMouseDown={(e) => handleMouseDown(e, 'resize-end')}
            title={isHorizontal ? 'Resize Right' : 'Resize Bottom'}
          />
        </div>
      </div>

      {/* Next button */}
      {onStep && (
        <button
          className="zoom-pan-bar__arrow"
          onClick={() => onStep(1)}
          title={isHorizontal ? 'Pan Right' : 'Pan Down'}
        >
          {isHorizontal ? '▶' : '▼'}
        </button>
      )}
    </div>
  );
}
