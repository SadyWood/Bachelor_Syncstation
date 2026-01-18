// packages/timeline/src/components/layout/RulerMarks.tsx
import React from 'react';
import { msToPx, formatTime } from '../../core/utils';

export interface RulerMarksProps {
  visibleStartMs: number;
  visibleEndMs: number;
  pxPerMs: number;
  width: number;
  frameRate: number;
}

/**
 * Renders adaptive ruler tick marks based on zoom level
 * - Switches between frame mode and time mode automatically
 * - Generates major/minor marks with labels
 * - Adaptive interval based on zoom level
 *
 * @example
 * <RulerMarks
 *   visibleStartMs={0}
 *   visibleEndMs={60000}
 *   pxPerMs={0.5}
 *   width={1000}
 *   frameRate={30}
 * />
 */
export const RulerMarks = React.memo<RulerMarksProps>(
  ({ visibleStartMs, visibleEndMs, pxPerMs, width, frameRate = 30 }) => {
    const marks: React.ReactNode[] = [];

    // Determine interval based on zoom level
    let intervalMs = 1000; // Default 1 second
    let showFrames = false;
    const pxPerSecond = pxPerMs * 1000;
    const pxPerFrame = pxPerMs * (1000 / frameRate);

    // Adaptive interval based on zoom level
    if (pxPerSecond < 10) {
      intervalMs = 60000; // 1 minute
    } else if (pxPerSecond < 20) {
      intervalMs = 10000; // 10 seconds
    } else if (pxPerSecond < 50) {
      intervalMs = 5000; // 5 seconds
    } else if (pxPerSecond < 100) {
      intervalMs = 1000; // 1 second
    } else if (pxPerFrame >= 10) {
      // Show frames when each frame is >= 10px wide
      showFrames = true;
      intervalMs = 1000 / frameRate;
    } else if (pxPerSecond < 500) {
      intervalMs = 100; // 100ms
    } else if (pxPerSecond >= 500) {
      intervalMs = 10; // 10ms for very high zoom
    }

    // Start from first interval that's visible
    const startTime = Math.floor(visibleStartMs / intervalMs) * intervalMs;

    for (let timeMs = startTime; timeMs <= visibleEndMs; timeMs += intervalMs) {
      const x = msToPx(timeMs - visibleStartMs, pxPerMs);
      if (x < -50 || x > width + 50) continue; // Skip marks way off screen

      let isMajor = false;
      let labelText = '';

      if (showFrames) {
        // In frame mode: show frame numbers
        const totalFrameNumber = Math.round(timeMs / (1000 / frameRate));
        const frameInSecond = (totalFrameNumber % frameRate) + 1; // 1-based
        const secondNumber = Math.floor(timeMs / 1000);

        isMajor = frameInSecond === 1; // First frame of each second is major

        // Adaptive labeling based on space per frame
        if (isMajor) {
          labelText = `${formatTime(secondNumber * 1000)} f${frameInSecond}`;
        } else if (pxPerFrame >= 50) {
          labelText = `f${frameInSecond}`;
        } else if (pxPerFrame >= 30 && frameInSecond % 2 === 0) {
          labelText = `f${frameInSecond}`;
        } else if (pxPerFrame >= 20 && frameInSecond % 5 === 0) {
          labelText = `f${frameInSecond}`;
        } else if (pxPerFrame >= 15 && frameInSecond % 10 === 0) {
          labelText = `f${frameInSecond}`;
        }
      } else {
        // In time mode: show time stamps
        isMajor = timeMs % (intervalMs * 5) === 0;
        if (isMajor) {
          labelText = formatTime(timeMs);
        }
      }

      marks.push(
        <div
          key={timeMs}
          className={`ruler-mark ${isMajor ? 'major' : 'minor'}`}
          style={{ left: x }}
        >
          {labelText && <span className="ruler-time">{labelText}</span>}
        </div>,
      );
    }

    return marks;
  },
  (prevProps, nextProps) =>
    // Only re-render if visible range, pxPerMs, or frameRate changed
    (
      prevProps.visibleStartMs === nextProps.visibleStartMs &&
      prevProps.visibleEndMs === nextProps.visibleEndMs &&
      prevProps.pxPerMs === nextProps.pxPerMs &&
      prevProps.frameRate === nextProps.frameRate &&
      prevProps.width === nextProps.width
    ),

);

RulerMarks.displayName = 'RulerMarks';
