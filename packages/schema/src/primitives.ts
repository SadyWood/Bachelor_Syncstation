import { z } from 'zod';

/** Standard success response for operations that return only ok: true */
export const SuccessResponse = z.object({
  ok: z.literal(true),
});

/** Standard error-body vi svarer med fra API. */
export const ErrorResponse = z.object({
  ok: z.literal(false),
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});
export type ErrorReply = z.infer<typeof ErrorResponse>;
