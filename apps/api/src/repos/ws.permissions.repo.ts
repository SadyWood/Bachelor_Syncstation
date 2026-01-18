// apps/api/src/repos/ws.permissions.repo.ts
import { PermissionCatalogResponse } from '@hk26/schema';
import { dbWs, schema } from '../db.js';
import type { PermissionCatalogItem } from '@hk26/schema';

export async function listPermissionsCatalog(): Promise<PermissionCatalogItem[]> {
  const rows = await dbWs
    .select({
      permissionCode: schema.wsPermissionsCatalog.permissionCode,
      description: schema.wsPermissionsCatalog.description,
    })
    .from(schema.wsPermissionsCatalog);

  return PermissionCatalogResponse.parse(rows);
}
