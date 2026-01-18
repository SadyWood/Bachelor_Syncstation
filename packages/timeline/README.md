# @hoolsy/timeline

Professional React timeline component for video editing and media annotation - built for Hoolsy Workstation.

## Overview

`@hoolsy/timeline` provides a feature-rich, frame-accurate timeline editor with:

- **Multi-track editing** - Organize clips across multiple tracks with automatic collision detection
- **Drag & drop** - Move and resize clips with pixel-perfect control
- **Selection tools** - Click, shift-click multi-select, box selection
- **Splice tool** - Cut clips at cursor position
- **Snap-to-grid** - Align to markers, playhead, and other clips
- **Markers** - Add, rename, delete, and color-code timeline markers
- **Keyboard shortcuts** - Industry-standard shortcuts (Undo/Redo, Delete, Copy/Paste)
- **Zoom/pan controls** - Mouse wheel zoom, middle-click pan, scrollbars
- **Frame-accurate** - Configurable frame rate (30fps, 60fps, etc.)
- **Themeable** - Dark/light theme support

## Installation

This package is part of the Hoolsy monorepo:

```json
{
  "dependencies": {
    "@hoolsy/timeline": "workspace:^"
  }
}
```

## Quick Start

### Basic Setup

```tsx
import { Timeline, Toolbox } from '@hoolsy/timeline';
import '@hoolsy/timeline/dist/Timeline.css';
import '@hoolsy/timeline/dist/components/Toolbox.css';

function MyTimeline() {
  const [items, setItems] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [tool, setTool] = useState('select');

  return (
    <div style={{ display: 'flex', height: '600px' }}>
      <Toolbox selectedTool={tool} onToolChange={setTool} />
      <Timeline
        items={items}
        tracks={[
          { id: 'track1', label: 'Video Track' },
          { id: 'track2', label: 'Audio Track' },
        ]}
        durationMs={300000} // 5 minutes
        currentTimeMs={currentTime}
        activeTool={tool}
        snapEnabled={true}
        frameRate={30}
        onItemsChange={setItems}
        onTimeChange={setCurrentTime}
      />
    </div>
  );
}
```

### Adding Items

```tsx
const newItem = {
  id: uuidv7(),
  trackId: 'track1',
  startMs: 5000,  // Start at 5 seconds
  endMs: 15000,   // End at 15 seconds
  label: 'My Clip',
  color: '#3b82f6',
};

setItems([...items, newItem]);
```

### With Media Player

```tsx
import { Timeline, Toolbox } from '@hoolsy/timeline';
import { useRef } from 'react';

function VideoEditor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [items, setItems] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);

  // Sync timeline with video playback
  const handleTimeChange = (timeMs: number) => {
    setCurrentTime(timeMs);
    if (videoRef.current) {
      videoRef.current.currentTime = timeMs / 1000;
    }
  };

  return (
    <div>
      <video
        ref={videoRef}
        src="/video.mp4"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime * 1000)}
      />
      <Timeline
        items={items}
        tracks={[{ id: 'video', label: 'Video' }]}
        durationMs={videoRef.current?.duration * 1000 || 300000}
        currentTimeMs={currentTime}
        onItemsChange={setItems}
        onTimeChange={handleTimeChange}
      />
    </div>
  );
}
```

## Tools

### Select Tool (V)

Default tool for interacting with clips:

- **Click** - Select single clip
- **Shift+Click** - Add/remove from selection
- **Drag on empty area** - Box selection
- **Drag clip** - Move clip(s)
- **Drag clip edge** - Resize clip

### Splice Tool (C)

Cut clips at the current playhead position:

- **Click on clip** - Split clip into two at cursor
- **Works on selected clips** - Split all selected clips

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| **Selection** |
| Select item | Click |
| Multi-select | Shift + Click |
| Box select | Drag on empty track |
| Select all | Ctrl/Cmd + A |
| **Editing** |
| Delete | Delete / Backspace |
| Copy | Ctrl/Cmd + C |
| Cut | Ctrl/Cmd + X |
| Paste | Ctrl/Cmd + V |
| Undo | Ctrl/Cmd + Z |
| Redo | Ctrl/Cmd + Shift + Z |
| **Markers** |
| Add marker | M |
| **Tools** |
| Select tool | V |
| Splice tool | C |
| **Navigation** |
| Horizontal zoom | Alt + Scroll |
| Vertical zoom | Ctrl/Cmd + Scroll |
| Pan | Shift + Scroll |
| Middle-click pan | Middle Mouse + Drag |

## Features

### Snap-to-Grid

Enable snapping for precise alignment:

```tsx
<Timeline
  snapEnabled={true}
  snapThresholdMs={100} // Snap within 100ms
  onItemsChange={setItems}
/>
```

Snaps to:
- **Markers** - Timeline markers
- **Playhead** - Current time indicator
- **Other clips** - Start/end of other clips

### Markers

Add visual markers to the timeline:

```tsx
const [markers, setMarkers] = useState([
  { markerId: '1', timeMs: 10000, label: 'Intro', color: '#ef4444' },
  { markerId: '2', timeMs: 60000, label: 'Outro', color: '#10b981' },
]);

<Timeline
  markers={markers}
  onMarkersChange={setMarkers}
/>
```

**Right-click marker** to:
- Rename
- Change color
- Delete

