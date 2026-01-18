// packages/timeline/src/hooks/snap/useSnapBehavior.ts
import { useState, useCallback, useEffect } from 'react';
import type { TimelineItem, Marker } from '../../core/models';

export interface UseSnapBehaviorOptions {
  snapEnabled?: boolean;
  onSnapToggle?: ((enabled: boolean) => void) | undefined;
  onTemporarySnapChange?: ((override: boolean | null) => void) | undefined;
  currentTimeMs: number;
  markers: Marker[];
  items: TimelineItem[];
  snapRadiusPx?: number;
}

export interface UseSnapBehaviorReturn {
  snapEnabled: boolean;
  effectiveSnapEnabled: boolean;
  temporarySnapOverride: boolean | null;
  setTemporarySnapOverride: (override: boolean | null) => void;
  calculateSnapThreshold: (pxPerMs: number) => number;
  findSnapPoints: (timeMs: number, pxPerMs: number, excludeItemIds?: string[]) => number | null;
  handleSnapToggle: () => void;
}

/**
 * Hook for managing snap behavior
 * Handles snap state (controlled/uncontrolled), temporary overrides,
 * snap threshold calculations, and snap point finding
 */
export function useSnapBehavior({
  snapEnabled: controlledSnapEnabled,
  onSnapToggle,
  onTemporarySnapChange,
  currentTimeMs,
  markers,
  items,
  snapRadiusPx = 20,
}: UseSnapBehaviorOptions): UseSnapBehaviorReturn {
  // Internal snap state (default: enabled)
  const [internalSnapEnabled, setInternalSnapEnabled] = useState(true);
  const isSnapControlled = onSnapToggle !== undefined;

  // Determine effective snap state
  const snapEnabled = isSnapControlled ? (controlledSnapEnabled ?? true) : internalSnapEnabled;

  // Temporary snap override during drag (ALT key)
  const [temporarySnapOverride, setTemporarySnapOverride] = useState<boolean | null>(null);

  // Effective snap state (considers temporary override)
  const effectiveSnapEnabled = temporarySnapOverride !== null ? temporarySnapOverride : snapEnabled;

  // Notify parent of temporary snap override changes
  useEffect(() => {
    onTemporarySnapChange?.(temporarySnapOverride);
  }, [temporarySnapOverride, onTemporarySnapChange]);

  // Calculate dynamic snap threshold based on zoom level
  const calculateSnapThreshold = useCallback(
    (pxPerMs: number): number => {
      // Convert snap radius to milliseconds based on zoom level
      const thresholdMs = snapRadiusPx / pxPerMs;
      return Math.max(50, thresholdMs);
    },
    [snapRadiusPx],
  );

  // Find snap points near a given time
  const findSnapPoints = useCallback(
    (timeMs: number, pxPerMs: number, excludeItemIds?: string[]): number | null => {
      if (!effectiveSnapEnabled) {
        return null;
      }

      // Calculate dynamic threshold based on zoom
      const threshold = calculateSnapThreshold(pxPerMs);

      const snapTargets: { timeMs: number }[] = [];

      // Add playhead
      if (currentTimeMs !== undefined) {
        snapTargets.push({ timeMs: currentTimeMs });
      }

      // Add markers
      markers.forEach((marker) => {
        snapTargets.push({ timeMs: marker.timeMs });
      });

      // Add other items' start and end points (exclude items being dragged)
      items.forEach((item) => {
        if (excludeItemIds && excludeItemIds.includes(item.id)) {
          return;
        }
        snapTargets.push({ timeMs: item.startMs });
        snapTargets.push({ timeMs: item.endMs });
      });

      // Find closest snap point within threshold
      let closestSnapTime: number | null = null;
      let minDistance = threshold;

      snapTargets.forEach((target) => {
        const distance = Math.abs(target.timeMs - timeMs);
        if (distance < minDistance) {
          minDistance = distance;
          closestSnapTime = target.timeMs;
        }
      });

      return closestSnapTime;
    },
    [effectiveSnapEnabled, currentTimeMs, markers, items, calculateSnapThreshold],
  );

  // Handle snap toggle (for keyboard shortcut)
  const handleSnapToggle = useCallback(() => {
    if (isSnapControlled) {
      onSnapToggle?.(!snapEnabled);
    } else {
      setInternalSnapEnabled((prev) => !prev);
    }
  }, [isSnapControlled, onSnapToggle, snapEnabled]);

  return {
    snapEnabled,
    effectiveSnapEnabled,
    temporarySnapOverride,
    setTemporarySnapOverride,
    calculateSnapThreshold,
    findSnapPoints,
    handleSnapToggle,
  };
}
