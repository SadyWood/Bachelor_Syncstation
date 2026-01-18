# Timeline Package Architecture

## Overview

`@hoolsy/timeline` is a custom-built React timeline component for professional video editing workflows. It provides multi-track editing, frame-accurate operations, and a complete toolset for manipulating timeline items.

## Directory Structure

```
packages/timeline/
├── demo/                           # Demo application for testing
│   ├── SimpleDemoApp.tsx          # Standalone demo with video player
│   ├── data/                      # Sample timeline data (Breaking Bad)
│   └── index.html                 # HTML entry point
│
├── src/
│   ├── components/
│   │   ├── interactive/           # User-interactive elements
│   │   │   ├── ContextMenu.tsx    # Right-click context menus
│   │   │   ├── TimelineItem.tsx   # Draggable/resizable items
│   │   │   └── TimelineMarkers.tsx # Marker pins on ruler
│   │   │
│   │   ├── layout/                # Static layout components
│   │   │   ├── RulerMarks.tsx     # Time ruler with tick marks
│   │   │   ├── TrackContent.tsx   # Track row content area
│   │   │   └── TrackLabel.tsx     # Track name labels (left gutter)
│   │   │
│   │   ├── overlays/              # Visual feedback overlays
│   │   │   ├── Playhead.tsx       # Current time indicator
│   │   │   ├── SelectionBoxOverlay.tsx # Drag-to-select rectangle
│   │   │   └── SpliceIndicator.tsx # Splice tool visual guide
│   │   │
│   │   ├── MediaPlayer.tsx        # Video player with frame controls
│   │   ├── ThemeProvider.tsx      # Dark/light theme context
│   │   ├── ThemeToggle.tsx        # Theme switch button
│   │   ├── Toolbox.tsx            # Tool selection sidebar
│   │   └── ZoomPanBar.tsx         # Horizontal overview scrollbar
│   │
│   ├── core/
│   │   ├── constants/             # Configuration constants
│   │   │   └── index.ts           # GUTTER_PX, TRACK_HEIGHT, etc.
│   │   │
│   │   ├── models/                # TypeScript types/interfaces
│   │   │   ├── TimelineItem.ts    # Item type definition
│   │   │   ├── TimelineTrack.ts   # Track type definition
│   │   │   ├── Marker.ts          # Marker type definition
│   │   │   └── index.ts           # Barrel export
│   │   │
│   │   ├── services/              # Business logic
│   │   │   ├── CollisionService.ts # Sub-track collision detection
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                 # Pure utility functions
│   │   │   ├── time.ts            # formatTime, msToPx, pxToMs
│   │   │   └── index.ts
│   │   │
│   │   ├── debug.ts               # Debug logging utilities
│   │   └── index.ts               # Core barrel export
│   │
│   ├── hooks/
│   │   ├── contextmenu/           # Context menu logic
│   │   │   └── useContextMenus.ts
│   │   │
│   │   ├── history/               # Undo/redo stack
│   │   │   └── useHistoryManager.ts
│   │   │
│   │   ├── interactions/          # Drag handlers
│   │   │   ├── useItemDrag.ts     # Item move/resize
│   │   │   ├── useItemInteractions.ts # Item click handlers
│   │   │   ├── useMarkerDrag.ts   # Marker reposition
│   │   │   ├── usePlayheadDrag.ts # Scrub playhead
│   │   │   ├── useRulerClick.ts   # Click-to-seek
│   │   │   ├── useTrackDrag.ts    # Track reordering drag
│   │   │   └── useTrackInteractions.ts
│   │   │
│   │   ├── layout/                # Layout calculations
│   │   │   └── useVerticalLayout.ts
│   │   │
│   │   ├── markers/               # Marker operations
│   │   │   └── useMarkerHandlers.ts
│   │   │
│   │   ├── shortcuts/             # Keyboard shortcuts
│   │   │   └── useKeyboardShortcuts.ts
│   │   │
│   │   ├── snap/                  # Snapping behavior
│   │   │   └── useSnapBehavior.ts
│   │   │
│   │   ├── state/                 # State management
│   │   │   └── useControlledSelection.ts
│   │   │
│   │   ├── tools/                 # Tool implementations
│   │   │   ├── useDeleteMode.ts   # Delete tool behavior
│   │   │   ├── useSelectionBox.ts # Box selection
│   │   │   └── useSpliceTool.ts   # Cut/splice items
│   │   │
│   │   ├── tracks/                # Track operations
│   │   │   └── useTrackReordering.ts
│   │   │
│   │   ├── viewport/              # View navigation
│   │   │   ├── useMiddleClickPan.ts
│   │   │   ├── useTimelineViewport.ts
│   │   │   └── useWheelZoomPan.ts
│   │   │
│   │   └── useVideoSync.ts        # Video player sync
│   │
│   ├── styles/
│   │   └── theme.css              # CSS custom properties for theming
│   │
│   ├── Timeline.tsx               # Main timeline component
│   ├── Timeline.css               # Timeline styles
│   ├── ZoomPanScrollbar.tsx       # Vertical zoom scrollbar
│   ├── index.ts                   # Public API exports
│   └── internal.ts                # Internal API exports
│
└── package.json
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Consumer Application                        │
│  - items: TimelineItem[]                                        │
│  - tracks: TimelineTrack[]                                      │
│  - markers: Marker[]                                            │
│  - currentTimeMs, durationMs                                    │
│  - onItemsChange, onTimeChange callbacks                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ Props
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Timeline.tsx                               │
│  - Manages viewport state (zoom, pan, visible range)            │
│  - Orchestrates all hooks                                       │
│  - Renders components based on tool mode                        │
└──────────────┬─────────────────────────────────┬────────────────┘
               │                                 │
               │ State                           │ Events
               ▼                                 ▼
┌──────────────────────────┐      ┌──────────────────────────────┐
│        hooks/            │      │        components/           │
│                          │      │                              │
│  useItemDrag             │◄────►│  TimelineItem                │
│  useSelectionBox         │      │  TimelineMarkers             │
│  useSnapBehavior         │      │  Playhead                    │
│  useHistoryManager       │      │  SelectionBoxOverlay         │
│  useKeyboardShortcuts    │      │  ContextMenu                 │
└──────────────────────────┘      └──────────────────────────────┘
               │
               │ Uses
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          core/                                   │
│                                                                  │
│  utils/time.ts          - msToPx(), pxToMs(), formatTime()     │
│  services/CollisionService.ts - Sub-track assignment           │
│  constants/             - GUTTER_PX, TRACK_HEIGHT, etc.        │
│  models/                - TypeScript types                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### Timeline.tsx
**Purpose:** Main orchestrator component
- Receives all props from consumer (items, tracks, callbacks)
- Manages internal viewport state (visible range, zoom level)
- Coordinates all hooks for interactions
- Renders child components

**Key state:**
- `visibleRange: { startMs, endMs }` - Currently visible time window
- `pxPerMs` - Pixels per millisecond (zoom level)
- `selectedItemIds` - Currently selected items

### TimelineItem.tsx
**Purpose:** Renders individual timeline items (clips/segments)
- Handles item selection (click, Shift+click)
- Displays resize handles on hover
- Shows label and duration
- Applies track-based coloring

### CollisionService.ts
**Purpose:** Assigns sub-tracks to prevent overlapping items
- Input: Array of items on a track
- Output: Items with `subTrack` property assigned
- Algorithm: Greedy assignment to first available sub-track

---

## Hooks Organization

### Interaction Hooks
| Hook | Purpose |
|------|---------|
| `useItemDrag` | Handle item move/resize drag operations |
| `useMarkerDrag` | Handle marker repositioning |
| `usePlayheadDrag` | Handle scrubbing via playhead |
| `useSelectionBox` | Drag-to-select multiple items |
| `useSpliceTool` | Cut items at cursor position |

### Viewport Hooks
| Hook | Purpose |
|------|---------|
| `useTimelineViewport` | Calculate visible range and coordinate conversion |
| `useWheelZoomPan` | Mouse wheel zoom and horizontal scroll |
| `useMiddleClickPan` | Middle-click drag to pan |

### State Hooks
| Hook | Purpose |
|------|---------|
| `useHistoryManager` | Undo/redo stack for items and markers |
| `useControlledSelection` | Manage selected item state |
| `useSnapBehavior` | Calculate snap points during drag |

---

## Export Strategy

### Public API (`index.ts`)
Stable exports for production use:
```ts
export { Timeline } from './Timeline';
export { Toolbox } from './components/Toolbox';
export { MediaPlayer } from './components/MediaPlayer';
export { assignSubTracks } from './core/services/CollisionService';
export type { TimelineItem, TimelineTrack, Marker, ToolType } from './core/models';
```

### Internal API (`internal.ts`)
For testing, debugging, and advanced customization:
```ts
export * from './core/utils/time';
export * from './core/constants';
export * from './hooks/viewport/useTimelineViewport';
// ... all hooks and utilities
```

---

## Theming

The timeline supports dark and light themes via CSS custom properties:

```css
/* styles/theme.css */
[data-theme="light"] {
  --tl-bg: #ffffff;
  --tl-text: #1a1a1a;
  --tl-track-bg: #f5f5f5;
  /* ... */
}

