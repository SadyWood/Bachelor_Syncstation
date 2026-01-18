// packages/timeline/src/hooks/interactions/useTrackDrag.ts
import { useState, useCallback, useEffect } from 'react';
import type { TimelineTrack } from '../../core/models';

export interface UseTrackDragOptions {
  tracks: TimelineTrack[];
  onTracksChange?: ((tracks: TimelineTrack[]) => void) | undefined;
}

export interface UseTrackDragReturn {
  trackDragState: {
    trackId: string;
    startY: number;
    currentY: number;
  } | null;
  handleTrackDragStart: (e: React.MouseEvent, trackId: string) => void;
}

/**
 * Hook for managing track drag behavior
 * Handles dragging tracks to reorder them
 */
export function useTrackDrag({ tracks, onTracksChange }: UseTrackDragOptions): UseTrackDragReturn {
  const [trackDragState, setTrackDragState] = useState<{
    trackId: string;
    startY: number;
    currentY: number;
  } | null>(null);

  const handleTrackDragStart = useCallback(
    (e: React.MouseEvent, trackId: string) => {
      if (!onTracksChange) return;
      e.preventDefault();
      e.stopPropagation();

      setTrackDragState({
        trackId,
        startY: e.clientY,
        currentY: e.clientY,
      });
    },
    [onTracksChange],
  );

  useEffect(() => {
    if (!trackDragState || !onTracksChange) return;

    const handleMouseMove = (e: MouseEvent) => {
      setTrackDragState((prev) => (prev ? { ...prev, currentY: e.clientY } : null));

      const deltaY = e.clientY - trackDragState.startY;
      const trackIndex = tracks.findIndex((t) => t.id === trackDragState.trackId);

      // Calculate how many tracks to swap based on distance
      // Average track height is roughly 60-80px, use 50px threshold per track
      const tracksMoved = Math.round(deltaY / 50);

      if (tracksMoved !== 0 && trackIndex >= 0) {
        const newIndex = Math.max(0, Math.min(tracks.length - 1, trackIndex + tracksMoved));

        if (newIndex !== trackIndex) {
          // Perform the swap
          const newTracks = [...tracks];
          const [movedTrack] = newTracks.splice(trackIndex, 1);
          if (movedTrack) {
            newTracks.splice(newIndex, 0, movedTrack);
            onTracksChange(newTracks);

            // Reset start position to prevent continuous swapping
            setTrackDragState((prev) => (prev ? { ...prev, startY: e.clientY } : null));
          }
        }
      }
    };

    const handleMouseUp = () => {
      setTrackDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [trackDragState, tracks, onTracksChange]);

  return {
    trackDragState,
    handleTrackDragStart,
  };
}
