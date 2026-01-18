import { z } from 'zod';

/**
 * Minimal tenant info returned by /auth endpoints.
 */
export const TenantInfo = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  createdAt: z.string().datetime().optional(),
});
export type TenantInfoT = z.infer<typeof TenantInfo>;

/**
 * Membership rows (role-based membership table).
 */
export const WsMembership = z.object({
  tenantId: z.string().uuid(),
  nodeId: z.string().uuid().optional(),
  role: z.string(), // role name
  createdAt: z.string().datetime().optional(),
});
export type WsMembershipT = z.infer<typeof WsMembership>;

export const WsMemberships = z.array(WsMembership);
export type WsMembershipsT = z.infer<typeof WsMemberships>;

/**
 * Full member information (for admin UI)
 */
export const WsMemberSchema = z.object({
  memberId: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  since: z.string().datetime().nullable(),
  status: z.enum(['active', 'pending', 'disabled', 'removed']),
  roles: z.array(z.string()),
});

export type WsMember = z.infer<typeof WsMemberSchema>;

export const MembersListResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(WsMemberSchema),
});

export type MembersListResponse = z.infer<typeof MembersListResponseSchema>;

/**
 * User role association (for membership management)
 */
export const UserRoleSchema = z.object({
  tenantId: z.string().uuid(),
  role: z.string(),
  createdAt: z.string().datetime().optional(),
  nodeId: z.string().uuid().optional(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserRolesResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(UserRoleSchema),
});

export type UserRolesResponse = z.infer<typeof UserRolesResponseSchema>;
