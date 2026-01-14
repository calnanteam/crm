/**
 * Prisma 7 configuration file
 * This file is required for migrations with Prisma 7
 */
import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || '',
    },
  },
});
