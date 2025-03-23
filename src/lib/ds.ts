import { PrismaClient } from '@prisma/client';

// Add proper types for globalThis
declare global {
  namespace NodeJS {
    interface Global {
      prisma: PrismaClient | undefined;
    }
  }

  // For newer TypeScript versions that use globalThis
  interface globalThis {
    prisma: PrismaClient | undefined;
  }
}

// Initialize client with explicit types for new models
export const prisma = (global as any).prisma || new PrismaClient();

// Only assign in development to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') (global as any).prisma = prisma;