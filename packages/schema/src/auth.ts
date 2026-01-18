import { z } from 'zod';
import { AccessSummary } from './users/access.js';
import { PublicUserSchema } from './users/common.js';
import { TenantInfo, WsMemberships } from './workstation/membership.js';

// ---------- /auth/login ----------
export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginBody = z.infer<typeof LoginRequest>;

// Re-export RegisterRequest from users/common for API consistency
export { RegisterRequest, RegisterResponse, type RegisterBody, type RegisterReply } from './users/common.js';

export const LoginResponse = z.object({
  ok: z.literal(true),
  user: PublicUserSchema,
  access: AccessSummary,
  memberships: WsMemberships,
  currentTenant: z.string().uuid().optional(),
  currentTenantInfo: TenantInfo.optional(),
  accessToken: z.string(),
  refreshToken: z.string().optional(), // Make optional since it's mainly in cookie
});
export type LoginReply = z.infer<typeof LoginResponse>;

// ---------- /auth/refresh ----------
export const RefreshResponse = z.object({
  ok: z.literal(true),
  accessToken: z.string(),
});
export type RefreshReply = z.infer<typeof RefreshResponse>;

// ---------- /auth/can ----------
export const CanResponse = z.object({
  ok: z.literal(true),
  allowed: z.boolean(),
  perm: z.string(),
});
export type CanReply = z.infer<typeof CanResponse>;

// ---------- /auth/me ----------
export const MeResponse = z.object({
  user: PublicUserSchema,
  access: AccessSummary,
  memberships: WsMemberships,
  currentTenant: z.string().uuid().optional(),
  currentTenantInfo: TenantInfo.optional(),
  // Fix: API returns a complex snapshot object, not a simple record
  effectivePermissions: z.any().optional(),
});
export type MeReply = z.infer<typeof MeResponse>;
