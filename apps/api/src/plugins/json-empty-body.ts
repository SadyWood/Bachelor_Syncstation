import type { FastifyPluginAsync } from 'fastify';

/**
 * Workaround: some clients send Content-Type: application/json with empty body.
 * Fastify's default JSON parser throws. We coerce "" -> {}.
 */
export const jsonEmptyBodyPlugin: FastifyPluginAsync = async (app) => {
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      const strBody = typeof body === 'string' ? body : body.toString('utf8');
      if (!strBody || strBody.trim() === '') return done(null, {});
      return done(null, JSON.parse(strBody));
    } catch (e) {
      done(e as Error);
    }
  });
};
