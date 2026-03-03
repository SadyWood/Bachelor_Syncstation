// apps/api/src/types/fastify-augment.d.ts
// noinspection ES6UnusedImports

import 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';

// Augments Fastify's built-in types with our custom decorators and request properties -  Allows typescript to know about things we add at runtime
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    can: (req: FastifyRequest, perm: string) => Promise<boolean>;
    needsPerm: (
      perm: string,
    ) => (req: FastifyRequest, reply: FastifyReply) => Promise<void | undefined>;
  }
}

// Tell TypeScript after authenticate runs, req.user has this shape
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}
