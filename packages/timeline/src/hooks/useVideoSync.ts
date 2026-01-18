// packages/timeline/src/hooks/useVideoSync.ts
import { useRef, useEffect, type RefObject } from 'react';

export interface UseVideoSyncOptions {
  /** Reference to the video element */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Current playhead time in milliseconds */
  currentTime: number;
  /** Callback when video time updates naturally (playback) */
  onTimeUpdate: (timeMs: number) => void;
  /** Callback when video starts playing */
  onPlay?: () => void;
  /** Callback when video pauses */
  onPause?: () => void;
  /** Enable preview mode for resize operations (optional, default: false) */
  enablePreviewMode?: boolean;
}

export interface UseVideoSyncReturn {
  /** Update playhead position (user clicked timeline or dragged playhead) */
  handleTimeChange: (timeMs: number) => void;
  /** Preview frame without moving playhead (user resizing item) */
  handlePreviewTimeChange: (timeMs: number) => void;
  /** Internal ref for preview state (exposed for debugging) */
  isPreviewingRef: React.RefObject<boolean>;
}

/**
 * Custom hook to sync video element with timeline playhead.
 * Handles preview mode to prevent playhead from moving during item resize.
 *
 * @example
 * const videoRef = useRef<HTMLVideoElement>(null);
 * const [currentTime, setCurrentTime] = useState(0);
 *
 * const { handleTimeChange, handlePreviewTimeChange } = useVideoSync({
 *   videoRef,
 *   currentTime,
 *   onTimeUpdate: setCurrentTime,
 *   enablePreviewMode: true,
 * });
 *
 * return (
 *   <>
 *     <video ref={videoRef} />
 *     <Timeline
 *       currentTimeMs={currentTime}
 *       onTimeChange={handleTimeChange}
 *       onPreviewTimeChange={handlePreviewTimeChange}
 *     />
 *   </>
 * );
 */
export function useVideoSync(options: UseVideoSyncOptions): UseVideoSyncReturn {
  const {
    videoRef,
    currentTime,
    onTimeUpdate,
    onPlay,
    onPause,
    enablePreviewMode = false,
  } = options;

  // Track if we're in preview mode (resizing items) to ignore video timeupdate events
  const isPreviewingRef = useRef(false);
  const previewTimeoutRef = useRef<number | null>(null);
  const lastPlayheadPositionRef = useRef(0);

  // Sync video with currentTime when it changes externally
  useEffect(() => {
    if (videoRef.current && Math.abs((videoRef.current.currentTime * 1000) - currentTime) > 100) {
      videoRef.current.currentTime = currentTime / 1000;
    }
  }, [currentTime, videoRef]);

  // Listen to video events (timeupdate, play, pause)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // Ignore timeupdate events when previewing (resizing items)
      if (enablePreviewMode && isPreviewingRef.current) {
        return;
      }

      const videoTime = video.currentTime * 1000;

      // Detect unexpected large jump (> 500ms from last intentional position)
      if (enablePreviewMode && lastPlayheadPositionRef.current > 0) {
        const diff = Math.abs(videoTime - lastPlayheadPositionRef.current);
        const isNearStart = videoTime < 500 || lastPlayheadPositionRef.current < 500;
        const isNearEnd =
          videoTime > (video.duration * 1000) - 500 ||
          lastPlayheadPositionRef.current > (video.duration * 1000) - 500;

        if (diff > 500 && !isNearStart && !isNearEnd) {
          // Restore last intentional position
          video.currentTime = lastPlayheadPositionRef.current / 1000;
          return;
        }
      }

      onTimeUpdate(videoTime);
      lastPlayheadPositionRef.current = videoTime;
    };

    const handlePlay = () => onPlay?.();
    const handlePause = () => onPause?.();

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef, onTimeUpdate, onPlay, onPause, enablePreviewMode]);

  /**
   * Update playhead position (user clicked timeline or dragged playhead).
   * Exits preview mode and updates video time.
   */
  const handleTimeChange = (timeMs: number) => {
    // Clear any pending preview timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    isPreviewingRef.current = false;
    lastPlayheadPositionRef.current = timeMs;

    if (videoRef.current) {
      videoRef.current.currentTime = timeMs / 1000;
    }
  };

  /**
   * Preview frame without moving playhead (user resizing item).
   * Enters preview mode temporarily to block timeupdate events.
   */
  const handlePreviewTimeChange = (timeMs: number) => {
    if (!enablePreviewMode) return;

    // Set preview mode BEFORE changing video time
    isPreviewingRef.current = true;

    // Clear previous timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // Update video preview without changing playhead position
    if (videoRef.current) {
      videoRef.current.currentTime = timeMs / 1000;
    }

    // Exit preview mode after drag ends (200ms for safety)
    previewTimeoutRef.current = setTimeout(() => {
      isPreviewingRef.current = false;
      previewTimeoutRef.current = null;
    }, 200);
  };

  return {
    handleTimeChange,
    handlePreviewTimeChange,
    isPreviewingRef,
  };
}
