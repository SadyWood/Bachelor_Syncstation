import {
  type WsMember,
  MembersListResponseSchema,
  type SimpleRole,
  SimpleRolesListResponseSchema,
  CanCheckResponse as PermissionCheckResponseSchema,
  RolesListResponseSchema,
  type Role,
  RoleResponseSchema,
  SuccessResponse as SuccessResponseSchema,
} from '@workstation/schema';
import { httpTyped } from './http';
import type { RoleDetail } from '../types/permissions';

// Re-export types for backward compatibility
export type { WsMember, Role, RoleDetail };

// Event system for widget communication
function broadcast(name: string, detail?: unknown) {
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch {
    /* SSR / tests */
  }
}

export async function listMembers(tenantId: string): Promise<WsMember[]> {
  const response = await httpTyped('/ws/members', {
    method: 'GET',
    headers: { 'X-WS-Tenant': tenantId },
    schema: { res: MembersListResponseSchema },
  });
  return response.items;
}

export async function inviteMember(tenantId: string, email: string): Promise<void> {
  await httpTyped('/ws/invite', {
    method: 'POST',
    headers: { 'X-WS-Tenant': tenantId },
    body: { email },
    schema: { res: SuccessResponseSchema },
  });
}

export async function deactivateMember(tenantId: string, userId: string): Promise<void> {
  await httpTyped(`/ws/members/${encodeURIComponent(userId)}/deactivate`, {
    method: 'POST',
    headers: { 'X-WS-Tenant': tenantId },
    schema: { res: SuccessResponseSchema },
  });
}

// Permission check
export async function checkPermission(perm: string): Promise<boolean> {
  try {
    const response = await httpTyped(`/auth/can?perm=${encodeURIComponent(perm)}`, {
      method: 'GET',
      schema: { res: PermissionCheckResponseSchema },
    });
    return response.allowed;
  } catch {
    return false;
  }
}

// Role membership management
export async function listUserRoles(tenantId: string, userId: string): Promise<SimpleRole[]> {
  const response = await httpTyped(
    `/ws/members/${encodeURIComponent(userId)}/roles`,
    {
      method: 'GET',
      headers: { 'X-WS-Tenant': tenantId },
      schema: { res: SimpleRolesListResponseSchema },
    },
  );
  return response.items;
}

export async function addRoleToUser(tenantId: string, userId: string, roleId: string): Promise<void> {
  await httpTyped('/ws/memberships', {
    method: 'POST',
    headers: { 'X-WS-Tenant': tenantId },
    body: { userId, roleId },
    schema: { res: SuccessResponseSchema },
  });
}

export async function removeRoleFromUser(tenantId: string, userId: string, roleId: string): Promise<void> {
  await httpTyped('/ws/memberships', {
    method: 'DELETE',
    headers: { 'X-WS-Tenant': tenantId },
    body: { userId, roleId },
    schema: { res: SuccessResponseSchema },
  });
}

export async function bulkUpdateUserRoles(tenantId: string, userId: string, add?: string[], remove?: string[]): Promise<void> {
  await httpTyped('/ws/memberships/bulk', {
    method: 'POST',
    headers: { 'X-WS-Tenant': tenantId },
    body: { userId, add, remove },
    schema: { res: SuccessResponseSchema },
  });
  // Good signal for both lists + details widgets to refetch member.
  broadcast('ws:memberships:changed', { userId, add, remove });
}

// Role CRUD management
export async function listRoles(tenantId: string): Promise<Role[]> {
  const response = await httpTyped('/ws/roles', {
    method: 'GET',
    headers: { 'X-WS-Tenant': tenantId },
    schema: { res: RolesListResponseSchema },
  });
  return response.items;
}

export async function createRole(tenantId: string, payload: { name: string; allow?: string[]; deny?: string[] }): Promise<RoleDetail> {
  const response = await httpTyped('/ws/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-WS-Tenant': tenantId },
    body: {
      name: payload.name,
      allow: payload.allow || [],
      deny: payload.deny || [],
    },
    schema: { res: RoleResponseSchema },
  });
  const { role } = response;
  broadcast('ws:roles:changed', { action: 'created', role });
  return role;
}

export async function updateRole(tenantId: string, roleId: string, payload: { name?: string; allow?: string[]; deny?: string[] }): Promise<RoleDetail> {
  const response = await httpTyped(`/ws/roles/${encodeURIComponent(roleId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-WS-Tenant': tenantId },
    body: payload,
    schema: { res: RoleResponseSchema },
  });
  const { role } = response;
  broadcast('ws:roles:changed', { action: 'updated', role });
  return role;
}

export async function getRole(tenantId: string, roleId: string): Promise<RoleDetail> {
  const response = await httpTyped(`/ws/roles/${encodeURIComponent(roleId)}`, {
    method: 'GET',
    headers: { 'X-WS-Tenant': tenantId },
    schema: { res: RoleResponseSchema },
  });
  return response.role;
}

export async function deleteRole(tenantId: string, roleId: string): Promise<void> {
  await httpTyped(
    `/ws/roles/${encodeURIComponent(roleId)}`,
    {
      method: 'DELETE',
      headers: { 'X-WS-Tenant': tenantId },
      schema: { res: SuccessResponseSchema },
    },
  );
  broadcast('ws:roles:changed', { action: 'deleted', roleId });
}
