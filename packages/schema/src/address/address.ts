import { z } from 'zod';

export const addressSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  label: z.string().max(100).nullable(), // e.g., "Home", "Work"
  fullName: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  postalCode: z.string().max(20),
  city: z.string().max(100),
  countryCode: z.string().length(2), // ISO 3166-1 alpha-2 (e.g., "NO", "US")
  phone: z.string().max(50).nullable(),
  isDefault: z.boolean(),
  createdAt: z.string().datetime(),
});

// Request schemas
export const createAddressRequestSchema = z.object({
  label: z.string().max(100).optional(),
  fullName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(1).max(20),
  city: z.string().min(1).max(100),
  countryCode: z.string().length(2),
  phone: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
});

export const updateAddressRequestSchema = createAddressRequestSchema.partial();

export type Address = z.infer<typeof addressSchema>;
export type CreateAddressRequest = z.infer<typeof createAddressRequestSchema>;
export type UpdateAddressRequest = z.infer<typeof updateAddressRequestSchema>;
