import { FastifyInstance } from 'fastify';
import { usersPublicDb , userAddresses, uuidv7 } from '@hk26/postgres';

import { eq, and, ne } from 'drizzle-orm';
import { verifyAccessToken } from '../lib/jwt.js';

export default async function addressesRoutes(fastify: FastifyInstance) {
  // Get user's addresses
  fastify.get('/api/addresses', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);

      const addresses = await usersPublicDb.query.userAddresses.findMany({
        where: eq(userAddresses.userId, userId),
        orderBy: (userAddresses, { desc }) => [desc(userAddresses.createdAt)],
      });

      return reply.send({
        ok: true,
        addresses,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch addresses',
      });
    }
  });

  // Get address by ID
  fastify.get<{ Params: { id: string } }>('/api/addresses/:id', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);
      const { id } = request.params;

      const address = await usersPublicDb.query.userAddresses.findFirst({
        where: and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)),
      });

      if (!address) {
        return reply.status(404).send({
          ok: false,
          error: 'Address not found',
        });
      }

      return reply.send({
        ok: true,
        address,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch address',
      });
    }
  });

  // Create address
  fastify.post<{
    Body: {
      fullName: string;
      addressLine1: string;
      addressLine2?: string;
      postalCode: string;
      city: string;
      countryCode: string;
      phone?: string;
      isDefault?: boolean;
    };
  }>('/api/addresses', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);
      const { fullName, addressLine1, addressLine2, postalCode, city, countryCode, phone, isDefault } = request.body;

      // If this is set as default, unset other defaults
      if (isDefault) {
        await usersPublicDb
          .update(userAddresses)
          .set({ isDefault: false })
          .where(eq(userAddresses.userId, userId));
      }

      const [newAddress] = await usersPublicDb
        .insert(userAddresses)
        .values({
          id: uuidv7(),
          userId,
          fullName,
          addressLine1,
          addressLine2: addressLine2 || null,
          postalCode,
          city,
          countryCode,
          phone: phone || null,
          isDefault: isDefault || false,
        })
        .returning();

      return reply.status(201).send({
        ok: true,
        address: newAddress,
        message: 'Address created successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to create address',
      });
    }
  });

  // Update address
  fastify.patch<{
    Params: { id: string };
    Body: {
      fullName?: string;
      addressLine1?: string;
      addressLine2?: string;
      postalCode?: string;
      city?: string;
      countryCode?: string;
      phone?: string;
      isDefault?: boolean;
    };
  }>('/api/addresses/:id', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);
      const { id } = request.params;

      // Verify ownership
      const existingAddress = await usersPublicDb.query.userAddresses.findFirst({
        where: and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)),
      });

      if (!existingAddress) {
        return reply.status(404).send({
          ok: false,
          error: 'Address not found',
        });
      }

      // If setting as default, unset other defaults
      if (request.body.isDefault) {
        await usersPublicDb
          .update(userAddresses)
          .set({ isDefault: false })
          .where(and(eq(userAddresses.userId, userId), ne(userAddresses.id, id)));
      }

      const [updatedAddress] = await usersPublicDb
        .update(userAddresses)
        .set(request.body)
        .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
        .returning();

      return reply.send({
        ok: true,
        address: updatedAddress,
        message: 'Address updated successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to update address',
      });
    }
  });

  // Delete address
  fastify.delete<{ Params: { id: string } }>('/api/addresses/:id', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);
      const { id } = request.params;

      // Verify ownership
      const existingAddress = await usersPublicDb.query.userAddresses.findFirst({
        where: and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)),
      });

      if (!existingAddress) {
        return reply.status(404).send({
          ok: false,
          error: 'Address not found',
        });
      }

      await usersPublicDb.delete(userAddresses).where(eq(userAddresses.id, id));

      return reply.send({
        ok: true,
        message: 'Address deleted successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to delete address',
      });
    }
  });
}
