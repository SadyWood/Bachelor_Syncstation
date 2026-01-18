// src/types/layout.ts

import type { IconComp } from './common';

/**
 * Navigation and layout types
 */

export interface SideNavProps {
  className?: string;
}

export type MenuItem = {
  icon: IconComp;
  label: string;
  path: string;
  requiresAdmin?: boolean;
};
