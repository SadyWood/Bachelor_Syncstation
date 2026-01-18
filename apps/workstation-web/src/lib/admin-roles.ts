// src/lib/admin-roles.ts
import { RolesListResponseSchema, RoleResponseSchema, SuccessResponse as SuccessResponseSchema } from '@workstation/schema';
import { httpTyped } from './http';

export async function listRoles(tenantId: string) {
  const response = await httpTyped('/ws/roles', {
    method: 'GET',
    headers: { 'X-WS-Tenant': tenantId },
    schema: { res: RolesListResponseSchema },
  });
  return response.items;
}

export async function createRole(tenantId: string, payload: { name: string; allow?: string[]; deny?: string[] }) {
  const response = await httpTyped('/ws/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-WS-Tenant': tenantId },
    body: payload,
    schema: { res: RoleResponseSchema },
  });
  return response.role;
}

export async function deleteRole(tenantId: string, roleId: string) {
  await httpTyped(`/ws/roles/${  encodeURIComponent(roleId)}`, {
    method: 'DELETE',
    headers: { 'X-WS-Tenant': tenantId },
    schema: { res: SuccessResponseSchema },
  });
}

export async function getRole(tenantId: string, roleId: string) {
  const response = await httpTyped(`/ws/roles/${  encodeURIComponent(roleId)}`, {
    method: 'GET',
    headers: { 'X-WS-Tenant': tenantId },
    schema: { res: RoleResponseSchema },
  });
  return response.role;
}

export async function updateRole(tenantId: string, roleId: string, payload: { name?: string; allow?: string[]; deny?: string[] }) {
  const response = await httpTyped(`/ws/roles/${  encodeURIComponent(roleId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-WS-Tenant': tenantId },
    body: payload,
    schema: { res: RoleResponseSchema },
  });
  return response.role;
}