[data-theme="dark"] {
  --tl-bg: #1a1a1a;
  --tl-text: #ffffff;
  --tl-track-bg: #2a2a2a;
  /* ... */
}
```

Set theme via `document.documentElement.setAttribute('data-theme', 'dark')`.

---

## Debug Mode

Enable debug logging via environment variable:
```bash
VITE_TIMELINE_DEBUG=true pnpm dev:timeline
```

This enables `debugLog()` and `debugWarn()` output in the console.

---

## Running the Demo

```bash
# From monorepo root
pnpm dev:timeline

# Opens at http://localhost:3001
```

The demo includes:
- Sample Breaking Bad S01E01 timeline data
- Video player with keyboard controls
- All timeline features enabled

---

## Testing

```bash
# Type checking
pnpm --filter @hoolsy/timeline typecheck

# Run benchmark suite
pnpm --filter @hoolsy/timeline test:bench
```

---

## Known Limitations

1. **No virtualization** - All items render regardless of visibility (fine for <1000 items)
2. **Single-level undo** - History doesn't persist across page reloads
3. **Fixed track height** - Tracks don't resize based on content

---

## Future Improvements

- [ ] Canvas-based rendering for large timelines
- [ ] Persistent undo history (localStorage)
- [ ] Keyboard-based item selection (arrow keys)
- [ ] Multi-item resize (resize selection as group)
