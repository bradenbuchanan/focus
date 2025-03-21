'use server'

import { prisma } from '@/lib/ds';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Validation schema for migration data
const sessionSchema = z.array(z.object({
  id: z.string().optional(),
  date: z.string(),
  localDate: z.string().optional(),
  duration: z.number(),
  type: z.string(),
  completed: z.boolean(),
  activity: z.string().optional(),
  accomplishment: z.string().optional(),
}));

const accomplishmentSchema = z.array(z.object({
  id: z.string().optional(),
  text: z.string(),
  date: z.string(),
  sessionId: z.string().optional(),
}));

export async function migrateLocalData(formData: FormData) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new Error('Unauthorized');
    }

    // Parse the JSON data from formData
    const sessionsJson = formData.get('sessions') as string;
    const accomplishmentsJson = formData.get('accomplishments') as string;

    if (!sessionsJson) {
      return { success: false, error: 'No session data provided' };
    }

    // Parse and validate the data
    const sessions = sessionSchema.parse(JSON.parse(sessionsJson));
    const accomplishments = accomplishmentsJson 
      ? accomplishmentSchema.parse(JSON.parse(accomplishmentsJson))
      : [];

    // Create a map to store original session IDs to new database IDs
    const sessionIdMap = new Map<string, string>();

    // Process sessions first
    for (const localSession of sessions) {
      const originalId = localSession.id || '';
      
      // Create the session in the database
      const dbSession = await prisma.focusSession.create({
        data: {
          userId: session.user.id, // Use authenticated user ID from server session
          startTime: new Date(localSession.date),
          endTime: new Date(new Date(localSession.date).getTime() + (localSession.duration * 1000)),
          duration: localSession.duration,
          category: localSession.activity,
          completed: localSession.completed,
        },
      });

      // Store the mapping
      sessionIdMap.set(originalId, dbSession.id);

      // If the session has an accomplishment directly attached
      if (localSession.accomplishment) {
        await (prisma as any).accomplishment.create({
          data: {
            text: localSession.accomplishment,
            userId: session.user.id, // Use authenticated user ID from server session
            sessionId: dbSession.id,
          },
        });
      }
    }

    // Then process accomplishments using the new session IDs
    for (const accomplishment of accomplishments) {
      if (accomplishment.sessionId) {
        const newSessionId = sessionIdMap.get(accomplishment.sessionId);
        
        if (newSessionId) {
          await (prisma as any).accomplishment.create({
            data: {
              text: accomplishment.text,
              userId: session.user.id, // Use authenticated user ID from server session
              sessionId: newSessionId,
              createdAt: new Date(accomplishment.date),
            },
          });
        }
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard');
    revalidatePath('/analytics');
    revalidatePath('/settings');

    return { 
      success: true, 
      sessionsCount: sessions.length,
      accomplishmentsCount: accomplishments.length
    };
  } catch (error) {
    console.error('Migration error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}