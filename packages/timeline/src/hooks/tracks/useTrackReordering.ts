// packages/timeline/src/hooks/tracks/useTrackReordering.ts
import { useCallback } from 'react';
import type { TimelineTrack } from '../../core/models';

export interface UseTrackReorderingOptions {
  tracks: TimelineTrack[];
  onTracksChange?: ((tracks: TimelineTrack[]) => void) | undefined;
}

export interface UseTrackReorderingReturn {
  moveTrackUp: (trackId: string) => void;
  moveTrackDown: (trackId: string) => void;
  canMoveUp: (trackId: string) => boolean;
  canMoveDown: (trackId: string) => boolean;
}

/**
 * Provides track reordering functionality
 * - moveTrackUp: Moves track one position up
 * - moveTrackDown: Moves track one position down
 * - canMoveUp/canMoveDown: Check if track can be moved in direction
 *
 * @example
 * const { moveTrackUp, moveTrackDown, canMoveUp, canMoveDown } = useTrackReordering({
 *   tracks,
 *   onTracksChange: setTracks,
 * });
 */
export function useTrackReordering({
  tracks,
  onTracksChange,
}: UseTrackReorderingOptions): UseTrackReorderingReturn {
  const moveTrackUp = useCallback(
    (trackId: string) => {
      if (!onTracksChange) return;

      const trackIndex = tracks.findIndex((t) => t.id === trackId);
      if (trackIndex <= 0) return; // Already at top

      const newTracks = [...tracks];
      const current = newTracks[trackIndex];
      const previous = newTracks[trackIndex - 1];
      if (!current || !previous) return;
      newTracks[trackIndex - 1] = current;
      newTracks[trackIndex] = previous;
      onTracksChange(newTracks);
    },
    [tracks, onTracksChange],
  );

  const moveTrackDown = useCallback(
    (trackId: string) => {
      if (!onTracksChange) return;

      const trackIndex = tracks.findIndex((t) => t.id === trackId);
      if (trackIndex < 0 || trackIndex >= tracks.length - 1) return; // Already at bottom

      const newTracks = [...tracks];
      const current = newTracks[trackIndex];
      const next = newTracks[trackIndex + 1];
      if (!current || !next) return;
      newTracks[trackIndex + 1] = current;
      newTracks[trackIndex] = next;
      onTracksChange(newTracks);
    },
    [tracks, onTracksChange],
  );

  const canMoveUp = useCallback(
    (trackId: string) => {
      const trackIndex = tracks.findIndex((t) => t.id === trackId);
      return trackIndex > 0;
    },
    [tracks],
  );

  const canMoveDown = useCallback(
    (trackId: string) => {
      const trackIndex = tracks.findIndex((t) => t.id === trackId);
      return trackIndex >= 0 && trackIndex < tracks.length - 1;
    },
    [tracks],
  );

  return {
    moveTrackUp,
    moveTrackDown,
    canMoveUp,
    canMoveDown,
  };
}
