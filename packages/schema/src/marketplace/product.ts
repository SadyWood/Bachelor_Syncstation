import { z } from 'zod';

// Product schema for Consumer App catalog
export const productSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  brand: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  basePrice: z.number().positive(),
  currency: z.string().length(3).default('NOK'), // ISO 4217 (e.g., "NOK", "USD")
  productUrl: z.string().url().nullable(), // Link to external store (Amazon, etc.)
  description: z.string().nullable(),
  metadata: z.record(z.unknown()).default({}), // Flexible attributes (SKU, sizes, etc.)
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof productSchema>;
