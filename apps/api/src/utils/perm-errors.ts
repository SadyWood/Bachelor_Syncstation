// apps/api/src/utils/perm-errors.ts
import type { FastifyReply } from 'fastify';

export function replyPermissionDenied(reply: FastifyReply, missingPerm: string) {
  return reply.code(403).send({
    ok: false,
    code: 'PERMISSION_DENIED',
    message: `Missing permission: ${missingPerm}`,
    details: { missingPerm },
  });
}
