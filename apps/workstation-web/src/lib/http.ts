// src/lib/http.ts
import { createLogger } from '@hoolsy/logger';
import type { z } from 'zod';

const logger = createLogger('http');

let accessToken: string | null = null;
let currentTenantId: string | null = null;

const TENANT_STORAGE_KEY = 'ws_current_tenant_id';

// Restore current tenant ID (access token is now in-memory only)
try {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem(TENANT_STORAGE_KEY) : null;
  if (t) currentTenantId = t;
} catch {
  // sessionStorage may be unavailable in SSR or private browsing
}

/** Set / clear the in-memory access token (no longer persisted to sessionStorage for security) */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Allow AuthContext to set the active tenant for all requests */
export function setCurrentTenantId(tenantId: string | null) {
  currentTenantId = tenantId;
  try {
    if (tenantId) sessionStorage.setItem(TENANT_STORAGE_KEY, tenantId);
    else sessionStorage.removeItem(TENANT_STORAGE_KEY);
  } catch {
    // sessionStorage may be unavailable in SSR or private browsing
  }
}

/** Get the current access token for authenticated requests */
export function getAccessToken(): string | null {
  return accessToken;
}

/** Get the current tenant ID for authenticated requests */
export function getCurrentTenantId(): string | null {
  return currentTenantId;
}

const API_URL =
  (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL ??
  'http://localhost:3333';

type HttpOptions = RequestInit & { parseJson?: boolean };

async function doFetch(input: string, init?: HttpOptions) {
  const url = input.startsWith('http') ? input : `${API_URL}${input}`;
  const headers = new Headers(init?.headers || {});
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  // Header name is case-insensitive; server expects x-ws-tenant
  if (currentTenantId) headers.set('X-WS-Tenant', currentTenantId);

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });
  return res;
}

export async function http(input: string, init?: HttpOptions) {
  let res = await doFetch(input, init);
  if (res.status === 401) {
    const ok = await tryRefresh();
    if (ok) res = await doFetch(input, init);
  }
  return res;
}

/**
 * JSON helper. When the server returns 403 with { code: 'PERMISSION_DENIED', details.missingPerm },
 * we throw a typed error so widgets/pages can show a clear message.
 */
export async function httpJson<T>(
  input: string,
  init?: HttpOptions,
): Promise<{ ok: boolean; data?: T; res: Response }> {
  const res = await http(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });

  let data: T | undefined = undefined;
  try {
    data = await res.json();
  } catch {
    /* empty body is fine */
  }

  // Promote permission-denied to a typed error
  const dataRecord = data as Record<string, unknown> | undefined;
  if (!res.ok && res.status === 403 && dataRecord?.code === 'PERMISSION_DENIED') {
    const details = dataRecord?.details as Record<string, unknown> | undefined;
    const err = new Error((dataRecord?.message as string) || 'Permission denied') as Error & {
      name: string;
      code: string;
      missingPerm: string;
      response: Response;
    };
    err.name = 'PermissionError';
    err.code = 'PERMISSION_DENIED';
    err.missingPerm = String(details?.missingPerm || '');
    err.response = res;
    throw err;
  }

  return { ok: res.ok, data, res };
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: 'GET', credentials: 'include' });
    if (!res.ok) return false;
    const json = await res.json();
    if (json?.accessToken) {
      setAccessToken(json.accessToken);
      return true;
    }
  } catch {
    // Network error or failed to parse response - treat as failed refresh
  }
  setAccessToken(null);
  return false;
}

/**
 * Type-safe HTTP helper with Zod validation for both request and response.
 *
 * @example
 * const result = await httpTyped('/auth/login', {
 *   method: 'POST',
 *   body: { email: 'user@example.com', password: 'secret' },
 *   schema: { req: LoginRequestSchema, res: LoginResponseSchema }
 * });
 */
export async function httpTyped<TReq extends z.ZodTypeAny | undefined, TRes extends z.ZodTypeAny>(
  input: RequestInfo,
  init: Omit<RequestInit, 'body'> & {
    body?: TReq extends z.ZodTypeAny ? z.infer<TReq> : undefined;
    schema: { res: TRes; req?: TReq };
  },
): Promise<z.infer<TRes>> {
  const { body, schema, ...rest } = init;

  let reqBody: BodyInit | undefined;
  if (body !== undefined) {
    // Validate request body if schema provided
    if (schema.req) schema.req.parse(body);
    reqBody = JSON.stringify(body);
  }

  const res = await http(String(input), {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(rest.headers || {}) },
    body: reqBody,
  });

  // Handle non-OK responses
  if (!res.ok) {
    let errorData: Record<string, unknown> | undefined;
    try {
      errorData = await res.json();
    } catch {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    // Promote permission-denied to typed error
    if (res.status === 403 && errorData?.code === 'PERMISSION_DENIED') {
      const details = errorData?.details as Record<string, unknown> | undefined;
      const err = new Error((errorData?.message as string) || 'Permission denied') as Error & {
        name: string;
        code: string;
        missingPerm: string;
        response: Response;
      };
      err.name = 'PermissionError';
      err.code = 'PERMISSION_DENIED';
      err.missingPerm = String(details?.missingPerm || '');
      err.response = res;
      throw err;
    }

    throw new Error((errorData?.message as string) || `HTTP ${res.status}: ${res.statusText}`);
  }

  // Parse and validate response
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error('Failed to parse JSON response');
  }

  try {
    return schema.res.parse(json);
  } catch (error) {
    logger.error('Response schema validation failed:', error);
    throw new Error('Invalid response format from server');
  }
}
