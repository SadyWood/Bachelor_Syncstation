// packages/timeline/src/components/interactive/TimelineMarkers.tsx
import React from 'react';
import { msToPx, formatTime } from '../../core/utils';
import type { Marker } from '../../core/models';

const RULER_HEIGHT = 40;

export interface TimelineMarkersProps {
  markers: Marker[];
  visibleStartMs: number;
  visibleEndMs: number;
  pxPerMs: number;
  contentHeight: number;
  onMarkerClick?: (marker: Marker) => void;
  onMarkerRightClick?: (marker: Marker, e: React.MouseEvent) => void;
  onMarkerDragStart?: (marker: Marker, e: React.MouseEvent) => void;
}

/**
 * Renders marker pins on the timeline ruler
 * - Creates SVG arrow shapes with shadows
 * - Handles marker interactions (click, drag, context menu)
 * - Filters visible markers only
 *
 * @example
 * <TimelineMarkers
 *   markers={markers}
 *   visibleStartMs={0}
 *   visibleEndMs={60000}
 *   pxPerMs={0.5}
 *   contentHeight={500}
 *   onMarkerClick={(marker) => console.log('Clicked:', marker)}
 *   onMarkerDragStart={(marker, e) => console.log('Drag start:', marker)}
 *   onMarkerRightClick={(marker, e) => console.log('Right click:', marker)}
 * />
 */
export const TimelineMarkers = React.memo<TimelineMarkersProps>(
  ({
    markers,
    visibleStartMs,
    visibleEndMs,
    pxPerMs,
    contentHeight,
    onMarkerClick,
    onMarkerRightClick,
    onMarkerDragStart,
  }) => (
    <>
      {markers
        .filter((marker) => marker.timeMs >= visibleStartMs && marker.timeMs <= visibleEndMs)
        .map((marker) => {
          const x = msToPx(marker.timeMs - visibleStartMs, pxPerMs);
          const markerColor = marker.color || '#3b82f6';

          return (
            <div
              key={marker.markerId}
              className="timeline-marker"
              style={{
                position: 'absolute',
                left: x - 1, // Center the 2px line
                top: '2px',
                height: RULER_HEIGHT + contentHeight,
                width: '2px',
                backgroundColor: markerColor,
                zIndex: 10,
                pointerEvents: 'none', // Line itself is not clickable
              }}
              title={marker.label || `Marker at ${formatTime(marker.timeMs)}`}
            >
              {/* Vertical line - starts from marker head bottom */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '20px', // Start a bit below marker head to avoid overlap
                  width: '1px',
                  height: 'calc(100% - 23px)',
                  backgroundColor: markerColor,
                  pointerEvents: 'none',
                }}
              />

              {/* Marker head (clickable area) - arrow/pin style */}
              <div
                style={{
                  position: 'absolute',
                  top: '-3px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '28px',
                  height: '22px',
                  cursor: 'ew-resize',
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkerClick?.(marker);
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    // Left click
                    e.stopPropagation();
                    onMarkerDragStart?.(marker, e);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMarkerRightClick?.(marker, e);
                }}
              >
                {/* Symmetrical arrow-down marker - narrower triangle */}
                <svg
                  width="24"
                  height="20"
                  viewBox="0 0 24 20"
                  style={{ pointerEvents: 'none', overflow: 'visible' }}
                >
                  <defs>
                    <filter
                      id={`marker-shadow-${marker.markerId}`}
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" />
                    </filter>
                  </defs>
                  {/* Symmetrical arrow: narrow rectangle + narrower triangle */}
                  <path
                    d="M 6 2
                       L 18 2
                       L 18 10
                       L 18 10
                       L 12 18
                       L 6 10
                       L 6 10
                       Z"
                    fill={markerColor}
                    stroke="rgba(0, 0, 0, 0.2)"
                    strokeWidth="0.8"
                    strokeLinejoin="round"
                    filter={`url(#marker-shadow-${marker.markerId})`}
                  />
                  {/* Top highlight for 3D effect */}
                  <line
                    x1="7"
                    y1="3.5"
                    x2="17"
                    y2="3.5"
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          );
        })}
    </>
  ),
  (prevProps, nextProps) =>
    // Only re-render if visible range, markers array, or content height changed
    (
      prevProps.markers === nextProps.markers &&
      prevProps.visibleStartMs === nextProps.visibleStartMs &&
      prevProps.visibleEndMs === nextProps.visibleEndMs &&
      prevProps.pxPerMs === nextProps.pxPerMs &&
      prevProps.contentHeight === nextProps.contentHeight
    ),

);

TimelineMarkers.displayName = 'TimelineMarkers';
