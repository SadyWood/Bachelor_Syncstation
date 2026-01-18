// packages/timeline/src/hooks/layout/useVerticalLayout.ts
import React from 'react';
import { getMaxSubTracks } from '../../core/services/CollisionService';
import type { TimelineTrack, TimelineItem } from '../../core/models';

const SUB_TRACK_HEIGHT = 80;

export interface UseVerticalLayoutOptions {
  tracks: TimelineTrack[];
  items: TimelineItem[];
  verticalView: { start: number; end: number };
  verticalZoom: number;
  contentHeight: number;
  setVerticalView: (
    view:
      | { start: number; end: number }
      | ((prev: { start: number; end: number }) => { start: number; end: number }),
  ) => void;
}

export interface UseVerticalLayoutReturn {
  currentSubTrackHeight: number;
  showLabels: boolean;
  totalTracksHeight: number;
  verticalScrollOffset: number;
  maxVerticalViewRange: number;
}

/**
 * Manages vertical layout calculations for timeline tracks
 * - Calculates sub-track height based on zoom level
 * - Computes total tracks height
 * - Manages vertical scroll offset
 * - Auto-adjusts vertical view when content changes
 */
export function useVerticalLayout({
  tracks,
  items,
  verticalView,
  verticalZoom,
  contentHeight,
  setVerticalView,
}: UseVerticalLayoutOptions): UseVerticalLayoutReturn {
  // Calculate sub-track height based on vertical zoom
  // Min: 16px (very compressed), Max: 120px (very expanded)
  const currentSubTrackHeight = Math.max(16, Math.min(120, SUB_TRACK_HEIGHT * verticalZoom));
  const showLabels = currentSubTrackHeight >= 20; // Hide labels when too small

  // Calculate total height of all tracks
  const totalTracksHeight = tracks.reduce((sum, track) => {
    const maxSubTracks = getMaxSubTracks(track.id, items);
    return sum + (maxSubTracks * currentSubTrackHeight);
  }, 0);

  // Calculate vertical scroll offset based on verticalView
  const verticalScrollOffset = -(verticalView.start * totalTracksHeight);

  // Dynamically adjust verticalView.end to ensure it doesn't exceed available content
  // Add a small buffer (last sub-track height) to allow scrolling past the last item slightly
  const scrollBufferHeight = currentSubTrackHeight * 0.5; // Half a sub-track for breathing room
  const scrollableHeight = totalTracksHeight + scrollBufferHeight;
  const maxVerticalViewRange = scrollableHeight > 0 ? contentHeight / scrollableHeight : 1;

  // Auto-adjust vertical view if it exceeds the scrollable range
  React.useEffect(() => {
    if (totalTracksHeight > contentHeight) {
      // Content is larger than viewport - ensure we can scroll
      const currentRange = verticalView.end - verticalView.start;
      if (currentRange > maxVerticalViewRange) {
        // Clamp the range to fit
        setVerticalView((prev) => ({
          start: prev.start,
          end: Math.min(1, prev.start + maxVerticalViewRange),
        }));
      }
    } else if (verticalView.start !== 0 || verticalView.end !== 1) {
      // Content fits in viewport - show everything
      setVerticalView({ start: 0, end: 1 });
    }
  }, [
    totalTracksHeight,
    contentHeight,
    maxVerticalViewRange,
    verticalView.start,
    verticalView.end,
    setVerticalView,
  ]);

  return {
    currentSubTrackHeight,
    showLabels,
    totalTracksHeight,
    verticalScrollOffset,
    maxVerticalViewRange,
  };
}
