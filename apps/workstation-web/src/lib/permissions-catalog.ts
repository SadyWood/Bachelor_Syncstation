// src/lib/permissions-catalog.ts
import { PermissionsCatalogResponseSchema } from '@hk26/schema';
import { httpTyped } from './http';

export async function listPermissionCatalog() {
  const response = await httpTyped('/ws/permissions/catalog', {
    method: 'GET',
    schema: { res: PermissionsCatalogResponseSchema },
  });
  return response.items;
}
