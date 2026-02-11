import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger } from '@hoolsy/logger';
import dotenv from 'dotenv';
import { z } from 'zod';

const log = createLogger('env');

const _unused_dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),

  USERS_DB_URL: z.string().url(),
  WORKSTATION_DB_URL: z.string().url(),
  MARKETPLACE_DB_URL: z.string().url().optional(),
  SYNCSTATION_DB_URL: z.string().url(),

  JWT_SECRET: z.string().min(16),
  COOKIE_SECRET: z.string().min(16),
  UPLOAD_DIR: z.string().default('./uploads/syncstation'),

  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  log.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}
export const env = parsed.data;
