import { PrismaClient } from '@prisma/client';

// Define the type for the global variable
type GlobalWithPrisma = typeof globalThis & {
  prisma: PrismaClient | undefined;
}

// Initialize client
export const prisma = (globalThis as GlobalWithPrisma).prisma || new PrismaClient();

// Only assign in development to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  (globalThis as GlobalWithPrisma).prisma = prisma;
}