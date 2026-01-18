// packages/timeline/src/components/layout/TrackLabel.tsx
import type { TimelineTrack } from '../../core/models';

export interface TrackLabelProps {
  track: TimelineTrack;
  height: number;
  laneCount: number;
  isGrouped: boolean;
  isDragging: boolean;
  onDragStart: (e: React.MouseEvent, trackId: string) => void;
  canReorder: boolean;
}

/**
 * Renders a track label with drag handle and lane count badge
 * - Shows drag handle for track reordering
 * - Displays lane count badge when track has multiple sub-tracks
 * - Handles label text with ellipsis for overflow
 *
 * @example
 * <TrackLabel
 *   track={track}
 *   height={80}
 *   laneCount={3}
 *   isGrouped={false}
 *   isDragging={false}
 *   onDragStart={(e, id) => console.log('Drag start:', id)}
 *   canReorder={true}
 * />
 */
export function TrackLabel({
  track,
  height,
  laneCount,
  isGrouped,
  isDragging,
  onDragStart,
  canReorder,
}: TrackLabelProps) {
  return (
    <div
      key={track.id}
      className="track-label"
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: isGrouped ? '20px' : '8px',
        paddingRight: '8px',
        transition: isDragging ? 'none' : 'height 0.15s ease',
        gap: '6px',
        position: 'relative',
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Drag handle for reordering */}
      {canReorder && (
        <div
          onMouseDown={(e) => onDragStart(e, track.id)}
          style={{
            width: '12px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            color: '#666',
            fontSize: '14px',
            flexShrink: 0,
            userSelect: 'none',
          }}
          title="Drag to reorder"
        >
          ⋮⋮
        </div>
      )}

      {/* Track label with ellipsis */}
      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
      >
        {track.label}
      </span>

      {/* Lane count badge */}
      {laneCount > 1 && (
        <span
          style={{
            fontSize: '9px',
            color: 'var(--timeline-text-muted)',
            background: 'var(--timeline-bg-tertiary)',
            padding: '2px 5px',
            borderRadius: '3px',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            border: '1px solid var(--timeline-border-primary)',
          }}
        >
          {laneCount} lanes
        </span>
      )}
    </div>
  );
}
