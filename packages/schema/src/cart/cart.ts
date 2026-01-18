import { z } from 'zod';

export const cartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['active', 'checked_out', 'abandoned']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const cartItemSchema = z.object({
  cartId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  currency: z.string().length(3).default('NOK'),
  addedAt: z.string().datetime(),
});

// Request/Response schemas for API
export const addToCartRequestSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemRequestSchema = z.object({
  quantity: z.number().int().positive(),
});

export const cartWithItemsSchema = z.object({
  cart: cartSchema,
  items: z.array(
    cartItemSchema.extend({
      product: z.object({
        id: z.string().uuid(),
        title: z.string(),
        brand: z.string().nullable(),
        imageUrl: z.string().url().nullable(),
        basePrice: z.number().positive(),
        currency: z.string().length(3),
      }),
    })
  ),
  totalAmount: z.number(),
  totalItems: z.number().int(),
});

export type Cart = z.infer<typeof cartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type AddToCartRequest = z.infer<typeof addToCartRequestSchema>;
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>;
export type CartWithItems = z.infer<typeof cartWithItemsSchema>;
