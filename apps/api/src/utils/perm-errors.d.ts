import type { FastifyReply } from 'fastify';

export declare function replyPermissionDenied(reply: FastifyReply, missingPerm: string): FastifyReply<import('fastify').RawServerDefault, import('http').IncomingMessage, import('http').ServerResponse<import('http').IncomingMessage>, import('fastify').RouteGenericInterface, unknown, import('fastify').FastifySchema, import('fastify').FastifyTypeProviderDefault, unknown>;
