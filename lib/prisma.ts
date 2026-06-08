import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const getPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Local dev connects to Neon over a long-haul link with possible cold starts,
  // so give connections and queries more headroom off-production.
  const isProd = process.env.NODE_ENV === 'production';

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    maxUses: 750,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: isProd ? 5_000 : 15_000,
    query_timeout: isProd ? 8_000 : 20_000,
    statement_timeout: isProd ? 8_000 : 20_000,
  });
  
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

// Cache the client (and its pg.Pool) on the global in every environment.
// Without this, each serverless instance builds a fresh pool on cold start,
// multiplying connections across instances and exhausting Neon's cap.
globalForPrisma.prisma = prisma;
