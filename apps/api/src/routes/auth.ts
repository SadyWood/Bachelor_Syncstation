// apps/api/src/routes/auth.ts
import '@fastify/jwt';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  InvitePreviewResponse,
  RefreshResponse,
  MeResponse,
  ErrorResponse,
  CanResponse,
} from '@hk26/schema';
import { z } from 'zod';
import { env } from '../config/env.js';
import { getTenantById } from '../repos/workstation.repo.js';
import {
  getUserByEmail,
  getUserByIdService,
  verifyPassword,
  signAccess,
  newRefreshToken,
  storeRefresh,
  createUser,
  publicUser,
  rotateRefresh,
  findUserIdByRefreshToken,
  getAccessSummary,
  grantAccess,
  getWsMemberships,
  resolveCurrentTenant,
  completeInvitedUser,
  activateTenantMembershipsAfterRegister,
  findInvite,
  markInviteConsumed,
  getPlatformCodeById,
  revokeAllUserRefresh,
} from '../services/auth.service.js';
import { evaluateEffectivePerms } from '../services/perm.service.js';
import { err } from '../utils/errors.js';
import type { LoginBody, LoginReply, RegisterBody, RegisterReply, ErrorReply } from '@hk26/schema';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const cookieName = 'ws_refresh';

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  // ---------- GET /auth/can?perm=permission.code ----------
  app.get<{ Querystring: { perm: string }; Reply: z.infer<typeof CanResponse> | ErrorReply }>(
    '/can',
    {
      schema: {
        querystring: z.object({ perm: z.string() }),
        response: { 200: CanResponse, 400: ErrorResponse, 401: ErrorResponse },
      },
    },
    async (req: FastifyRequest<{ Querystring: { perm: string } }>, reply: FastifyReply) => {
      const { perm } = req.query;
      if (!perm) return reply.code(400).send(err('BAD_REQUEST', 'Missing ?perm parameter'));

      try {
        const allowed = await app.can(req, perm);
        return reply.send({ ok: true, allowed, perm });
      } catch {
        return reply.code(401).send(err('UNAUTHORIZED', 'Authentication required'));
      }
    },
  );

  // ---------- POST /auth/login ----------
  type LoginOk = LoginReply;
  type Err = ErrorReply;

  app.post<{ Body: LoginBody; Reply: LoginOk | Err }>(
    '/login',
    { schema: { body: LoginRequest, response: { 200: LoginResponse, 401: ErrorResponse } } },
    async (req: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const user = await getUserByEmail(req.body.email.toLowerCase());
      if (!user || !user.passwordHash) {
        return reply.code(401).send(err('INVALID_CREDENTIALS', 'Invalid email or password.'));
      }
      if (user.isActive === false) {
        return reply.code(401).send(err('USER_INACTIVE', 'User is not active.'));
      }

      const valid = await verifyPassword(req.body.password, user.passwordHash);
      if (!valid) { return reply.code(401).send(err('INVALID_CREDENTIALS', 'Invalid email or password.')); }

      const userId = user.id;

      const accessToken = signAccess(app, { sub: userId }, env.ACCESS_TOKEN_TTL);
      const refreshToken = newRefreshToken();
      const exp = await storeRefresh(userId, refreshToken, env.REFRESH_TOKEN_TTL);
      reply.setCookie(cookieName, refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV !== 'development',
        path: '/',
        expires: exp,
      });

      const access = await getAccessSummary(userId);
      const memberships = await getWsMemberships(userId);
      const currentTenant = resolveCurrentTenant({
        headerValue: req.headers['x-ws-tenant'] as string | undefined,
        accessPrefs: access,
        memberships: memberships
          .filter((m) => m.tenantId !== null)
          .map((m) => ({
            tenantId: m.tenantId as string,
            createdAt: m.createdAt || undefined, // Convert null to undefined
          })),
      });

      const t1 = currentTenant ? await getTenantById(currentTenant) : null;
      const currentTenantInfo = t1
        ? {
          id: t1.id,
          code: t1.code,
          name: t1.name,
          createdAt: t1.createdAt?.toISOString() ?? null,
        }
        : null;

      // Build response object and validate with Zod before sending
      const responseData = {
        ok: true as const,
        user: publicUser(user),
        access: access.map((a) => ({ ...a, updatedAt: a.updatedAt ?? null })),
        memberships: memberships
          .filter((m) => m.nodeId !== null && m.tenantId !== null) // Filter out null values for schema compliance
          .map((m) => ({
            tenantId: m.tenantId as string, // Safe cast since we filtered nulls
            role: m.role,
            createdAt: m.createdAt ?? undefined, // Convert null to undefined for schema compliance
            nodeId: m.nodeId as string, // Safe cast since we filtered nulls
          })),
        accessToken,
        // Only include tenant fields if we have a valid tenant
        ...(currentTenant && currentTenantInfo
          ? {
            currentTenant,
            currentTenantInfo,
          }
          : {}),
        // Do NOT send refreshToken in JSON - only as httpOnly cookie
      };

      // Explicit validation before sending
      const validated = LoginResponse.parse(responseData);
      return reply.send(validated);
    },
  );

  // ---------- POST /auth/register ----------
  type RegisterOk = RegisterReply;

  app.post<{ Body: RegisterBody; Reply: RegisterOk | Err }>(
    '/register',
    {
      schema: {
        body: RegisterRequest,
        response: {
          200: RegisterResponse,
          400: ErrorResponse,
          401: ErrorResponse,
          409: ErrorResponse,
        },
      },
    },
    async (req: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
      const { token } = req.body;

      const inv = await findInvite(token);
      if (!inv) {
        return reply
          .code(400)
          .send(err('INVITE_NOT_FOUND_OR_AVAILABLE', 'Invite not found or unavailable.'));
      }

      if (inv.email.toLowerCase() !== req.body.email.toLowerCase()) {
        return reply
          .code(400)
          .send(err('INVITE_EMAIL_MISMATCH', 'Email does not match the invite.'));
      }

      const existing = await getUserByEmail(req.body.email.toLowerCase());

      let userId: string;
      if (existing) {
        if (existing.passwordHash) {
          return reply.code(409).send(err('EMAIL_EXISTS', 'Email is already registered.'));
        }
        const completed = await completeInvitedUser({
          email: req.body.email,
          firstName: req.body.firstName, // kan være undefined → service normaliserer
          lastName: req.body.lastName, // kan være undefined → service normaliserer
          displayName: req.body.displayName, // kan være undefined → service normaliserer
          password: req.body.password,
        });
        if (!completed) { return reply.code(400).send(err('INVITE_USER_NOT_FOUND', 'Invited user was not found.')); }
        userId = completed.id;
      } else {
        const created = await createUser({
          email: inv.email,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          displayName: req.body.displayName,
          password: req.body.password,
        });
        userId = created.id;
      }

      if (inv.platformId != null) await grantAccess(userId, inv.platformId, true);
      await markInviteConsumed(token, new Date());
      await activateTenantMembershipsAfterRegister(userId, token);

      const access = await getAccessSummary(userId);
      const refreshToken = newRefreshToken();
      const exp = await storeRefresh(userId, refreshToken, env.REFRESH_TOKEN_TTL);
      reply.setCookie(cookieName, refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV !== 'development',
        path: '/',
        expires: exp,
      });

      const accessToken = signAccess(app, { sub: userId }, env.ACCESS_TOKEN_TTL);

      const fullUser = await getUserByIdService(userId);
      if (!fullUser) return reply.code(500).send(err('USER_NOT_FOUND', 'Created user not found.'));

      // Build response object and validate with Zod before sending
      const responseData = {
        ok: true as const,
        user: publicUser(fullUser),
        access: access.map((a) => ({ ...a, updatedAt: a.updatedAt ?? null })),
        accessToken,
        // Do NOT send refreshToken in JSON - only as httpOnly cookie
      };

      // Explicit validation before sending
      const validated = RegisterResponse.parse(responseData);
      return reply.send(validated);
    },
  );

  // ---------- GET /auth/invite/:token ----------
  app.get<{ Params: { token: string }; Reply: z.infer<typeof InvitePreviewResponse> | ErrorReply }>(
    '/invite/:token',
    { schema: { response: { 200: InvitePreviewResponse, 404: ErrorResponse } } },
    async (req: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) => {
      const inv = await findInvite(req.params.token);
      if (!inv) return reply.code(404).send(err('INVITE_NOT_FOUND', 'Invite does not exist.'));

      const platformCode =
        inv.platformId != null ? await getPlatformCodeById(inv.platformId) : undefined;
      const now = new Date();

      let state: 'revoked' | 'consumed' | 'expired' | 'available';
      if (inv.revokedAt) {
        state = 'revoked';
      } else if (inv.consumedAt) {
        state = 'consumed';
      } else if (inv.expiresAt <= now) {
        state = 'expired';
      } else {
        state = 'available';
      }

      // Build response object and validate with Zod before sending
      const responseData = {
        email: inv.email,
        expiresAt: inv.expiresAt.toISOString(),
        isAvailable: state === 'available',
        state,
        // Only include optional fields if they have values
        ...(platformCode !== undefined ? { platform: platformCode } : {}),
        ...(inv.consumedAt ? { consumedAt: inv.consumedAt.toISOString() } : {}),
        ...(inv.revokedAt ? { revokedAt: inv.revokedAt.toISOString() } : {}),
      };

      // Explicit validation before sending
      const validated = InvitePreviewResponse.parse(responseData);
      return reply.send(validated);
    },
  );

  // ---------- POST/GET /auth/refresh ----------
  const handleRefresh = async (req: FastifyRequest, reply: FastifyReply) => {
    const current = req.cookies[cookieName];
    if (!current) { return reply.code(401).send(err('NO_REFRESH_COOKIE', 'Refresh cookie is missing.')); }
    const userId = await findUserIdByRefreshToken(current);
    if (!userId) { return reply.code(401).send(err('INVALID_REFRESH', 'Refresh token is invalid or expired.')); }

    const { refreshPlain, exp } = await rotateRefresh(userId, current, env.REFRESH_TOKEN_TTL);
    reply.setCookie(cookieName, refreshPlain, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV !== 'development',
      path: '/',
      expires: exp,
    });
    const accessToken = app.jwt.sign({ sub: userId }, { expiresIn: env.ACCESS_TOKEN_TTL });
    return reply.send({ ok: true, accessToken });
  };

  app.post(
    '/refresh',
    { schema: { response: { 200: RefreshResponse, 401: ErrorResponse } } },
    handleRefresh,
  );
  app.get(
    '/refresh',
    { schema: { response: { 200: RefreshResponse, 401: ErrorResponse } } },
    handleRefresh,
  );

  // ---------- GET /auth/me ----------
  app.get<{ Reply: z.infer<typeof MeResponse> | ErrorReply }>(
    '/me',
    { schema: { response: { 200: MeResponse, 401: ErrorResponse } } },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const decoded = await req.jwtVerify<{ sub: string }>();
        const userId = decoded.sub;

        const user = await getUserByIdService(userId);
        if (!user) return reply.code(401).send(err('UNKNOWN_USER', 'User no longer exists.'));

        const access = await getAccessSummary(user.id);
        const memberships = await getWsMemberships(user.id);
        const filteredMemberships = memberships
          .filter((m) => m.tenantId !== null)
          .map((m) => ({
            tenantId: m.tenantId as string,
            createdAt: m.createdAt || undefined, // Convert null to undefined
          }));

        const currentTenant = resolveCurrentTenant({
          headerValue: req.headers['x-ws-tenant'] as string | undefined,
          accessPrefs: access,
          memberships: filteredMemberships,
        });

        const t2 = currentTenant ? await getTenantById(currentTenant) : null;
        const currentTenantInfo = t2
          ? {
            id: t2.id,
            code: t2.code,
            name: t2.name,
            createdAt: t2.createdAt?.toISOString() ?? null,
          }
          : null;

        let effectivePermissions: unknown;
        if (currentTenant) {
          const { snapshot } = await evaluateEffectivePerms(user.id, currentTenant);
          effectivePermissions = snapshot;
        }

        // Build response object and validate with Zod before sending
        const responseData = {
          user: publicUser(user),
          access: access.map((a) => ({ ...a, updatedAt: a.updatedAt ?? null })),
          memberships: memberships
            .filter(
              (m): m is typeof m & { nodeId: string; tenantId: string } =>
                m.nodeId !== null && m.tenantId !== null,
            )
            .map((m) => ({
              tenantId: m.tenantId,
              role: m.role,
              createdAt: m.createdAt ?? undefined,
              nodeId: m.nodeId,
            })),
          // Only include tenant fields if we have a valid tenant
          ...(currentTenant && currentTenantInfo
            ? {
              currentTenant,
              currentTenantInfo,
            }
            : {}),
          // Only include effectivePermissions if available
          ...(effectivePermissions !== undefined
            ? {
              effectivePermissions,
            }
            : {}),
        };

        // Explicit validation before sending
        const validated = MeResponse.parse(responseData);
        return reply.send(validated);
      } catch {
        return reply
          .code(401)
          .send(err('INVALID_ACCESS_TOKEN', 'Access token is missing or invalid.'));
      }
    },
  );

  // ---------- POST /auth/logout ----------
  app.post('/logout', {}, async (_req: FastifyRequest, reply: FastifyReply) => {
    const current = _req.cookies[cookieName];
    if (current) {
      const userId = await findUserIdByRefreshToken(current);
      if (userId) {
        await revokeAllUserRefresh(userId);
      }
    }
    reply.clearCookie(cookieName, { path: '/' });
    return reply.send({
      ok: true,
      code: 'LOGOUT_SUCCESS',
      message: 'Logged out and refresh tokens revoked.',
    });
  });
};
