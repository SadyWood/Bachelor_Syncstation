// packages/timeline/src/components/overlays/Playhead.tsx
import React from 'react';
import { msToPx } from '../../core/utils';

export interface PlayheadProps {
  currentTimeMs: number;
  visibleStartMs: number;
  visibleEndMs: number;
  pxPerMs: number;
  labelWidth: number;
  rulerHeight: number;
  contentHeight: number;
  isDragging: boolean;
  isPanning: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Renders the red playhead indicator
 * - Circular head at top in ruler area
 * - Vertical line extending through tracks
 * - Draggable for seeking
 * - Smooth animation when playing, instant during drag/pan
 *
 * @example
 * <Playhead
 *   currentTimeMs={5000}
 *   visibleStartMs={0}
 *   visibleEndMs={60000}
 *   pxPerMs={0.5}
 *   labelWidth={150}
 *   rulerHeight={40}
 *   contentHeight={500}
 *   isDragging={false}
 *   isPanning={false}
 *   onMouseDown={handlePlayheadMouseDown}
 * />
 */
export const Playhead: React.FC<PlayheadProps> = ({
  currentTimeMs,
  visibleStartMs,
  visibleEndMs,
  pxPerMs,
  labelWidth,
  rulerHeight,
  contentHeight,
  isDragging,
  isPanning,
  onMouseDown,
}) => {
  // Only render if playhead is visible
  if (currentTimeMs < visibleStartMs || currentTimeMs > visibleEndMs) {
    return null;
  }

  return (
    <div
      className="timeline-playhead"
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: labelWidth + msToPx(currentTimeMs - visibleStartMs, pxPerMs) - 6,
        top: 0,
        height: rulerHeight + contentHeight,
        width: '14px',
        cursor: 'ew-resize',
        pointerEvents: 'auto',
        zIndex: 200,
        transition: isDragging || isPanning ? 'none' : 'left 0.05s linear',
      }}
    >
      {/* Circular head at top (in ruler area) */}
      <div
        className="timeline-playhead-head"
        style={{
          position: 'absolute',
          left: '50%',
          top: '4px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff5555, #ff3333)',
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
          cursor: 'ew-resize',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
        }}
      />

      {/* Visual line with glow */}
      <div
        style={{
          position: 'absolute',
          left: '6px',
          top: '20px',
          bottom: 0,
          width: '2px',
          background: '#ff4444',
          pointerEvents: 'none',
          boxShadow: '0 0 6px rgba(255, 68, 68, 0.8), 0 0 12px rgba(255, 68, 68, 0.4)',
        }}
      />
    </div>
  );
};
