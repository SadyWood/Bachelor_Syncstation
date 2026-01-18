// packages/timeline/src/hooks/interactions/useMarkerDrag.ts
import { useState, useCallback, useEffect } from 'react';
import { pxToMs, clamp, snapToFrame } from '../../core/utils';
import type { Marker } from '../../core/models';

export interface UseMarkerDragOptions {
  markers: Marker[];
  pxPerMs: number;
  durationMs: number;
  frameRate: number;
  onMarkersChange?: ((markers: Marker[]) => void) | undefined;
}

export interface UseMarkerDragReturn {
  markerDragState: {
    marker: Marker;
    startX: number;
    startTimeMs: number;
  } | null;
  handleMarkerDragStart: (marker: Marker, e: React.MouseEvent) => void;
}

/**
 * Hook for managing marker drag behavior
 * Handles dragging markers along the timeline
 */
export function useMarkerDrag({
  markers,
  pxPerMs,
  durationMs,
  frameRate,
  onMarkersChange,
}: UseMarkerDragOptions): UseMarkerDragReturn {
  const [markerDragState, setMarkerDragState] = useState<{
    marker: Marker;
    startX: number;
    startTimeMs: number;
  } | null>(null);

  const handleMarkerDragStart = useCallback((marker: Marker, e: React.MouseEvent) => {
    setMarkerDragState({
      marker,
      startX: e.clientX,
      startTimeMs: marker.timeMs,
    });
  }, []);

  useEffect(() => {
    if (!markerDragState || !onMarkersChange) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - markerDragState.startX;
      const deltaMs = pxToMs(deltaX, pxPerMs);
      let newTimeMs = markerDragState.startTimeMs + deltaMs;

      // Clamp to timeline bounds
      newTimeMs = clamp(newTimeMs, 0, durationMs);

      // Snap to frame
      newTimeMs = snapToFrame(newTimeMs, frameRate);

      // Update marker position
      const newMarkers = markers.map((m) =>
        m.markerId === markerDragState.marker.markerId ? { ...m, timeMs: newTimeMs } : m,
      );
      onMarkersChange(newMarkers);
    };

    const handleMouseUp = () => {
      setMarkerDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [markerDragState, markers, onMarkersChange, pxPerMs, durationMs, frameRate]);

  return {
    markerDragState,
    handleMarkerDragStart,
  };
}
