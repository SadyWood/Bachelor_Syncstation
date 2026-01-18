import { FastifyInstance } from 'fastify';
import { usersPublicDb, catalogDemoDb , userFavorites, subjects } from '@hk26/postgres';

import { eq, and } from 'drizzle-orm';
import { verifyAccessToken } from '../lib/jwt.js';

export default async function favoritesRoutes(fastify: FastifyInstance) {
  // Get user's favorites
  fastify.get('/api/favorites', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);

      // Get favorites with subject details
      const favorites = await usersPublicDb
        .select({
          userId: userFavorites.userId,
          subjectId: userFavorites.subjectId,
          createdAt: userFavorites.createdAt,
        })
        .from(userFavorites)
        .where(eq(userFavorites.userId, userId));

      // Fetch subject details from catalog_demo
      const favoritesWithSubjects = await Promise.all(
        favorites.map(async (fav) => {
          const subject = await catalogDemoDb.query.subjects.findFirst({
            where: eq(subjects.id, fav.subjectId),
          });
          return {
            ...fav,
            subject,
          };
        })
      );

      return reply.send({
        ok: true,
        favorites: favoritesWithSubjects,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch favorites',
      });
    }
  });

  // Add favorite
  fastify.post<{ Body: { subjectId: string } }>('/api/favorites', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);
      const { subjectId } = request.body;

      if (!subjectId) {
        return reply.status(400).send({
          ok: false,
          error: 'subjectId is required',
        });
      }

      // Check if already favorited
      const existing = await usersPublicDb.query.userFavorites.findFirst({
        where: and(eq(userFavorites.userId, userId), eq(userFavorites.subjectId, subjectId)),
      });

      if (existing) {
        return reply.status(409).send({
          ok: false,
          error: 'Subject already favorited',
        });
      }

      // Add favorite
      await usersPublicDb.insert(userFavorites).values({
        userId,
        subjectId,
      });

      return reply.status(201).send({
        ok: true,
        message: 'Favorite added',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to add favorite',
      });
    }
  });

  // Remove favorite
  fastify.delete<{ Params: { subjectId: string } }>('/api/favorites/:subjectId', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);
      const { subjectId } = request.params;

      await usersPublicDb
        .delete(userFavorites)
        .where(and(eq(userFavorites.userId, userId), eq(userFavorites.subjectId, subjectId)));

      return reply.send({
        ok: true,
        message: 'Favorite removed',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to remove favorite',
      });
    }
  });
}
