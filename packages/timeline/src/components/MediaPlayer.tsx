import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import './MediaPlayer.css';

export interface MediaPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src: string;
  currentTime: number;
  isPlaying: boolean;
  frameRate: number;
  onTimeChange: (timeMs: number) => void;
  onPlayPause: () => void;
}

type ZoomLevel = 25 | 50 | 75 | 100 | 150 | 200 | 'fit';

export function MediaPlayer({
  videoRef,
  src,
  currentTime,
  isPlaying,
  frameRate,
  onTimeChange,
  onPlayPause,
}: MediaPlayerProps) {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('fit');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [timeInputValue, setTimeInputValue] = useState('');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [duration, setDuration] = useState(0);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Track video duration changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleDurationChange = () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration * 1000);
      }
    };

    // Set initial duration if already loaded
    handleDurationChange();

    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadedmetadata', handleDurationChange);

    return () => {
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadedmetadata', handleDurationChange);
    };
  }, [videoRef]);

  // Update video volume when state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, videoRef]);

  const frameDurationMs = 1000 / frameRate;

  const handleSkipToStart = () => {
    onTimeChange(0);
  };

  const handleSkipToEnd = () => {
    if (duration > 0) {
      onTimeChange(duration);
    }
  };

  const handlePreviousFrame = () => {
    const newTime = Math.max(0, currentTime - frameDurationMs);
    onTimeChange(newTime);
  };

  const handleNextFrame = () => {
    if (duration > 0) {
      const newTime = Math.min(duration, currentTime + frameDurationMs);
      onTimeChange(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleZoomChange = (level: ZoomLevel) => {
    setZoomLevel(level);
    // Reset pan when changing zoom
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel !== 'fit' && zoomLevel !== 100) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart]);

  // Calculate video transform
  const getVideoTransform = () => {
    if (zoomLevel === 'fit') {
      return 'none';
    }
    const scale = typeof zoomLevel === 'number' ? zoomLevel / 100 : 1;
    return `scale(${scale}) translate(${panOffset.x / scale}px, ${panOffset.y / scale}px)`;
  };

  const getVideoCursor = () => {
    if (zoomLevel === 'fit' || zoomLevel === 100) return 'default';
    return isPanning ? 'grabbing' : 'grab';
  };

  // Format time for display (HH:MM:SS:FF where FF is frame number)
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Calculate frame number from milliseconds remainder
    // Use Math.min to prevent showing frame 30 when ms is very close to 1000
    const msRemainder = ms % 1000;
    const frame = Math.min(Math.floor((msRemainder / 1000) * frameRate), frameRate - 1);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frame.toString().padStart(2, '0')}`;
  };

  // Parse time input (supports HH:MM:SS:FF where FF is frame number)
  const parseTimeInput = (input: string): number | null => {
    const parts = input.split(':');

    if (parts.length !== 4) return null;

    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    const seconds = parseInt(parts[2] || '0', 10);
    const frames = parseInt(parts[3] || '0', 10);

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(frames)) {
      return null;
    }

    // Validate frame number - must be less than frame rate
    if (frames < 0 || frames >= frameRate) {
      // Frame number out of valid range (0 to frameRate-1)
      return null;
    }

    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    const milliseconds = (frames / frameRate) * 1000;

    return (totalSeconds * 1000) + milliseconds;
  };

  const handleTimeInputFocus = () => {
    setIsEditingTime(true);
    setTimeInputValue(formatTime(currentTime));
  };

  const handleTimeInputBlur = () => {
    setIsEditingTime(false);
    setTimeInputValue('');
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInputValue(e.target.value);
  };

  const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newTime = parseTimeInput(timeInputValue);
      if (newTime !== null && videoRef.current) {
        const maxTime = videoRef.current.duration * 1000;
        onTimeChange(Math.min(Math.max(0, newTime), maxTime));
      }
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="media-player">
      {/* Video container with pan support */}
      <div
        ref={videoContainerRef}
        className="media-player-video-container"
        onMouseDown={handleMouseDown}
        style={{ cursor: getVideoCursor() }}
      >
        <video
          ref={videoRef}
          src={src}
          className="media-player-video"
          style={{
            transform: getVideoTransform(),
            width: zoomLevel === 'fit' ? '100%' : 'auto',
            height: zoomLevel === 'fit' ? '100%' : 'auto',
            maxWidth: zoomLevel === 'fit' ? '100%' : 'none',
            maxHeight: zoomLevel === 'fit' ? '100%' : 'none',
          }}
        />
      </div>

      {/* Controls */}
      <div className="media-player-controls">
        {/* Current Time - Far Left */}
        <input
          type="text"
          value={isEditingTime ? timeInputValue : formatTime(currentTime)}
          onChange={handleTimeInputChange}
          onFocus={handleTimeInputFocus}
          onBlur={handleTimeInputBlur}
          onKeyDown={handleTimeInputKeyDown}
          className="media-player-timestamp-input"
          placeholder="00:00:00:00"
          title="Click to edit time (HH:MM:SS:FF)"
        />

        {/* All controls centered together */}
        <div className="media-player-controls-center">
          {/* Volume controls */}
          <div className="media-player-control-group media-player-volume-group">
            <button
              className="media-player-button media-player-volume-button"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="media-player-volume-slider"
              title="Volume"
            />
          </div>

          {/* Playback controls */}
          <div className="media-player-control-group media-player-playback-group">
            <button
              className="media-player-button"
              onClick={handleSkipToStart}
              title="Skip to start"
            >
              <SkipBack size={16} />
            </button>
            <button
              className="media-player-button"
              onClick={handlePreviousFrame}
              title="Previous frame"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="media-player-button media-player-button-primary"
              onClick={onPlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button className="media-player-button" onClick={handleNextFrame} title="Next frame">
              <ChevronRight size={16} />
            </button>
            <button className="media-player-button" onClick={handleSkipToEnd} title="Skip to end">
              <SkipForward size={16} />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="media-player-control-group media-player-zoom-group">
            <span className="media-player-label">ZOOM:</span>
            <select
              value={zoomLevel}
              onChange={(e) => handleZoomChange(e.target.value as ZoomLevel)}
              className="media-player-zoom-select"
            >
              <option value="fit">Fit to window</option>
              <option value={25}>25%</option>
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
              <option value={150}>150%</option>
              <option value={200}>200%</option>
            </select>
          </div>
        </div>

        {/* Duration - Far Right */}
        <span className="media-player-duration">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
