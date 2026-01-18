// packages/timeline/src/components/overlays/SpliceIndicator.tsx
import React from 'react';

export interface SpliceIndicatorOverlayProps {
  startX: number;
  startY: number;
  currentY: number;
}

/**
 * Renders white vertical line during splice drag
 * - Shows where the splice cut will happen
 * - Extends from drag start to current position
 * - Glowing pulsing animation
 *
 * @example
 * <SpliceIndicatorOverlay
 *   startX={300}
 *   startY={100}
 *   currentY={400}
 * />
 */
export const SpliceIndicatorOverlay: React.FC<SpliceIndicatorOverlayProps> = ({
  startX,
  startY,
  currentY,
}) => {
  const minY = Math.min(startY, currentY);
  const maxY = Math.max(startY, currentY);
  const lineHeight = maxY - minY;

  return (
    <div
      style={{
        position: 'absolute',
        left: startX - 1.5,
        top: minY,
        height: Math.max(lineHeight, 2),
        width: '3px',
        background: '#fff',
        pointerEvents: 'none',
        zIndex: 250,
        boxShadow: '0 0 8px rgba(255, 255, 255, 0.9), 0 0 16px rgba(255, 255, 255, 0.5)',
        animation: 'splice-pulse 1s ease-in-out infinite',
      }}
    />
  );
};
