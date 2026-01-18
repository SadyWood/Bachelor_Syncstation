import { z } from 'zod';

// JWT Token Payload
export const tokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
});

export type TokenPayload = z.infer<typeof tokenPayloadSchema>;
