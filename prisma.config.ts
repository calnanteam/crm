/**
 * Prisma 7 configuration file
 * This file is required for migrations with Prisma 7
 */

import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Vercel provides POSTGRES_URL, fall back to DATABASE_URL for local dev
const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing required environment variable: POSTGRES_URL or DATABASE_URL must be set');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
