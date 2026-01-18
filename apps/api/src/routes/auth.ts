import { FastifyInstance } from 'fastify';
import { usersPublicDb , users, uuidv7 } from '@hk26/postgres';

import { loginRequestSchema, loginResponseSchema, registerRequestSchema } from '@hk26/schema';
import { eq } from 'drizzle-orm';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

export default async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint
  fastify.post('/auth/login', async (request, reply) => {
    try {
      const body = loginRequestSchema.parse(request.body);

      // Find user by email
      const user = await usersPublicDb.query.users.findFirst({
        where: eq(users.email, body.email),
      });

      if (!user || !verifyPassword(body.password, user.passwordHash)) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // Generate tokens
      const payload = {
        userId: user.id,
        email: user.email,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      const response = loginResponseSchema.parse({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          birthdate: user.birthdate,
          isVerified: user.isVerified,
        },
      });

      return reply.send(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.message,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'An error occurred during login',
      });
    }
  });

  // Register endpoint
  fastify.post('/auth/register', async (request, reply) => {
    try {
      const body = registerRequestSchema.parse(request.body);

      // Check if user already exists
      const existingUser = await usersPublicDb.query.users.findFirst({
        where: eq(users.email, body.email),
      });

      if (existingUser) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'User with this email already exists',
        });
      }

      // Hash password and create user
      const passwordHash = hashPassword(body.password);

      const [newUser] = await usersPublicDb
        .insert(users)
        .values({
          id: uuidv7(),
          email: body.email,
          passwordHash,
          fullName: body.fullName,
          birthdate: body.birthdate,
          isVerified: false,
        })
        .returning();

      return reply.status(201).send({
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          birthdate: newUser.birthdate,
          isVerified: newUser.isVerified,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.message,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'An error occurred during registration',
      });
    }
  });

  // Refresh token endpoint
  fastify.post('/auth/refresh', async (request, reply) => {
    try {
      fastify.log.info({ body: request.body }, 'Refresh request received');

      const { refreshToken } = request.body as { refreshToken: string };

      if (!refreshToken) {
        fastify.log.warn('No refresh token provided in request body');
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Refresh token is required',
        });
      }

      fastify.log.info({ tokenLength: refreshToken.length }, 'Attempting to verify refresh token');
      const decoded = verifyRefreshToken(refreshToken);
      fastify.log.info({ decoded }, 'Refresh token verified successfully');

      // Create clean payload without iat and exp
      const payload = {
        userId: decoded.userId,
        email: decoded.email,
      };

      // Generate new tokens
      const newAccessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      return reply.send({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Refresh token verification failed');
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }
  });

  // Logout endpoint (client-side token invalidation)
  fastify.post('/auth/logout', async (request, reply) => 
    // In a stateless JWT setup, logout is handled client-side by removing tokens
    // For stateful sessions, you would invalidate the token in a database/cache
     reply.send({ message: 'Logged out successfully' })
  );
}
