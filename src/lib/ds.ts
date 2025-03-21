import { PrismaClient } from '@prisma/client';

// Declare global variable type
declare global {
  var prisma: PrismaClient | undefined;
}

// Initialize client with explicit types for new models
export const prisma = globalThis.prisma || new PrismaClient();

// Only assign in development to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;