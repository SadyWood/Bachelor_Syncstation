// src/lib/auth-client.ts
import {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
  InvitePreviewResponse,
  type LoginBody,
  type RegisterBody,
} from '@hk26/schema';
import { setAccessToken, httpTyped, http } from './http';

export async function login(req: LoginBody) {
  const response = await httpTyped('/auth/login', {
    method: 'POST',
    body: req,
    schema: {
      req: LoginRequest,
      res: LoginResponse,
    },
  });
  // Store access token in memory
  setAccessToken(response.accessToken);
  return response;
}

export async function refresh() {
  const response = await httpTyped('/auth/refresh', {
    method: 'GET',
    schema: { res: RefreshResponse },
  });
  setAccessToken(response.accessToken);
  return response;
}

export function me() {
  return httpTyped('/auth/me', {
    method: 'GET',
    schema: { res: MeResponse },
  });
}

export async function logout(): Promise<void> {
  // Use http() instead of httpTyped() to avoid setting Content-Type header for empty body
  const res = await http('/auth/logout', {
    method: 'POST',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Logout failed: ${res.statusText}${text ? ` - ${text}` : ''}`);
  }

  setAccessToken(null);
}

export function invitePreview(token: string) {
  return httpTyped(
    `/auth/invite/${encodeURIComponent(token)}`,
    {
      method: 'GET',
      schema: { res: InvitePreviewResponse },
    },
  );
}

export function register(req: RegisterBody) {
  return httpTyped('/auth/register', {
    method: 'POST',
    body: req,
    schema: {
      req: RegisterRequest,
      res: RegisterResponse,
    },
  });
}
