/**
 * Prisma 7 configuration file
 * Moved database URL configuration from schema.prisma to here as required by Prisma 7
 */

export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};
