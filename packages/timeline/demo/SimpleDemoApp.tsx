// packages/timeline/demo/SimpleDemoApp.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Timeline, type TimelineItem, type TimelineTrack, type Marker, assignSubTracks, useVideoSync, Toolbox, type ToolType, MediaPlayer, ThemeProvider, ThemeToggle } from '../src';
import breakingBadData from './data/breaking-bad-pilot.json';

export function SimpleDemoApp() {
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    { id: 'Character', label: 'Characters' },
    { id: 'PhysicalArtifact', label: 'Physical Artifacts' },
    { id: 'Clothing', label: 'Clothing' },
    { id: 'DigitalArtifact', label: 'Digital Artifacts' },
    { id: 'Location', label: 'Locations' },
    { id: 'Concept', label: 'Concepts' },
  ]);
  const [items, setItems] = useState<TimelineItem[]>(() =>
    assignSubTracks(breakingBadData as TimelineItem[]),
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [temporaryTool, setTemporaryTool] = useState<ToolType | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true); // Enable snap by default in demo
  const [timelineWidth, setTimelineWidth] = useState(window.innerWidth - 40);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use video sync hook with preview mode enabled
  const { handleTimeChange, handlePreviewTimeChange } = useVideoSync({
    videoRef,
    currentTime,
    onTimeUpdate: setCurrentTime,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    enablePreviewMode: true,
  });

  // Update timeline width on window resize (account for toolbox width)
  useEffect(() => {
    const TOOLBOX_WIDTH = 48; // Match toolbox width from CSS
    const handleResize = () => setTimelineWidth(window.innerWidth - TOOLBOX_WIDTH - 40);
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial calculation
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Tool switching
      if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTool('splice');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('pan');
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        // Play/Pause with Space
        e.preventDefault(); // Prevent page scroll
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, togglePlayPause]);

  // Calculate video duration and frame rate
  const [videoDuration, setVideoDuration] = useState(360000); // Default 6 minutes
  const [videoFrameRate, setVideoFrameRate] = useState(30); // Default 30fps

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration * 1000);

      // Try to get the actual frame rate from the video
      // Note: This is not always available in all browsers/formats
      // We default to 30fps if not available
      if (typeof video.getVideoPlaybackQuality === 'function') {
        // Use a timeout to let the video start playing briefly
        const detectFrameRate = () => {
          const quality = video.getVideoPlaybackQuality();
          // Only calculate FPS if currentTime is above a safe threshold to avoid division issues
          const MIN_TIME_THRESHOLD = 0.5;
          if (quality.totalVideoFrames > 0 && video.currentTime > MIN_TIME_THRESHOLD) {
            const estimatedFps = Math.round(quality.totalVideoFrames / video.currentTime);
            if (estimatedFps > 0 && estimatedFps <= 120) {
              setVideoFrameRate(estimatedFps);
            }
          }
        };

        // Try to detect after a short playback
        video.currentTime = 1; // Skip to 1 second
        setTimeout(detectFrameRate, 500);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, []);

  return (
    <ThemeProvider defaultTheme="dark">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: 'var(--timeline-bg-primary)',
          color: 'var(--timeline-text-primary)',
          fontFamily: 'var(--timeline-font-family)',
        }}
      >
        {/* Top 50% - Split into info (left) and video (right) */}
        <div style={{ display: 'flex', height: '50%', borderBottom: '2px solid var(--timeline-border-primary)' }}>

          {/* Left: Info/Debug Panel */}
          <div
            style={{
              width: '50%',
              padding: '20px',
              overflowY: 'auto',
              borderRight: '2px solid var(--timeline-border-primary)',
              background: 'var(--timeline-bg-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '24px' }}>
                🎬 Breaking Bad - Pilot Episode
              </h1>
              <ThemeToggle />
            </div>
            <p style={{ color: 'var(--timeline-text-secondary)', fontSize: '14px', margin: '0 0 20px 0' }}>
              Simple Timeline Demo - Drag items to move them in time
            </p>

            {/* Playback Controls */}
            <div
              style={{
                padding: '15px',
                background: 'var(--timeline-bg-secondary)',
                border: '1px solid var(--timeline-border-primary)',
                borderRadius: 'var(--timeline-radius-lg)',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--timeline-text-secondary)' }}>
                ⏯️ Playback
              </h3>
              <div style={{ marginBottom: '10px' }}>
                <strong>Current Time:</strong>{' '}
                <span style={{ color: '#ff4444' }}>{(currentTime / 1000).toFixed(2)}s</span>
                {' / '}
                <span style={{ color: '#666' }}>{(videoDuration / 1000).toFixed(1)}s</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={togglePlayPause}
                  style={{
                    padding: '8px 16px',
                    background: isPlaying ? '#ef4444' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <button
                  onClick={() => handleTimeChange(0)}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ⏮️ Reset
                </button>
                <button
                  onClick={() => handleTimeChange(Math.max(0, currentTime - 5000))}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ⏪ -5s
                </button>
                <button
                  onClick={() => handleTimeChange(Math.min(videoDuration, currentTime + 5000))}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ⏩ +5s
                </button>
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                padding: '15px',
                background: 'var(--timeline-bg-secondary)',
                border: '1px solid var(--timeline-border-primary)',
                borderRadius: 'var(--timeline-radius-lg)',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--timeline-text-secondary)' }}>
                📊 Stats
              </h3>
              <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                <div>
                  <strong>Total Items:</strong> {items.length}
                </div>
                <div>
                  <strong>Tracks:</strong> {tracks.length}
                </div>
                <div>
                  <strong>Frame Rate:</strong>{' '}
                  <span style={{ color: 'var(--timeline-accent-primary)' }}>{videoFrameRate} fps</span>
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: isPlaying ? 'var(--timeline-status-success)' : 'var(--timeline-status-error)' }}>
                    {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
                  </span>
                </div>
              </div>
            </div>

            {/* Debug: Items at current time */}
            <div
              style={{
                padding: '15px',
                background: 'var(--timeline-bg-secondary)',
                border: '1px solid var(--timeline-border-primary)',
                borderRadius: 'var(--timeline-radius-lg)',
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--timeline-text-secondary)' }}>
                📝 Active Items at Current Time
              </h3>
              <div style={{ fontSize: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {items
                  .filter((item) => currentTime >= item.startMs && currentTime <= item.endMs)
                  .map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '6px 8px',
                        margin: '4px 0',
                        background: 'var(--timeline-bg-primary)',
                        border: `1px solid ${item.color}`,
                        borderRadius: 'var(--timeline-radius-sm)',
                        color: item.color,
                      }}
                    >
                      {item.label}
                    </div>
                  ))}
                {items.filter((item) => currentTime >= item.startMs && currentTime <= item.endMs)
                  .length === 0 && (
                  <div style={{ color: 'var(--timeline-text-muted)', fontStyle: 'italic' }}>No items at this time</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Video Preview */}
          <div
            style={{
              width: '50%',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--timeline-bg-primary)',
            }}
          >
            <MediaPlayer
              videoRef={videoRef}
              src="/breaking_bad_pilot_s1e1.mp4"
              currentTime={currentTime}
              isPlaying={isPlaying}
              frameRate={videoFrameRate}
              onTimeChange={handleTimeChange}
              onPlayPause={togglePlayPause}
            />
          </div>
        </div>

        {/* Bottom 50% - Toolbox + Timeline */}
        <div
          style={{
            height: '50%',
            display: 'flex',
            background: 'var(--timeline-bg-primary)',
          }}
        >
          {/* Toolbox */}
          <Toolbox
            selectedTool={activeTool}
            onToolChange={setActiveTool}
            temporaryTool={temporaryTool}
            snapEnabled={snapEnabled}
            onSnapToggle={setSnapEnabled}
          />

          {/* Timeline Editor */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Timeline
              tracks={tracks}
              items={items}
              durationMs={videoDuration}
              currentTimeMs={currentTime}
              activeTool={activeTool}
              frameRate={videoFrameRate}
              onItemsChange={setItems}
              onTracksChange={setTracks}
              onTimeChange={handleTimeChange}
              onPreviewTimeChange={handlePreviewTimeChange}
              onTemporaryToolChange={setTemporaryTool}
              markers={markers}
              onMarkersChange={setMarkers}
              enableMarkers
              snapEnabled={snapEnabled}
              onSnapToggle={setSnapEnabled}
              width={timelineWidth}
              height={window.innerHeight * 0.5}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

