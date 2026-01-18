import { FastifyInstance } from 'fastify';
import { usersPublicDb, catalogDemoDb , carts, cartItems, products, uuidv7 } from '@hk26/postgres';

import { eq, and } from 'drizzle-orm';
import { verifyAccessToken } from '../lib/jwt.js';

export default async function cartRoutes(fastify: FastifyInstance) {
  // Get user's cart
  fastify.get('/api/cart', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);

      // Get or create active cart
      let cart = await usersPublicDb.query.carts.findFirst({
        where: and(eq(carts.userId, userId), eq(carts.status, 'active')),
      });

      if (!cart) {
        // Create new cart
        const [newCart] = await usersPublicDb.insert(carts).values({
          id: uuidv7(),
          userId,
          status: 'active',
        }).returning();
        cart = newCart;
      }

      // Get cart items with product details
      const items = await usersPublicDb
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, cart.id));

      // Fetch product details from catalog
      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          const product = await catalogDemoDb.query.products.findFirst({
            where: eq(products.id, item.productId),
          });
          return {
            ...item,
            product,
          };
        })
      );

      // Calculate total
      const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);

      return reply.send({
        ok: true,
        cart,
        items: itemsWithProducts,
        totalAmount,
        totalItems: items.length,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch cart',
      });
    }
  });

  // Add item to cart
  fastify.post<{ Body: { productId: string; quantity?: number } }>('/api/cart/items', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);
      const { productId, quantity = 1 } = request.body;

      if (!productId) {
        return reply.status(400).send({
          ok: false,
          error: 'productId is required',
        });
      }

      // Get product details
      const product = await catalogDemoDb.query.products.findFirst({
        where: eq(products.id, productId),
      });

      if (!product) {
        return reply.status(404).send({
          ok: false,
          error: 'Product not found',
        });
      }

      // Get or create active cart
      let cart = await usersPublicDb.query.carts.findFirst({
        where: and(eq(carts.userId, userId), eq(carts.status, 'active')),
      });

      if (!cart) {
        const [newCart] = await usersPublicDb.insert(carts).values({
          id: uuidv7(),
          userId,
          status: 'active',
        }).returning();
        cart = newCart;
      }

      // Check if item already in cart
      const existingItem = await usersPublicDb.query.cartItems.findFirst({
        where: and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
      });

      if (existingItem) {
        // Update quantity
        await usersPublicDb
          .update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));
      } else {
        // Add new item
        await usersPublicDb.insert(cartItems).values({
          cartId: cart.id,
          productId,
          quantity,
          unitPrice: product.basePrice,
          currency: product.currency,
        });
      }

      // Update cart timestamp
      await usersPublicDb.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));

      return reply.status(201).send({
        ok: true,
        message: 'Item added to cart',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to add item to cart',
      });
    }
  });

  // Update cart item quantity
  fastify.patch<{ Params: { productId: string }; Body: { quantity: number } }>(
    '/api/cart/items/:productId',
    async (request, reply) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          return reply.status(401).send({ ok: false, error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);
        const { userId } = verifyAccessToken(token);
        const { productId } = request.params;
        const { quantity } = request.body;

        if (!quantity || quantity < 1) {
          return reply.status(400).send({
            ok: false,
            error: 'Quantity must be at least 1',
          });
        }

        // Get active cart
        const cart = await usersPublicDb.query.carts.findFirst({
          where: and(eq(carts.userId, userId), eq(carts.status, 'active')),
        });

        if (!cart) {
          return reply.status(404).send({
            ok: false,
            error: 'Cart not found',
          });
        }

        // Update item quantity
        await usersPublicDb
          .update(cartItems)
          .set({ quantity })
          .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));

        return reply.send({
          ok: true,
          message: 'Cart item updated',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          ok: false,
          error: 'Failed to update cart item',
        });
      }
    }
  );

  // Remove item from cart
  fastify.delete<{ Params: { productId: string } }>('/api/cart/items/:productId', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);
      const { productId } = request.params;

      // Get active cart
      const cart = await usersPublicDb.query.carts.findFirst({
        where: and(eq(carts.userId, userId), eq(carts.status, 'active')),
      });

      if (!cart) {
        return reply.status(404).send({
          ok: false,
          error: 'Cart not found',
        });
      }

      // Remove item
      await usersPublicDb
        .delete(cartItems)
        .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));

      return reply.send({
        ok: true,
        message: 'Item removed from cart',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to remove item from cart',
      });
    }
  });
}
