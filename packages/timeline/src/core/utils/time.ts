// packages/timeline/src/utils/time.ts

import { debugWarn } from '../debug';

/**
 * Convert milliseconds to pixels based on scale
 * @param ms Time in milliseconds
 * @param pxPerMs Pixels per millisecond scale factor
 * @returns Pixel position
 */
export function msToPx(ms: number, pxPerMs: number): number {
  // Defensive checks
  if (!isFinite(ms) || !isFinite(pxPerMs)) {
    debugWarn('layout', 'msToPx invalid input', { ms, pxPerMs });
    return 0;
  }
  if (pxPerMs <= 0) {
    debugWarn('layout', 'msToPx pxPerMs should be > 0', pxPerMs);
    return 0;
  }
  return ms * pxPerMs;
}

/**
 * Convert pixels to milliseconds based on scale
 * @param px Pixel position
 * @param pxPerMs Pixels per millisecond scale factor
 * @returns Time in milliseconds
 */
export function pxToMs(px: number, pxPerMs: number): number {
  // Defensive checks
  if (!isFinite(px) || !isFinite(pxPerMs)) {
    debugWarn('layout', 'pxToMs invalid input', { px, pxPerMs });
    return 0;
  }
  if (pxPerMs <= 0) {
    debugWarn('layout', 'pxToMs pxPerMs should be > 0', pxPerMs);
    return 0;
  }
  return px / pxPerMs;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Format time as MM:SS or MM:SS.mmm
 * @param ms Time in milliseconds (negative values return '0:00' or '0:00.000')
 * @param includeMilliseconds Whether to include milliseconds in output
 */
export function formatTime(ms: number, includeMilliseconds: boolean = false): string {
  // Handle negative values
  if (ms < 0) {
    return includeMilliseconds ? '0:00.000' : '0:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (includeMilliseconds) {
    const milliseconds = Math.floor(ms % 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format time with frame number as MM:SS:FF
 */
export function formatTimeWithFrame(ms: number, frameRate: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const totalFrames = Math.round(ms / (1000 / frameRate));
  const frameInSecond = totalFrames % frameRate;

  return `${minutes}:${seconds.toString().padStart(2, '0')}:${frameInSecond.toString().padStart(2, '0')}`;
}

/**
 * Snap time to nearest frame
 * @param timeMs Time in milliseconds
 * @param frameRate Frames per second
 * @returns Snapped time in milliseconds
 */
export function snapToFrame(timeMs: number, frameRate: number): number {
  // Defensive checks
  if (!isFinite(timeMs)) {
    debugWarn('snap', 'snapToFrame invalid timeMs', timeMs);
    return 0;
  }
  if (!isFinite(frameRate) || frameRate <= 0) {
    debugWarn('snap', 'snapToFrame invalid frameRate', frameRate);
    return timeMs; // Return original time if frame rate is invalid
  }

  const frameDurationMs = 1000 / frameRate;
  return Math.round(timeMs / frameDurationMs) * frameDurationMs;
}
