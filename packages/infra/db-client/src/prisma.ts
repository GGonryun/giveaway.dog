import 'server-only';

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient;
}

export type PrismaTransactionalClient = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export default prisma;
