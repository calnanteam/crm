/**
 * Prisma 7 configuration file
 * This file is required for migrations with Prisma 7
 */

export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || '',
    },
  },
};
