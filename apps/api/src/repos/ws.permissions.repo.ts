// apps/api/src/repos/ws.permissions.repo.ts
import { PermissionCatalogResponse } from '@workstation/schema';
import { dbWs, schema } from '../db.js';
import type { PermissionCatalogItem } from '@workstation/schema';

export async function listPermissionsCatalog(): Promise<PermissionCatalogItem[]> {
  const rows = await dbWs
    .select({
      permissionCode: schema.wsPermissionsCatalog.permissionCode,
      description: schema.wsPermissionsCatalog.description,
    })
    .from(schema.wsPermissionsCatalog);

  return PermissionCatalogResponse.parse(rows);
}
