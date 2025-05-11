'use server'

import { prisma } from '@/lib/ds';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

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
    // Get authenticated user from Supabase instead of NextAuth
    const { data: sessionData, error: authError } = await supabase.auth.getSession();
    
    if (authError || !sessionData.session?.user?.id) {
      throw new Error('Unauthorized');
    }
    
    const userId = sessionData.session.user.id;

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
          userId: userId, // Use authenticated user ID from Supabase session
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
        // Use a raw query to create accomplishment
        await prisma.$executeRaw`
          INSERT INTO "Accomplishment" ("id", "text", "userId", "sessionId", "createdAt", "updatedAt")
          VALUES (${crypto.randomUUID()}, ${localSession.accomplishment}, ${userId}, ${dbSession.id}, ${new Date()}, ${new Date()})
        `;
      }
    }

    // Then process accomplishments using the new session IDs
    for (const accomplishment of accomplishments) {
      if (accomplishment.sessionId) {
        const newSessionId = sessionIdMap.get(accomplishment.sessionId);
        
        if (newSessionId) {
          // Use a raw query to create accomplishment
          await prisma.$executeRaw`
            INSERT INTO "Accomplishment" ("id", "text", "userId", "sessionId", "createdAt", "updatedAt")
            VALUES (${crypto.randomUUID()}, ${accomplishment.text}, ${userId}, ${newSessionId}, ${new Date(accomplishment.date)}, ${new Date()})
          `;
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