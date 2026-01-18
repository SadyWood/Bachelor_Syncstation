import { FastifyInstance } from 'fastify';
import { catalogDemoDb , content, contentSubjects, subjects } from '@hk26/postgres';

import { eq, and, lte, gte } from 'drizzle-orm';

export default async function contentRoutes(fastify: FastifyInstance) {
  // Get all content (episodes/movies)
  fastify.get('/api/content', async (request, reply) => {
    try {
      const allContent = await catalogDemoDb.query.content.findMany({
        orderBy: (content, { desc }) => [desc(content.createdAt)],
      });

      return reply.send({
        ok: true,
        content: allContent,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch content',
      });
    }
  });

  // Get content by ID
  fastify.get<{ Params: { id: string } }>('/api/content/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const contentItem = await catalogDemoDb.query.content.findFirst({
        where: eq(content.id, id),
      });

      if (!contentItem) {
        return reply.status(404).send({
          ok: false,
          error: 'Content not found',
        });
      }

      return reply.send({
        ok: true,
        content: contentItem,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch content',
      });
    }
  });

  // Get timeline for content (which subjects appear when)
  // Query params:
  //   - currentTime: current playback position in seconds
  //   - lookahead: how many seconds ahead to fetch (default: 30)
  //   - includeActive: include subjects currently visible (default: true)
  fastify.get<{
    Params: { id: string };
    Querystring: {
      currentTime?: string;
      lookahead?: string;
      includeActive?: string | boolean;
    }
  }>('/api/content/:id/timeline', async (request, reply) => {
    try {
      const { id } = request.params;
      const {query} = request;

      // Parse query params (they come as strings from URL)
      const currentTime = query.currentTime !== undefined ? Number(query.currentTime) : undefined;
      const lookahead = query.lookahead !== undefined ? Number(query.lookahead) : 30;
      const includeActive = query.includeActive !== false && query.includeActive !== 'false';

      // Get content to verify it exists
      const contentItem = await catalogDemoDb.query.content.findFirst({
        where: eq(content.id, id),
      });

      if (!contentItem) {
        return reply.status(404).send({
          ok: false,
          error: 'Content not found',
        });
      }

      // Build where clause
      let whereClause = eq(contentSubjects.contentId, id);

      // If currentTime is provided, filter subjects in the time window
      if (currentTime !== undefined) {
        const windowEnd = currentTime + lookahead;

        if (includeActive) {
          // Include subjects that:
          // 1. Are currently visible (startTime <= currentTime AND endTime >= currentTime)
          // 2. Will become visible in the lookahead window (startTime > currentTime AND startTime <= windowEnd)
          whereClause = and(
            eq(contentSubjects.contentId, id),
            lte(contentSubjects.startTime, windowEnd),
            gte(contentSubjects.endTime, currentTime)
          ) as any;
        } else {
          // Only include upcoming subjects (not currently visible)
          whereClause = and(
            eq(contentSubjects.contentId, id),
            gte(contentSubjects.startTime, currentTime),
            lte(contentSubjects.startTime, windowEnd)
          ) as any;
        }
      }

      // Get subjects in timeline
      const timeline = await catalogDemoDb
        .select({
          id: contentSubjects.id,
          subjectId: contentSubjects.subjectId,
          startTime: contentSubjects.startTime,
          endTime: contentSubjects.endTime,
          metadata: contentSubjects.metadata,
          subject: {
            id: subjects.id,
            label: subjects.label,
            type: subjects.type,
            isSellable: subjects.isSellable,
            heroImageUrl: subjects.heroImageUrl,
            externalUrl: subjects.externalUrl,
          },
        })
        .from(contentSubjects)
        .innerJoin(subjects, eq(contentSubjects.subjectId, subjects.id))
        .where(whereClause)
        .orderBy(contentSubjects.startTime);

      // Add metadata about the query for client-side scheduling
      const timelineWithStatus = timeline.map(item => ({
        ...item,
        // Helper for client: is this subject currently visible?
        isActive: currentTime !== undefined
          ? item.startTime <= currentTime && item.endTime >= currentTime
          : null,
        // Helper for client: seconds until this subject appears
        secondsUntilVisible: currentTime !== undefined && item.startTime > currentTime
          ? item.startTime - currentTime
          : 0,
      }));

      return reply.send({
        ok: true,
        content: contentItem,
        timeline: timelineWithStatus,
        // Return query params for client reference
        sync: {
          currentTime: currentTime ?? null,
          lookahead,
          windowEnd: currentTime !== undefined ? currentTime + lookahead : null,
          includeActive,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch content timeline',
      });
    }
  });
}
