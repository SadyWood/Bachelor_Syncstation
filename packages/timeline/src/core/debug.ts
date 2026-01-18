// packages/timeline/src/core/debug.ts

/**
 * Debug utility for Timeline package
 * Enable with: VITE_TIMELINE_DEBUG=true pnpm dev:timeline
 */

export type DebugCategory =
  | 'snap'
  | 'drag'
  | 'history'
  | 'layout'
  | 'collision'
  | 'render'
  | 'init'
  | 'interaction'
  | 'marker'
  | 'splice';

const CATEGORY_EMOJI: Record<DebugCategory, string> = {
  snap: '🧲',
  drag: '👆',
  history: '📚',
  layout: '📐',
  collision: '💥',
  render: '🎨',
  init: '🚀',
  interaction: '🖱️',
  marker: '📍',
  splice: '✂️',
};

/**
 * Check if timeline debugging is enabled
 */
export function isDebugEnabled(): boolean {
  // Check if running in Vite environment
  if (typeof import.meta === 'undefined') return false;
  return import.meta.env?.VITE_TIMELINE_DEBUG === 'true';
}

/**
 * Log a debug message with category
 * Only logs if VITE_TIMELINE_DEBUG=true
 *
 * @example
 * debugLog("snap", "Finding snap points", { timeMs, threshold });
 */
export function debugLog(category: DebugCategory, message: string, data?: unknown): void {
  if (!isDebugEnabled()) return;

  const emoji = CATEGORY_EMOJI[category];
  const formattedData = data !== undefined ? data : '';

  console.log(`${emoji} [Timeline:${category}]`, message, formattedData);
}

/**
 * Log a warning with category
 * Only logs if VITE_TIMELINE_DEBUG=true
 *
 * @example
 * debugWarn("init", "durationMs should be > 0");
 */
export function debugWarn(category: DebugCategory, message: string, data?: unknown): void {
  if (!isDebugEnabled()) return;

  console.warn(`⚠️ [Timeline:${category}]`, message, data);
}

/**
 * Log an error with category
 * Always logs (even in production) for critical errors
 *
 * @example
 * debugError("history", "Failed to add history entry", error);
 */
export function debugError(category: DebugCategory, message: string, error?: unknown): void {
  console.error(`❌ [Timeline:${category}]`, message, error);
}

/**
 * Time a function execution (only in debug mode)
 *
 * @example
 * debugTime("collision", "getMaxSubTracks", () => {
 *   return getMaxSubTracks(items);
 * });
 */
export function debugTime<T>(category: DebugCategory, label: string, fn: () => T): T {
  if (!isDebugEnabled()) {
    return fn();
  }

  const emoji = CATEGORY_EMOJI[category];
  const timerLabel = `${emoji} [Timeline:${category}] ${label}`;

  console.time(timerLabel);
  try {
    return fn();
  } finally {
    console.timeEnd(timerLabel);
  }
}

/**
 * Log a table with category (only in debug mode)
 * Only logs if VITE_TIMELINE_DEBUG=true
 *
 * @example
 * debugTable("init", "Out of bounds items", items.map(i => ({ id: i.id, start: i.startMs })));
 */
export function debugTable(category: DebugCategory, label: string, data: unknown[]): void {
  if (!isDebugEnabled()) return;

  const emoji = CATEGORY_EMOJI[category];
  console.log(`${emoji} [Timeline:${category}] ${label}:`);
  console.table(data);
}
