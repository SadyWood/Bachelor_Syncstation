import { FastifyInstance } from 'fastify';
import { usersPublicDb, catalogDemoDb , orders, orderItems, carts, cartItems, userAddresses, products, uuidv7 } from '@hk26/postgres';

import { eq, and, desc } from 'drizzle-orm';
import { verifyAccessToken } from '../lib/jwt.js';

export default async function ordersRoutes(fastify: FastifyInstance) {
  // Get user's orders
  fastify.get('/api/orders', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);

      // Get orders
      const userOrders = await usersPublicDb.query.orders.findMany({
        where: eq(orders.userId, userId),
        orderBy: [desc(orders.createdAt)],
      });

      // Get items for each order
      const ordersWithItems = await Promise.all(
        userOrders.map(async (order) => {
          const items = await usersPublicDb
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          // Fetch product details
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

          return {
            order,
            items: itemsWithProducts,
          };
        })
      );

      return reply.send({
        ok: true,
        orders: ordersWithItems,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch orders',
      });
    }
  });

  // Get order by ID
  fastify.get<{ Params: { id: string } }>('/api/orders/:id', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);
      const { id } = request.params;

      // Get order
      const order = await usersPublicDb.query.orders.findFirst({
        where: and(eq(orders.id, id), eq(orders.userId, userId)),
      });

      if (!order) {
        return reply.status(404).send({
          ok: false,
          error: 'Order not found',
        });
      }

      // Get order items
      const items = await usersPublicDb
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, id));

      // Fetch product details
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

      return reply.send({
        ok: true,
        order,
        items: itemsWithProducts,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch order',
      });
    }
  });

  // Create order (checkout)
  fastify.post<{ Body: { shippingAddressId: string } }>('/api/orders', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);
      const { shippingAddressId } = request.body;

      if (!shippingAddressId) {
        return reply.status(400).send({
          ok: false,
          error: 'shippingAddressId is required',
        });
      }

      // Get shipping address
      const address = await usersPublicDb.query.userAddresses.findFirst({
        where: and(eq(userAddresses.id, shippingAddressId), eq(userAddresses.userId, userId)),
      });

      if (!address) {
        return reply.status(404).send({
          ok: false,
          error: 'Shipping address not found',
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

      // Get cart items
      const items = await usersPublicDb
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, cart.id));

      if (items.length === 0) {
        return reply.status(400).send({
          ok: false,
          error: 'Cart is empty',
        });
      }

      // Calculate total
      const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);

      // Create address snapshot
      const addressSnapshot = {
        fullName: address.fullName,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        postalCode: address.postalCode,
        city: address.city,
        countryCode: address.countryCode,
        phone: address.phone,
      };

      // Create order
      const [newOrder] = await usersPublicDb
        .insert(orders)
        .values({
          id: uuidv7(),
          userId,
          status: 'created',
          totalAmount: totalAmount.toString(),
          currency: 'NOK',
          shippingAddressSnapshot: addressSnapshot,
        })
        .returning();

      // Create order items
      await usersPublicDb.insert(orderItems).values(
        items.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          currency: item.currency,
        }))
      );

      // Mark cart as checked out
      await usersPublicDb.update(carts).set({ status: 'checked_out' }).where(eq(carts.id, cart.id));

      return reply.status(201).send({
        ok: true,
        order: newOrder,
        message: 'Order created successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to create order',
      });
    }
  });
}
