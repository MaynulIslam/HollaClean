/**
 * Prisma client singleton.
 * Reused across hot reloads so we don't exhaust DB connections.
 */
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };
