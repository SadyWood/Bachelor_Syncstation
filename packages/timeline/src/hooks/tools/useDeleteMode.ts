// packages/timeline/src/hooks/tools/useDeleteMode.ts
import { useState, useEffect, useCallback } from 'react';
import { reassignTrackSubTracks } from '../../core/services';
import type { TimelineItem } from '../../core/models';

export interface DeleteModeState {
  isActive: boolean;
  deletedIds: Set<string>;
}

export interface UseDeleteModeOptions {
  items: TimelineItem[];
  activeTool: 'select' | 'pan' | 'splice';
  onItemsChange?: ((items: TimelineItem[]) => void) | undefined;
}

export interface UseDeleteModeReturn {
  deleteMode: DeleteModeState;
  startDeleteMode: (itemId?: string) => void;
  markForDeletion: (itemId: string) => void;
}

/**
 * Hook for managing right-click drag-to-delete functionality
 * Handles delete mode state, marking items for deletion, and finalizing deletion
 */
export function useDeleteMode({
  items,
  activeTool: _activeTool,
  onItemsChange,
}: UseDeleteModeOptions): UseDeleteModeReturn {
  const [deleteMode, setDeleteMode] = useState<DeleteModeState>({
    isActive: false,
    deletedIds: new Set(),
  });

  // Start delete mode with optional initial item
  const startDeleteMode = useCallback((itemId?: string) => {
    const newDeletedIds = new Set<string>();
    if (itemId) {
      newDeletedIds.add(itemId);
    }

    setDeleteMode({
      isActive: true,
      deletedIds: newDeletedIds,
    });
  }, []);

  // Mark additional items for deletion (when hovering in delete mode)
  const markForDeletion = useCallback(
    (itemId: string) => {
      if (!deleteMode.isActive || deleteMode.deletedIds.has(itemId)) return;

      const newDeletedIds = new Set(deleteMode.deletedIds);
      newDeletedIds.add(itemId);

      setDeleteMode({
        isActive: true,
        deletedIds: newDeletedIds,
      });
    },
    [deleteMode],
  );

  // Handle delete mode mouseup (finalize deletion)
  useEffect(() => {
    if (!deleteMode.isActive) return;

    const handleMouseUp = (e: MouseEvent) => {
      // Only trigger on right mouse button release
      if (e.button === 2) {
        e.preventDefault();

        // Filter out all deleted items
        const newItems = items.filter((item) => !deleteMode.deletedIds.has(item.id));

        // Get unique affected track IDs
        const affectedTracks = new Set(
          Array.from(deleteMode.deletedIds)
            .map((id) => {
              const item = items.find((i) => i.id === id);
              return item?.trackId;
            })
            .filter(Boolean) as string[],
        );

        // Reassign sub-tracks for all affected tracks
        let updatedItems = newItems;
        affectedTracks.forEach((trackId) => {
          updatedItems = reassignTrackSubTracks(trackId, updatedItems);
        });

        onItemsChange?.(updatedItems);

        // Reset delete mode
        setDeleteMode({ isActive: false, deletedIds: new Set() });
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [deleteMode, items, onItemsChange]);

  return {
    deleteMode,
    startDeleteMode,
    markForDeletion,
  };
}
