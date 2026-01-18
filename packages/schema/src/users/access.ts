import { z } from 'zod';

/**
 * User → platform access summary.
 * Belongs to the "users" domain (cross-platform).
 */
export const AccessSummaryItem = z.object({
  platform: z.string(),                   // 'workstation' | 'marketplace' | 'nexus'
  hasAccess: z.boolean(),
  preferences: z.record(z.unknown()).optional().default({}),
  updatedAt: z.string().datetime().optional(),
});

export const AccessSummary = z.array(AccessSummaryItem);
export type AccessSummaryT = z.infer<typeof AccessSummary>;
