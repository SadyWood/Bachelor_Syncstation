// packages/timeline/src/hooks/state/useControlledSelection.ts
import { useState, useCallback, useEffect, useMemo } from 'react';

export interface UseControlledSelectionOptions<T> {
  controlledValue?: T[] | undefined;
  defaultValue?: T[];
  onChange?: ((value: T[]) => void) | undefined;
}

export interface UseControlledSelectionReturn<T> {
  selectedItems: Set<T>;
  setSelectedItems: (items: Set<T> | ((prev: Set<T>) => Set<T>)) => void;
  isControlled: boolean;
}

/**
 * Manages controlled/uncontrolled selection state
 * - Handles two-way binding with parent
 * - Notifies parent of selection changes in uncontrolled mode
 * - Provides unified setter for both modes
 *
 * @example
 * // Controlled mode
 * const { selectedItems, setSelectedItems } = useControlledSelection({
 *   controlledValue: selectedIds,
 *   onChange: (ids) => setSelectedIds(ids),
 * });
 *
 * // Uncontrolled mode
 * const { selectedItems, setSelectedItems } = useControlledSelection({
 *   defaultValue: ['id1', 'id2'],
 *   onChange: (ids) => console.log('Selection changed:', ids),
 * });
 */
export function useControlledSelection<T = string>({
  controlledValue,
  defaultValue = [],
  onChange,
}: UseControlledSelectionOptions<T>): UseControlledSelectionReturn<T> {
  // Internal state for uncontrolled mode
  const [internalSelected, setInternalSelected] = useState<Set<T>>(() => new Set(defaultValue));

  // Determine if controlled
  const isControlled = controlledValue !== undefined;

  // Use controlled value if provided, otherwise use internal state
  // Memoize to avoid creating a new Set on every render
  const selectedItems = useMemo(
    () => (isControlled ? new Set(controlledValue) : internalSelected),
    [isControlled, controlledValue, internalSelected],
  );

  // Unified setter for both controlled and uncontrolled modes
  const setSelectedItems = useCallback(
    (newSelection: Set<T> | ((prev: Set<T>) => Set<T>)) => {
      if (isControlled) {
        // In controlled mode, notify parent and let them update the prop
        const finalSelection =
          typeof newSelection === 'function' ? newSelection(selectedItems) : newSelection;
        if (onChange) {
          onChange(Array.from(finalSelection));
        }
      } else {
        // In uncontrolled mode, update internal state
        setInternalSelected(newSelection);
      }
    },
    [isControlled, selectedItems, onChange],
  );

  // Notify parent when internal selection changes (uncontrolled mode only)
  useEffect(() => {
    if (!isControlled && onChange) {
      onChange(Array.from(internalSelected));
    }
  }, [isControlled, internalSelected, onChange]);

  return {
    selectedItems,
    setSelectedItems,
    isControlled,
  };
}
