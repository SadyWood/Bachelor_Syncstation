// src/types/permissions.ts

import type { RoleResponse } from '@hk26/schema';

/**
 * Permissions-related types for the workstation frontend
 */

export type Membership = {
  tenantId?: string;
  nodeId?: string;
  role: string; // "Admin" | "Manage" | "Viewer"
};

export type RolePerms = {
  allow: string[]; // e.g. ["**"] or ["content.read", "task.manage"]
  deny?: string[]; // optional deny-list
};

export type EffectivePerms = {
  allow: string[];
  deny?: string[];
};

// Type for single role response (without memberCount)
export type RoleDetail = RoleResponse['role'];
