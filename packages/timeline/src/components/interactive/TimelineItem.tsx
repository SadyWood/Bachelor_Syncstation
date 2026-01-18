// packages/timeline/src/components/interactive/TimelineItem.tsx
import React from 'react';
import type { TimelineItem as TimelineItemType, ToolType } from '../../core/models';
import type { DeleteModeState } from '../../hooks/tools/useDeleteMode';

/**
 * Gets cursor style based on active tool and delete mode
 */
function getItemCursor(activeTool: ToolType, isDeleteMode: boolean): string {
  if (activeTool === 'splice') return 'crosshair';
  if (isDeleteMode) return 'not-allowed';
  return 'grab';
}

export interface TimelineItemProps {
  item: TimelineItemType;
  left: number;
  width: number;
  height: number;
  top: number;
  isSelected: boolean;
  isBeingDragged: boolean;
  isDeleted: boolean;
  activeTool: ToolType;
  showLabel: boolean;
  deleteMode: DeleteModeState;
  onMouseDown: (e: React.MouseEvent, mode: 'move' | 'resize-start' | 'resize-end') => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

/**
 * TimelineItem Component
 * Renders an individual timeline item with resize handles
 */
export const TimelineItem = React.memo<TimelineItemProps>(
  ({
    item,
    left,
    width,
    height,
    top,
    isSelected,
    isBeingDragged,
    isDeleted,
    activeTool,
    showLabel,
    deleteMode,
    onMouseDown,
    onMouseEnter,
    onContextMenu,
  }) => (
    <div
      className={`timeline-item ${isBeingDragged ? 'dragging' : ''} ${
        activeTool === 'splice' ? 'tool-splice' : ''
      }`}
      style={{
        left,
        width: Math.max(width, 4),
        backgroundColor: isDeleted ? '#ef4444' : item.color || '#3b82f6',
        top,
        height,
        transition: isBeingDragged ? 'none' : 'top 0.15s ease, height 0.15s ease',
        cursor: getItemCursor(activeTool, deleteMode.isActive),
        opacity: isDeleted ? 0.6 : 1,
        filter: isDeleted ? 'brightness(0.7)' : 'none',
        boxShadow: isSelected
          ? '0 0 0 2.5px rgba(59, 130, 246, 0.85), 0 0 10px rgba(59, 130, 246, 0.5)'
          : 'none',
      }}
      onMouseDown={(e) => onMouseDown(e, 'move')}
      onMouseEnter={onMouseEnter}
      onContextMenu={onContextMenu}
    >
      {/* Left resize handle */}
      <div
        className="timeline-item-handle timeline-item-handle-left"
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e, 'resize-start');
        }}
      />

      {/* Item label - hide when too small */}
      {showLabel && item.label && <span className="item-label">{item.label}</span>}

      {/* Right resize handle */}
      <div
        className="timeline-item-handle timeline-item-handle-right"
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e, 'resize-end');
        }}
      />
    </div>
  ),
  (prevProps, nextProps) =>
    // Critical optimization: Only re-render if position, size, or visual state changed
    (
      prevProps.item === nextProps.item &&
      prevProps.left === nextProps.left &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.top === nextProps.top &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isBeingDragged === nextProps.isBeingDragged &&
      prevProps.isDeleted === nextProps.isDeleted &&
      prevProps.activeTool === nextProps.activeTool &&
      prevProps.showLabel === nextProps.showLabel &&
      prevProps.deleteMode === nextProps.deleteMode
    ),

);

TimelineItem.displayName = 'TimelineItem';