**Press M** to add marker at current time.

### History (Undo/Redo)

Built-in command history:

```tsx
<Timeline
  enableHistory={true}
  maxHistorySize={50}
  onItemsChange={setItems}
/>
```

- **Ctrl/Cmd+Z** - Undo
- **Ctrl/Cmd+Shift+Z** - Redo

### Frame-Accurate Editing

Configure frame rate for precise operations:

```tsx
<Timeline
  frameRate={30} // 30 fps (33.33ms per frame)
  durationMs={300000}
/>
```

Common frame rates:
- **24 fps** - Film standard (41.67ms)
- **30 fps** - NTSC video (33.33ms)
- **60 fps** - High frame rate (16.67ms)

Operations snap to frame boundaries for frame-perfect editing.

### Multi-Track with Sub-Tracks

Tracks automatically split into sub-tracks when clips overlap:

```tsx
const items = [
  { id: '1', trackId: 'video', startMs: 0, endMs: 10000 },
  { id: '2', trackId: 'video', startMs: 5000, endMs: 15000 }, // Overlaps
];

// Timeline automatically creates sub-tracks to avoid collision
```

## API Reference

### Timeline Component

```tsx
interface TimelineProps {
  // Data
  items: TimelineItem[];
  tracks: TimelineTrack[];
  markers?: Marker[];
  durationMs: number;
  currentTimeMs?: number;

  // Tools & Interaction
  activeTool?: 'select' | 'splice' | 'pan';
  snapEnabled?: boolean;
  snapThresholdMs?: number;

  // History
  enableHistory?: boolean;
  maxHistorySize?: number;

  // Frame Rate
  frameRate?: number; // Default: 30

  // Callbacks
  onItemsChange?: (items: TimelineItem[]) => void;
  onTimeChange?: (timeMs: number) => void;
  onMarkersChange?: (markers: Marker[]) => void;
  onSelectionChange?: (selectedIds: string[]) => void;

  // Styling
  className?: string;
  theme?: 'dark' | 'light';
}
```

### Toolbox Component

```tsx
interface ToolboxProps {
  selectedTool: 'select' | 'splice' | 'pan';
  onToolChange: (tool: 'select' | 'splice' | 'pan') => void;
  orientation?: 'vertical' | 'horizontal';
}
```

### Types

```tsx
interface TimelineItem {
  id: string;
  trackId: string;
  startMs: number;
  endMs: number;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>; // Custom data
}

interface TimelineTrack {
  id: string;
  label: string;
  color?: string;
  locked?: boolean; // Prevent editing
}

interface Marker {
  markerId: string;
  timeMs: number;
  label?: string;
  color?: string;
}
```

## Project Structure

```
packages/timeline/
├── src/
│   ├── components/
│   │   ├── interactive/       # Tools (select, splice)
│   │   ├── layout/            # Ruler, track headers
│   │   ├── overlays/          # Playhead, markers
│   │   ├── Timeline.tsx       # Main component
│   │   └── Toolbox.tsx        # Tool selector
│   ├── hooks/
│   │   ├── useTimelineState.ts
│   │   ├── useHistory.ts      # Undo/redo
│   │   └── useSnapping.ts
│   ├── utils/
│   │   ├── collision.ts       # Sub-track calculation
│   │   ├── time.ts            # Frame-accurate math
│   │   └── selection.ts       # Box selection
│   └── index.ts
├── demo/                      # Demo app
│   └── src/Demo.tsx
├── package.json
└── tsconfig.json
```

## Development

### Run Demo

```bash
# From monorepo root
pnpm demo

# Or from this directory
cd packages/timeline
pnpm dev
```

Opens demo at `http://localhost:5174`.

### Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build
pnpm build
```

## Integration Example (Workstation)

```tsx
// apps/workstation-web/src/pages/TimelineEditorPage.tsx
import { Timeline, Toolbox } from '@hoolsy/timeline';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

export function TimelineEditorPage() {
  const { nodeId } = useParams();
  const [items, setItems] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [tool, setTool] = useState('select');

  // Load media from API
  useEffect(() => {
    loadMediaForNode(nodeId).then(media => {
      setItems([{
        id: media.mediaAssetId,
        trackId: 'main',
        startMs: 0,
        endMs: media.durationMs,
        label: media.filename,
      }]);
    });
  }, [nodeId]);

  return (
    <div className="timeline-editor">
      <Toolbox selectedTool={tool} onToolChange={setTool} />
      <Timeline
        items={items}
        tracks={[{ id: 'main', label: 'Main Track' }]}
        durationMs={300000}
        currentTimeMs={currentTime}
        activeTool={tool}
        frameRate={30}
        snapEnabled={true}
        enableHistory={true}
        onItemsChange={setItems}
        onTimeChange={setCurrentTime}
      />
    </div>
  );
}
```

## Future Enhancements

Planned features:
- **Audio waveforms** - Visualize audio tracks
- **Thumbnails** - Show video thumbnails on clips
- **Effects** - Transitions, filters, effects
- **Multi-select operations** - Group move, align, distribute
- **Layers** - Z-index for overlapping clips
- **Export** - Export timeline data for rendering

## Related Documentation

- [Workstation Web](../../apps/workstation-web/README.md)
- [Shared Schemas](../schema/README.md)
- [Logger Package](../logger/README.md)
