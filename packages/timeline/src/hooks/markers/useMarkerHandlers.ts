// packages/timeline/src/hooks/markers/useMarkerHandlers.ts
import { useCallback } from 'react';
import type { Marker } from '../../core/models';

export interface UseMarkerHandlersOptions {
  markers: Marker[];
  currentTimeMs: number;
  frameRate: number;
  enableMarkers?: boolean;
  onMarkersChange?: ((markers: Marker[]) => void) | undefined;
  onTimeChange?: ((timeMs: number) => void) | undefined;
  setMarkerContextMenu: (menu: { marker: Marker; x: number; y: number } | null) => void;
}

export interface UseMarkerHandlersReturn {
  handleMarkerClick: (marker: Marker) => void;
  handleMarkerRightClick: (marker: Marker, e: React.MouseEvent) => void;
  handleAddMarker: (timeMs?: number) => void;
  handleToggleMarkerAtPlayhead: () => void;
  handleDeleteMarker: (markerId: string) => void;
  handleRenameMarker: (markerId: string) => void;
  handleChangeMarkerColor: (markerId: string) => void;
}

/**
 * Hook for managing marker interactions
 * Handles click, right-click, add, toggle, delete, rename, and color change
 */
export function useMarkerHandlers({
  markers,
  currentTimeMs,
  frameRate: _frameRate,
  enableMarkers: _enableMarkers = true,
  onMarkersChange,
  onTimeChange,
  setMarkerContextMenu,
}: UseMarkerHandlersOptions): UseMarkerHandlersReturn {
  const handleMarkerClick = useCallback(
    (marker: Marker) => {
      onTimeChange?.(marker.timeMs);
    },
    [onTimeChange],
  );

  const handleMarkerRightClick = useCallback(
    (marker: Marker, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setMarkerContextMenu({
        marker,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [setMarkerContextMenu],
  );

  const handleAddMarker = useCallback(
    (timeMs?: number) => {
      if (!onMarkersChange) return;
      const targetTime = timeMs ?? currentTimeMs;

      const newMarker: Marker = {
        markerId: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timeMs: targetTime,
        label: `Marker ${markers.length + 1}`,
        color: '#3b82f6',
      };
      onMarkersChange([...markers, newMarker]);
    },
    [currentTimeMs, markers, onMarkersChange],
  );

  const handleToggleMarkerAtPlayhead = useCallback(() => {
    if (!onMarkersChange) return;

    // Check if there's a marker at or very close to the playhead (within 100ms tolerance)
    const existingMarker = markers.find((m) => Math.abs(m.timeMs - currentTimeMs) < 100);

    if (existingMarker) {
      // Remove marker
      const newMarkers = markers.filter((m) => m.markerId !== existingMarker.markerId);
      onMarkersChange(newMarkers);
    } else {
      // Add marker
      handleAddMarker();
    }
  }, [currentTimeMs, markers, onMarkersChange, handleAddMarker]);

  const handleDeleteMarker = useCallback(
    (markerId: string) => {
      if (!onMarkersChange) return;
      const newMarkers = markers.filter((m) => m.markerId !== markerId);
      onMarkersChange(newMarkers);
      setMarkerContextMenu(null);
    },
    [markers, onMarkersChange, setMarkerContextMenu],
  );

  const handleRenameMarker = useCallback(
    (markerId: string) => {
      if (!onMarkersChange) return;
      const marker = markers.find((m) => m.markerId === markerId);
      if (!marker) return;

      // eslint-disable-next-line no-alert -- Simple inline editing for marker labels
      const newLabel = prompt('Enter marker label:', marker.label || '');
      if (newLabel !== null) {
        const newMarkers = markers.map((m) =>
          m.markerId === markerId ? { ...m, label: newLabel } : m,
        );
        onMarkersChange(newMarkers);
      }
      setMarkerContextMenu(null);
    },
    [markers, onMarkersChange, setMarkerContextMenu],
  );

  const handleChangeMarkerColor = useCallback(
    (markerId: string) => {
      if (!onMarkersChange) return;
      const marker = markers.find((m) => m.markerId === markerId);
      if (!marker) return;

      // Create a temporary color input element
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = marker.color || '#3b82f6';
      colorInput.style.position = 'fixed';
      colorInput.style.top = '-9999px';
      document.body.appendChild(colorInput);

      colorInput.addEventListener('change', (e) => {
        const newColor = (e.target as HTMLInputElement).value;
        const newMarkers = markers.map((m) =>
          m.markerId === markerId ? { ...m, color: newColor } : m,
        );
        onMarkersChange(newMarkers);
        document.body.removeChild(colorInput);
        setMarkerContextMenu(null);
      });

      colorInput.addEventListener('blur', () => {
        // User cancelled - just clean up
        setTimeout(() => {
          if (document.body.contains(colorInput)) {
            document.body.removeChild(colorInput);
          }
          setMarkerContextMenu(null);
        }, 100);
      });

      colorInput.click();
    },
    [markers, onMarkersChange, setMarkerContextMenu],
  );

  return {
    handleMarkerClick,
    handleMarkerRightClick,
    handleAddMarker,
    handleToggleMarkerAtPlayhead,
    handleDeleteMarker,
    handleRenameMarker,
    handleChangeMarkerColor,
  };
}
