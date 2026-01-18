// apps/api/src/types/tenant.ts

/**
 * Type for accessing the x-ws-tenant header from Fastify request
 */
export type TenantHeader = {
  'x-ws-tenant'?: string;
};
