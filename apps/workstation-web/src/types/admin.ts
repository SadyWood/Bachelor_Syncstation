// src/types/admin.ts

/**
 * Admin-specific types
 */

export type CatalogItem = {
  permissionCode: string;
  description?: string | null;
  assigned?: boolean;
};
