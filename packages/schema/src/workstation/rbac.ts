import { z } from 'zod';

/**
 * Enums / primitives
 */
export const WsRoleScope = z.enum(['platform', 'node']);
export type WsRoleScopeT = z.infer<typeof WsRoleScope>;

export const PermissionCode = z.string().min(1);

/**
 * Permissions catalog (GET /ws/permissions)
 */
export const PermissionCatalogItem = z.object({
  permissionCode: PermissionCode,
  description: z.string().optional(),
});
export type PermissionCatalogItem = z.infer<typeof PermissionCatalogItem>;
export const PermissionCatalogResponse = z.array(PermissionCatalogItem);

export const PermissionsCatalogResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(PermissionCatalogItem),
});
export type PermissionsCatalogResponse = z.infer<typeof PermissionsCatalogResponseSchema>;

/**
 * Role Schemas (GET /ws/roles, POST/PUT upsert)
 * Note: API response format from backend (different from DB schema)
 */
export const RoleSchema = z.object({
  roleId: z.string().uuid(),
  name: z.string().min(1),
  // API uses 'scope' (global/tenant), computed from tenantId
  scope: z.enum(['global', 'tenant']),
  // Permissions as structured object (backend sends this format)
  defaultPerms: z.object({
    allow: z.array(z.string()),
    deny: z.array(z.string()),
  }),
  // Member count (computed on backend)
  memberCount: z.number().int().min(0),
});
export type Role = z.infer<typeof RoleSchema>;
export const RolesResponse = z.array(RoleSchema);

export const UpsertRoleRequest = z.object({
  body: z.object({
    name: z.string().min(1),
    allow: z.array(z.string()).default([]),
    deny: z.array(z.string()).default([]),
  }),
});
export const RoleResponseSchema = z.object({
  ok: z.literal(true),
  role: z.object({
    roleId: z.string().uuid(),
    name: z.string(),
    scope: z.enum(['global', 'tenant']),
    defaultPerms: z.object({
      allow: z.array(z.string()),
      deny: z.array(z.string()),
    }),
  }),
});
export type RoleResponse = z.infer<typeof RoleResponseSchema>;

export const UpsertRoleResponse = RoleResponseSchema;

export const RolesListResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(RoleSchema),
});
export type RolesListResponse = z.infer<typeof RolesListResponseSchema>;

/**
 * Simple role for dropdowns
 */
export const SimpleRoleSchema = z.object({
  roleId: z.string().uuid(),
  name: z.string(),
});
export type SimpleRole = z.infer<typeof SimpleRoleSchema>;

export const SimpleRolesListResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(SimpleRoleSchema),
});
export type SimpleRolesListResponse = z.infer<typeof SimpleRolesListResponseSchema>;

/**
 * Can-check (GET /auth/can?perm=...)
 */
export const CanCheckQuery = z.object({
  perm: z.string().min(1),
});
export const CanCheckResponse = z.object({
  ok: z.literal(true),
  allowed: z.boolean(),
  perm: z.string(),
});

/**
 * Effective permissions snapshot used by /auth/me
 */
export const EffectivePermissionsSnapshot = z.record(z.boolean());
export type EffectivePermissionsSnapshotT = z.infer<typeof EffectivePermissionsSnapshot>;
