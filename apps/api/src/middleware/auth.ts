import { FastifyRequest, FastifyReply } from 'fastify';
import { type TokenPayload } from '@hk26/schema';
import { verifyAccessToken } from '../lib/jwt.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid token' });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Attach user info to request
    request.user = payload;
    return undefined; // Explicitly return to satisfy consistent-return rule
  } catch {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

// Extend FastifyRequest type to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}
