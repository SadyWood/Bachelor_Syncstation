// packages/timeline/src/hooks/history/useHistoryManager.ts
import { useState, useCallback, useRef } from 'react';
import type { TimelineItem, HistoryEntry } from '../../core/models';

export interface UseHistoryManagerOptions {
  enableHistory?: boolean;
  maxHistorySize?: number;
  onItemsChange?: ((items: TimelineItem[]) => void) | undefined;
}

export interface UseHistoryManagerReturn {
  historyStack: HistoryEntry[];
  historyIndex: number;
  addToHistory: (items: TimelineItem[], action: string) => void;
  performUndo: () => void;
  performRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Hook for managing undo/redo history
 * Maintains a stack of timeline states with ability to undo/redo
 */
export function useHistoryManager({
  enableHistory = true,
  maxHistorySize = 50,
  onItemsChange,
}: UseHistoryManagerOptions): UseHistoryManagerReturn {
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isApplyingHistory = useRef<boolean>(false);

  const addToHistory = useCallback(
    (newItems: TimelineItem[], action: string) => {
      if (!enableHistory || isApplyingHistory.current) return;

      setHistoryStack((prev) => {
        // Remove any "future" history if we're not at the end
        const newStack = prev.slice(0, historyIndex + 1);

        // Add new entry
        newStack.push({
          items: newItems,
          action,
          timestamp: Date.now(),
        });

        // Limit stack size
        if (newStack.length > maxHistorySize) {
          return newStack.slice(1);
        }

        return newStack;
      });

      setHistoryIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
    },
    [enableHistory, historyIndex, maxHistorySize],
  );

  const performUndo = useCallback(() => {
    if (historyIndex <= 0) return;

    const previousEntry = historyStack[historyIndex - 1];
    if (!previousEntry) return;

    isApplyingHistory.current = true;
    onItemsChange?.(previousEntry.items);
    setHistoryIndex((prev) => prev - 1);
    setTimeout(() => {
      isApplyingHistory.current = false;
    }, 0);
  }, [historyIndex, historyStack, onItemsChange]);

  const performRedo = useCallback(() => {
    if (historyIndex >= historyStack.length - 1) return;

    const nextEntry = historyStack[historyIndex + 1];
    if (!nextEntry) return;

    isApplyingHistory.current = true;
    onItemsChange?.(nextEntry.items);
    setHistoryIndex((prev) => prev + 1);
    setTimeout(() => {
      isApplyingHistory.current = false;
    }, 0);
  }, [historyIndex, historyStack, onItemsChange]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  return {
    historyStack,
    historyIndex,
    addToHistory,
    performUndo,
    performRedo,
    canUndo,
    canRedo,
  };
}
