import { FastifyInstance } from 'fastify';
import { catalogDemoDb , subjects, subjectProducts, products } from '@hk26/postgres';

import { eq } from 'drizzle-orm';

export default async function subjectsRoutes(fastify: FastifyInstance) {
  // Get all subjects
  fastify.get('/api/subjects', async (request, reply) => {
    try {
      const allSubjects = await catalogDemoDb.query.subjects.findMany({
        orderBy: (subjects, { desc }) => [desc(subjects.createdAt)],
      });

      return reply.send({
        ok: true,
        subjects: allSubjects,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch subjects',
      });
    }
  });

  // Get products for a subject
  fastify.get<{ Params: { id: string } }>('/api/subjects/:id/products', async (request, reply) => {
    try {
      const { id } = request.params;

      // Verify subject exists
      const subject = await catalogDemoDb.query.subjects.findFirst({
        where: eq(subjects.id, id),
      });

      if (!subject) {
        return reply.status(404).send({
          ok: false,
          error: 'Subject not found',
        });
      }

      // Get linked products
      const linkedProducts = await catalogDemoDb
        .select({
          id: products.id,
          title: products.title,
          brand: products.brand,
          imageUrl: products.imageUrl,
          basePrice: products.basePrice,
          currency: products.currency,
          productUrl: products.productUrl,
          description: products.description,
          metadata: products.metadata,
        })
        .from(subjectProducts)
        .innerJoin(products, eq(subjectProducts.productId, products.id))
        .where(eq(subjectProducts.subjectId, id))
        .orderBy(subjectProducts.sortOrder);

      return reply.send({
        ok: true,
        products: linkedProducts,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch products for subject',
      });
    }
  });

  // Get subject by ID with products
  fastify.get<{ Params: { id: string } }>('/api/subjects/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const subject = await catalogDemoDb.query.subjects.findFirst({
        where: eq(subjects.id, id),
      });

      if (!subject) {
        return reply.status(404).send({
          ok: false,
          error: 'Subject not found',
        });
      }

      // Get linked products
      const linkedProducts = await catalogDemoDb
        .select({
          id: products.id,
          title: products.title,
          brand: products.brand,
          imageUrl: products.imageUrl,
          basePrice: products.basePrice,
          currency: products.currency,
          productUrl: products.productUrl,
          description: products.description,
          metadata: products.metadata,
        })
        .from(subjectProducts)
        .innerJoin(products, eq(subjectProducts.productId, products.id))
        .where(eq(subjectProducts.subjectId, id))
        .orderBy(subjectProducts.sortOrder);

      return reply.send({
        ok: true,
        subject,
        products: linkedProducts,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch subject',
      });
    }
  });

  // Get subjects by type
  fastify.get<{ Querystring: { type?: string } }>('/api/subjects/filter/by-type', async (request, reply) => {
    try {
      const { type } = request.query;

      if (!type) {
        return reply.status(400).send({
          ok: false,
          error: 'Type query parameter is required',
        });
      }

      const filteredSubjects = await catalogDemoDb.query.subjects.findMany({
        where: eq(subjects.type, type),
        orderBy: (subjects, { desc }) => [desc(subjects.createdAt)],
      });

      return reply.send({
        ok: true,
        subjects: filteredSubjects,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch subjects by type',
      });
    }
  });

  // Get sellable subjects (subjects with products)
  fastify.get('/api/subjects/sellable', async (request, reply) => {
    try {
      const sellableSubjects = await catalogDemoDb.query.subjects.findMany({
        where: eq(subjects.isSellable, true),
        orderBy: (subjects, { desc }) => [desc(subjects.createdAt)],
      });

      return reply.send({
        ok: true,
        subjects: sellableSubjects,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch sellable subjects',
      });
    }
  });
}
