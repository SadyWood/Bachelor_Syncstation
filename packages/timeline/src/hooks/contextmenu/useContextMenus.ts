// packages/timeline/src/hooks/contextmenu/useContextMenus.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { debugLog, debugWarn } from '../../core/debug';
import { pxToMs, clamp, snapToFrame } from '../../core/utils';
import type { Marker } from '../../core/models';

export interface MarkerContextMenu {
  marker: Marker;
  x: number;
  y: number;
}

export interface RulerContextMenu {
  timeMs: number;
  x: number;
  y: number;
}

export interface UseContextMenusOptions {
  enableMarkers: boolean;
  pxPerMs: number;
  durationMs: number;
  visibleStartMs: number;
  frameRate: number;
}

export interface UseContextMenusReturn {
  markerContextMenu: MarkerContextMenu | null;
  rulerContextMenu: RulerContextMenu | null;
  setMarkerContextMenu: (menu: MarkerContextMenu | null) => void;
  setRulerContextMenu: (menu: RulerContextMenu | null) => void;
  handleRulerContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Hook for managing context menus for markers and ruler
 * Handles right-click context menus and auto-closing when clicking outside
 */
export function useContextMenus({
  enableMarkers,
  pxPerMs,
  durationMs,
  visibleStartMs,
  frameRate,
}: UseContextMenusOptions): UseContextMenusReturn {
  const [markerContextMenu, setMarkerContextMenu] = useState<MarkerContextMenu | null>(null);
  const [rulerContextMenu, setRulerContextMenu] = useState<RulerContextMenu | null>(null);

  // Track when context menu was just opened to prevent immediate closing
  const contextMenuJustOpenedRef = useRef(false);

  // Handle RULER right-click for context menu
  const handleRulerContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      debugLog('marker', 'Ruler right-click', { enableMarkers });
      if (!enableMarkers) {
        debugWarn('marker', 'Markers not enabled, context menu blocked');
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const timeMs = visibleStartMs + pxToMs(clickX, pxPerMs);
      const clampedTimeMs = clamp(timeMs, 0, durationMs);
      const snappedTimeMs = snapToFrame(clampedTimeMs, frameRate);

      debugLog('marker', 'Setting ruler context menu', { timeMs: snappedTimeMs });
      setRulerContextMenu({
        timeMs: snappedTimeMs,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [enableMarkers, pxPerMs, durationMs, visibleStartMs, frameRate],
  );

  // Close context menus when clicking outside
  useEffect(() => {
    if (!markerContextMenu && !rulerContextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      // Ignore events that happen right after opening
      if (contextMenuJustOpenedRef.current) {
        debugLog('marker', 'Ignoring click - menu just opened');
        return;
      }

      // Don't close if clicking inside a context menu
      const target = e.target as HTMLElement;
      if (target.closest('.timeline-context-menu')) {
        debugLog('marker', 'Click inside context menu, keeping open');
        return;
      }

      debugLog('marker', 'Closing context menus - clicked outside');
      setMarkerContextMenu(null);
      setRulerContextMenu(null);
    };

    // Mark that menu was just opened
    contextMenuJustOpenedRef.current = true;

    // Add listener immediately but ignore events for a short time
    document.addEventListener('mousedown', handleClickOutside, true); // Use capture phase
    document.addEventListener('click', handleClickOutside, true);

    // After a delay, allow the listener to close the menu
    const timeoutId = setTimeout(() => {
      debugLog('marker', 'Context menu now closeable');
      contextMenuJustOpenedRef.current = false;
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      contextMenuJustOpenedRef.current = false;
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [markerContextMenu, rulerContextMenu]);

  return {
    markerContextMenu,
    rulerContextMenu,
    setMarkerContextMenu,
    setRulerContextMenu,
    handleRulerContextMenu,
  };
}
