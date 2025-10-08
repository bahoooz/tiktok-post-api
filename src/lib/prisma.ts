import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'], // tu peux enlever 'query' si trop verbeux
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
