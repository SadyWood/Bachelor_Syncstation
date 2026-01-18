// apps/workstation-web/src/widgets/ContentDashboard/MediaPreview.tsx
import { createLogger } from '@hoolsy/logger';
import { MediaPlayer } from '@hoolsy/timeline';
import { Image as ImageIcon } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import {
  EVENT_NAMES,
  addTypedEventListener,
  dispatchVideoTimeUpdate,
  type TimelineSeekEvent,
} from '../../lib/events';
import { getAccessToken, getCurrentTenantId } from '../../lib/http';
import { getMediaForNode } from '../../lib/media-client';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';
import type { MediaAsset } from '@hk26/schema';
import '@hoolsy/timeline/dist/components/MediaPlayer.css';

const logger = createLogger('MediaPreview');

interface MediaPreviewWidgetProps extends Omit<WidgetProps, 'id'> {
  nodeId?: string | null;
}

export default function MediaPreview({ title, onClose, nodeId }: MediaPreviewWidgetProps) {
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch media when nodeId changes
  useEffect(() => {
    if (!nodeId) {
      logger.debug('No nodeId, clearing state');
      setAsset(null);
      setVideoUrl(null);
      return;
    }

    async function fetchMedia() {
      if (!nodeId) return;
      logger.debug(`Fetching media for node: ${nodeId}`);
      setLoading(true);
      setError(null);
      try {
        const result = await getMediaForNode(nodeId);
        logger.debug('Media fetch result', {
          hasAsset: !!result.asset,
          assetId: result.asset?.mediaAssetId,
          variantsCount: result.variants.length,
        });
        setAsset(result.asset);

        if (result.asset) {
          const token = getAccessToken();
          const tenant = getCurrentTenantId();
          const url = `/ws/media/${result.asset.mediaAssetId}/stream?token=${token || ''}&tenant=${tenant || ''}`;
          logger.debug(`Setting video URL: ${url}`);
          logger.debug('Asset metadata', {
            durationMs: result.asset.durationMs,
            width: result.asset.width,
            height: result.asset.height,
            frameRate: result.asset.frameRate,
            videoCodec: result.asset.videoCodec,
            audioCodec: result.asset.audioCodec,
          });
          setVideoUrl(url);
        } else {
          logger.debug('No asset found for node');
          setVideoUrl(null);
        }
      } catch (err) {
        logger.error('Failed to fetch media', err);
        setError(err instanceof Error ? err.message : 'Failed to load media');
        setVideoUrl(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMedia();
  }, [nodeId]);

  // Dispatch video time updates for timeline sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastDispatchTime = 0;
    const THROTTLE_MS = 100; // 10fps

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTimeMs(time * 1000);
      const now = Date.now();
      if (now - lastDispatchTime >= THROTTLE_MS) {
        lastDispatchTime = now;
        dispatchVideoTimeUpdate({ currentTime: time, duration: video.duration });
      }
    };

    const handleDurationChange = () => {
      dispatchVideoTimeUpdate({ currentTime: video.currentTime, duration: video.duration });
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleError = () => {
      // Video error handled by UI state
    };

    const handleLoadStart = () => {
      // Loading state handled by UI
    };

    const handleCanPlay = () => {
      // Ready state handled by UI
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [asset]);

  // Listen for timeline seek events
  useEffect(() => addTypedEventListener<TimelineSeekEvent>(
    EVENT_NAMES.TIMELINE_SEEK,
    (e) => {
      const video = videoRef.current;
      if (video && e.detail.time !== undefined) {
        video.currentTime = e.detail.time;
      }
    },
  ), []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || !asset) return;

      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Use actual framerate from metadata, fallback to 30fps
      const frameRate = asset.frameRate || 30;
      const frameDurationMs = 1000 / frameRate;

      switch (e.key) {
        case ' ': // Spacebar - play/pause
          e.preventDefault();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
          break;

        case 'ArrowLeft': // Left arrow - previous frame or skip to start
          e.preventDefault();
          if (e.shiftKey) {
            video.currentTime = 0;
          } else {
            video.currentTime = Math.max(0, video.currentTime - (frameDurationMs / 1000));
          }
          break;

        case 'ArrowRight': // Right arrow - next frame or skip to end
          e.preventDefault();
          if (e.shiftKey) {
            video.currentTime = video.duration;
          } else {
            video.currentTime = Math.min(video.duration, video.currentTime + (frameDurationMs / 1000));
          }
          break;

        default:
          // Other keys are ignored
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asset]);

  // TODO: Replace with theme context instead of hardcoding
  // Requires global theme context implementation
  // Set light theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Named handlers for better debugging
  const handleTimeChange = (timeMs: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeMs / 1000;
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <BaseWidget title={title || 'Media Preview'} onClose={onClose} titleIcon={ImageIcon}>
      <div className="h-full flex flex-col">
        {loading && <div className="ws-alert ws-alert-info text-xs p-3">Loading media...</div>}
        {error && <div className="ws-alert ws-alert-danger text-xs p-3">{error}</div>}

        {!nodeId && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
              <div className="text-sm ws-muted">Select a node to preview media</div>
            </div>
          </div>
        )}

        {nodeId && !loading && !error && !asset && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
              <div className="text-sm ws-muted">No media attached to this node</div>
            </div>
          </div>
        )}

        {asset && videoUrl && asset.mimeType.startsWith('video/') && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <MediaPlayer
                videoRef={videoRef}
                src={videoUrl}
                currentTime={currentTimeMs}
                isPlaying={isPlaying}
                frameRate={asset.frameRate || 30}
                onTimeChange={handleTimeChange}
                onPlayPause={handlePlayPause}
              />
            </div>
            {(asset.width || asset.durationMs || asset.videoCodec) && (
              <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
                <div className="flex gap-4 flex-wrap">
                  {asset.width && asset.height && (
                    <span><strong>Resolution:</strong> {asset.width}×{asset.height}</span>
                  )}
                  {asset.durationMs && (
                    <span><strong>Duration:</strong> {(asset.durationMs / 1000).toFixed(2)}s</span>
                  )}
                  {asset.frameRate && (
                    <span><strong>FPS:</strong> {asset.frameRate.toFixed(2)}</span>
                  )}
                  {asset.videoCodec && (
                    <span><strong>Video:</strong> {asset.videoCodec}</span>
                  )}
                  {asset.audioCodec && (
                    <span><strong>Audio:</strong> {asset.audioCodec} {asset.audioChannels ? `(${asset.audioChannels}ch)` : ''}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {asset && !asset.mimeType.startsWith('video/') && (
          <div className="flex-1 flex items-center justify-center p-3">
            <div className="text-center">
              <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
              <div className="text-sm ws-muted">
                Only video files are supported in this preview
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
