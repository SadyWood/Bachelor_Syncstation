export function replyPermissionDenied(reply, missingPerm) {
  return reply.code(403).send({
    ok: false,
    code: 'PERMISSION_DENIED',
    message: `Missing permission: ${missingPerm}`,
    details: { missingPerm },
  });
}
