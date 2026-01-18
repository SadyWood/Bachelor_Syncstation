import { z } from 'zod';

export const orderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['created', 'paid', 'cancelled', 'refunded']),
  totalAmount: z.number().positive(),
  currency: z.string().length(3).default('NOK'),
  shippingAddressSnapshot: z.record(z.unknown()), // JSONB snapshot of address
  createdAt: z.string().datetime(),
  paidAt: z.string().datetime().nullable(),
});

export const orderItemSchema = z.object({
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  subjectId: z.string().uuid().nullable(), // Optional: link to subject
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  currency: z.string().length(3).default('NOK'),
});

export const paymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  provider: z.enum(['stripe', 'vipps', 'paypal']),
  providerPaymentId: z.string().nullable(),
  status: z.enum(['initiated', 'succeeded', 'failed']),
  createdAt: z.string().datetime(),
});

// Request schemas
export const createOrderRequestSchema = z.object({
  shippingAddressId: z.string().uuid(),
  paymentProvider: z.enum(['stripe', 'vipps', 'paypal']).optional(),
});

// Response schemas
export const orderWithItemsSchema = z.object({
  order: orderSchema,
  items: z.array(
    orderItemSchema.extend({
      product: z.object({
        id: z.string().uuid(),
        title: z.string(),
        brand: z.string().nullable(),
        imageUrl: z.string().url().nullable(),
      }),
    })
  ),
});

export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type OrderWithItems = z.infer<typeof orderWithItemsSchema>;
