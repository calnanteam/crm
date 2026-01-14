/**
 * Prisma Client Singleton
 * 
 * This file provides a singleton instance of Prisma Client for use throughout the application.
 * In development, this prevents creating multiple instances during hot reloads.
 * 
 * Prisma 7 requires passing the database URL explicitly via adapter.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Initialize the connection pool
const pool = globalForPrisma.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with adapter
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
