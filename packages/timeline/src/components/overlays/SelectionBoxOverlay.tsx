// packages/timeline/src/components/overlays/SelectionBoxOverlay.tsx
import React from 'react';

export interface SelectionBoxOverlayProps {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * Renders blue selection box during drag-to-select
 * - Semi-transparent blue background
 * - Blue border
 * - Shows selected area rectangle
 *
 * @example
 * <SelectionBoxOverlay
 *   startX={100}
 *   startY={200}
 *   currentX={300}
 *   currentY={400}
 * />
 */
export const SelectionBoxOverlay: React.FC<SelectionBoxOverlayProps> = ({
  startX,
  startY,
  currentX,
  currentY,
}) => (
  <div
    style={{
      position: 'absolute',
      left: Math.min(startX, currentX),
      top: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY),
      border: '2px solid #5b9eff',
      backgroundColor: 'rgba(91, 158, 255, 0.1)',
      pointerEvents: 'none',
      zIndex: 150,
    }}
  />
);
