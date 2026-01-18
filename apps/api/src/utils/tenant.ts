// apps/api/src/utils/tenant.ts
import type { TenantHeader } from '../types/tenant.js';
import type { FastifyRequest } from 'fastify';

/**
 * Extract and validate tenant ID from request headers.
 *
 * @param req Fastify request object
 * @returns Tenant ID string if present and valid, null otherwise
 */
export function requireTenant(req: FastifyRequest): string | null {
  const t = (req.headers as TenantHeader)['x-ws-tenant'];
  return typeof t === 'string' && t.trim() ? t : null;
}
