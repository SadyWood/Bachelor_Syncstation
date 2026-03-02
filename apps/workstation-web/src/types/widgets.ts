// src/types/widgets.ts

import type { IconComp } from './common';
import type { ComponentType } from 'react';
import type { Layout } from 'react-grid-layout';

/**
 * Widget system types - for widget grid, base components, and widget configs
 */

export interface WidgetProps {
  id: string;
  title: string;
  isResizable?: boolean;
  className?: string;
  onClose?: () => void;
}

// Grid item meta for WidgetGrid
export type GridItemMeta = Layout & {
  widget: string; // Key to look up in registry
  title: string; // Header title
  icon?: IconComp; // Lucide icon component
};

// Widget registry type
export type WidgetRegistry = Record<string, ComponentType<WidgetProps & { titleIcon?: IconComp }>>;

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  resizeHandles?: string[];
}

export type WidgetType = 'subject-editor' | 'chart' | 'timeline' | 'quick-actions';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  layout: GridLayoutItem;
}
