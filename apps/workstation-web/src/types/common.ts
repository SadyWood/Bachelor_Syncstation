// src/types/common.ts

import type { ComponentType } from 'react';

/**
 * Common types shared across the application
 */

// Icon component type (Lucide icons)
export type IconProps = {
  size?: number;
  className?: string;
};

export type IconComp = ComponentType<IconProps>;

// Generic table/list sorting types
export type SortKey = string; // Generic sort key (permissionCode, description, name, etc.)
export type SortDir = 'asc' | 'desc';
