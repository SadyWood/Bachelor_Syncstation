import { z } from 'zod';

/**
 * Public shape for a user record returned to clients.
 * ISO strings are used for dates to avoid Date in JSON.
 */
export const PublicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

/**
 * ---- Invite preview (GET /auth/invite/:token) ----
 */
export const InvitePreviewResponse = z.object({
  email: z.string().email(),
  platform: z.string().optional(), // e.g. 'workstation'
  expiresAt: z.string().datetime(),
  isAvailable: z.boolean(),
  state: z.string(), // 'available' | 'consumed' | 'revoked' | 'expired'
  consumedAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
});
export type InvitePreviewReply = z.infer<typeof InvitePreviewResponse>;

/**
 * ---- Register (POST /auth/register) ----
 * Body is nested under "body" because we use fastify-type-provider-zod.
 */
export const RegisterRequest = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  password: z.string().min(6),
});
export type RegisterBody = z.infer<typeof RegisterRequest>;

export const RegisterResponse = z.object({
  ok: z.literal(true),
  user: PublicUserSchema,
  access: z.array(
    z.object({
      platform: z.string(),
      hasAccess: z.boolean(),
      preferences: z.record(z.unknown()).default({}),
      updatedAt: z.string().datetime().optional(),
    }),
  ),
  accessToken: z.string(),
  refreshToken: z.string().optional(), // Make optional to match API
});
export type RegisterReply = z.infer<typeof RegisterResponse>;
