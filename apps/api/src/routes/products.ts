import { FastifyInstance } from 'fastify';
import { catalogDemoDb , products } from '@hk26/postgres';

import { eq } from 'drizzle-orm';

export default async function productsRoutes(fastify: FastifyInstance) {
  // Get all products
  fastify.get('/api/products', async (request, reply) => {
    try {
      const allProducts = await catalogDemoDb.query.products.findMany({
        orderBy: (products, { desc }) => [desc(products.createdAt)],
      });

      return reply.send({
        ok: true,
        products: allProducts,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch products',
      });
    }
  });

  // Get product by ID
  fastify.get<{ Params: { id: string } }>('/api/products/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const product = await catalogDemoDb.query.products.findFirst({
        where: eq(products.id, id),
      });

      if (!product) {
        return reply.status(404).send({
          ok: false,
          error: 'Product not found',
        });
      }

      return reply.send({
        ok: true,
        product,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch product',
      });
    }
  });
}
