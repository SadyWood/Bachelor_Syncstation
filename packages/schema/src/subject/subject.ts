import { z } from 'zod';

export const subjectTypeEnum = z.enum([
  'person',         // Actor/real person (e.g., Bryan Cranston)
  'character',      // Character (e.g., Walter White)
  'product_prop',   // Product that appears in content (e.g., Walter's Hat)
  'apparel',        // Clothing item (e.g., Hazmat Suit)
  'location',       // Place (e.g., White Residence)
  'vehicle',        // Vehicle (e.g., RV)
  'other',          // Other types
]);

export const subjectSchema = z.object({
  id: z.string().uuid(),
  label: z.string(), // Display name (e.g., "Walter White's Pork Pie Hat")
  type: subjectTypeEnum,
  isSellable: z.boolean(), // True if products are linked to this subject
  heroImageUrl: z.string().url().nullable(),
  externalUrl: z.string().url().nullable(), // Link to Wikipedia, IMDB, etc.
  description: z.string().nullable(),
  metadata: z.record(z.unknown()).default({}), // Flexible attributes (color, material, brand, etc.)
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Link between subject and products
export const subjectProductSchema = z.object({
  subjectId: z.string().uuid(),
  productId: z.string().uuid(),
  sortOrder: z.number().int().default(0),
  createdAt: z.string().datetime(),
});

// Response schema with products
export const subjectWithProductsSchema = z.object({
  subject: subjectSchema,
  products: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      brand: z.string().nullable(),
      imageUrl: z.string().url().nullable(),
      basePrice: z.number().positive(),
      currency: z.string().length(3),
      productUrl: z.string().url().nullable(),
    })
  ),
});

export type Subject = z.infer<typeof subjectSchema>;
export type SubjectType = z.infer<typeof subjectTypeEnum>;
export type SubjectProduct = z.infer<typeof subjectProductSchema>;
export type SubjectWithProducts = z.infer<typeof subjectWithProductsSchema>;
