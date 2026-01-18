import { z } from 'zod';

export const favoriteSchema = z.object({
  userId: z.string().uuid(),
  subjectId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

// Request schemas
export const addFavoriteRequestSchema = z.object({
  subjectId: z.string().uuid(),
});

export const removeFavoriteRequestSchema = z.object({
  subjectId: z.string().uuid(),
});

// Response schemas
export const favoriteWithSubjectSchema = z.object({
  userId: z.string().uuid(),
  subjectId: z.string().uuid(),
  createdAt: z.string().datetime(),
  subject: z.object({
    id: z.string().uuid(),
    label: z.string(),
    type: z.enum(['person', 'character', 'product_prop', 'apparel', 'location', 'vehicle', 'other']),
    isSellable: z.boolean(),
    heroImageUrl: z.string().url().nullable(),
  }),
});

export type Favorite = z.infer<typeof favoriteSchema>;
export type AddFavoriteRequest = z.infer<typeof addFavoriteRequestSchema>;
export type RemoveFavoriteRequest = z.infer<typeof removeFavoriteRequestSchema>;
export type FavoriteWithSubject = z.infer<typeof favoriteWithSubjectSchema>;
