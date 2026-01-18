// packages/timeline/src/hooks/shortcuts/useKeyboardShortcuts.ts
import { useEffect, useState } from 'react';
import { reassignTrackSubTracks } from '../../core/services';
import type { TimelineItem } from '../../core/models';

export interface UseKeyboardShortcutsOptions {
  items: TimelineItem[];
  selectedItemIds: Set<string>;
  currentTimeMs: number;
  enableHistory?: boolean;
  enableMarkers?: boolean;
  effectiveSnapEnabled?: boolean;
  onItemsChange?: ((items: TimelineItem[]) => void) | undefined;
  setSelectedItemIds: (ids: Set<string>) => void;
  performUndo: () => void;
  performRedo: () => void;
  addToHistory: (items: TimelineItem[], action: string) => void;
  handleToggleMarkerAtPlayhead: () => void;
  handleSnapToggle: () => void;
}

export interface UseKeyboardShortcutsReturn {
  clipboard: TimelineItem[];
}

/**
 * Hook for managing keyboard shortcuts
 * Handles Undo/Redo, Copy/Cut/Paste, Delete, Toggle Marker, Toggle Snap
 */
export function useKeyboardShortcuts({
  items,
  selectedItemIds,
  currentTimeMs,
  enableHistory = true,
  enableMarkers = true,
  effectiveSnapEnabled,
  onItemsChange,
  setSelectedItemIds,
  performUndo,
  performRedo,
  addToHistory,
  handleToggleMarkerAtPlayhead,
  handleSnapToggle,
}: UseKeyboardShortcutsOptions): UseKeyboardShortcutsReturn {
  const [clipboard, setClipboard] = useState<TimelineItem[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts when typing in input/textarea elements
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Cmd/Ctrl+Z
      if (cmdOrCtrl && e.key === 'z' && !e.shiftKey && enableHistory) {
        e.preventDefault();
        performUndo();
        return;
      }

      // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y
      if (cmdOrCtrl && ((e.shiftKey && e.key === 'z') || e.key === 'y') && enableHistory) {
        e.preventDefault();
        performRedo();
        return;
      }

      // Copy: Cmd/Ctrl+C
      if (cmdOrCtrl && e.key === 'c' && selectedItemIds.size > 0) {
        e.preventDefault();
        const selectedItems = items.filter((item) => selectedItemIds.has(item.id));
        setClipboard(selectedItems);
        return;
      }

      // Cut: Cmd/Ctrl+X
      if (cmdOrCtrl && e.key === 'x' && selectedItemIds.size > 0) {
        e.preventDefault();

        // Copy to clipboard
        const selectedItems = items.filter((item) => selectedItemIds.has(item.id));
        setClipboard(selectedItems);

        // Delete selected items
        const newItems = items.filter((item) => !selectedItemIds.has(item.id));

        // Get affected tracks for reassignment
        const affectedTracks = new Set(
          Array.from(selectedItemIds)
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

        // Add to history
        addToHistory(items, 'Before cut');

        onItemsChange?.(updatedItems);

        // Clear selection
        setSelectedItemIds(new Set());
        return;
      }

      // Paste: Cmd/Ctrl+V
      if (cmdOrCtrl && e.key === 'v' && clipboard.length > 0) {
        e.preventDefault();

        // Generate new IDs and place at current playhead position
        const pasteTime = currentTimeMs;

        // Find the earliest start time in clipboard to use as offset reference
        const earliestStartMs = Math.min(...clipboard.map((item) => item.startMs));
        const timeOffset = pasteTime - earliestStartMs;

        // Create new items with offset times and new IDs
        const pastedItems: TimelineItem[] = clipboard.map((item) => ({
          ...item,
          id: `${item.id}-paste-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          startMs: item.startMs + timeOffset,
          endMs: item.endMs + timeOffset,
        }));

        // Combine with existing items
        let newItems = [...items, ...pastedItems];

        // Get all affected tracks for reassignment
        const affectedTracks = new Set(pastedItems.map((item) => item.trackId));
        affectedTracks.forEach((trackId) => {
          newItems = reassignTrackSubTracks(trackId, newItems);
        });

        // Add to history
        addToHistory(items, 'Before paste');

        onItemsChange?.(newItems);

        // Select pasted items
        setSelectedItemIds(new Set(pastedItems.map((item) => item.id)));
        return;
      }

      // M key - Toggle marker at playhead
      if (e.key === 'm' && !cmdOrCtrl && enableMarkers) {
        e.preventDefault();
        handleToggleMarkerAtPlayhead();
        return;
      }

      // S key - Toggle snap
      if (e.key === 's' && !cmdOrCtrl) {
        e.preventDefault();
        handleSnapToggle();
        return;
      }

      // Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemIds.size > 0) {
        e.preventDefault();

        // Filter out selected items
        const newItems = items.filter((item) => !selectedItemIds.has(item.id));

        // Get affected tracks for reassignment
        const affectedTracks = new Set(
          Array.from(selectedItemIds)
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

        // Add to history BEFORE making the change
        addToHistory(items, 'Before delete');

        onItemsChange?.(updatedItems);

        // Clear selection
        setSelectedItemIds(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedItemIds,
    items,
    onItemsChange,
    enableHistory,
    performUndo,
    performRedo,
    addToHistory,
    clipboard,
    currentTimeMs,
    enableMarkers,
    handleToggleMarkerAtPlayhead,
    handleSnapToggle,
    effectiveSnapEnabled,
    setSelectedItemIds,
  ]);

  return {
    clipboard,
  };
}
