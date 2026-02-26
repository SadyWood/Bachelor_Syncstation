// apps/api/src/types/fastify-augment.d.ts
import 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    can: (req: FastifyRequest, perm: string) => Promise<boolean>;
    needsPerm: (perm: string) => (req: FastifyRequest, reply: FastifyReply) => Promise<void | undefined>;
  }
}
