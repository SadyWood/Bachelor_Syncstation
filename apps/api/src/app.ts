import Fastify from 'fastify';
import cors from '@fastify/cors';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import subjectsRoutes from './routes/subjects.js';
import contentRoutes from './routes/content.js';
import productsRoutes from './routes/products.js';
import favoritesRoutes from './routes/favorites.js';
import cartRoutes from './routes/cart.js';
import ordersRoutes from './routes/orders.js';
import addressesRoutes from './routes/addresses.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Register CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
  });

  // Register routes
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(subjectsRoutes);
  await app.register(contentRoutes);
  await app.register(productsRoutes);
  await app.register(favoritesRoutes);
  await app.register(cartRoutes);
  await app.register(ordersRoutes);
  await app.register(addressesRoutes);

  return app;
}
