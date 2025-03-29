// src/server/actions/session-actions.ts
'use server'

import { prisma } from '@/lib/ds';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

// Schema validation for session recording
const sessionSchema = z.object({
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number(),
  category: z.string().optional(),
  completed: z.boolean(),
  activity: z.string().optional(),
});

// Define more specific type for the data parameter
type SessionData = z.infer<typeof sessionSchema>;

export async function recordSession(formData: FormData | null, data?: SessionData) {
  const session = data || Object.fromEntries(formData?.entries() || []);
  
  // Validate the session data
  const validatedData = sessionSchema.parse(session);
  
  // Get user from session
  const authData = await getServerSession(authOptions);
  if (!authData || !authData.user?.id) {
    throw new Error('Unauthorized');
  }

  // Create session in the database
  const savedSession = await prisma.focusSession.create({
    data: {
      userId: authData.user.id,
      startTime: new Date(validatedData.startTime),
      endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
      duration: validatedData.duration,
      category: validatedData.activity || validatedData.category, // Handle both formats
      completed: validatedData.completed,
    },
  });

  // Revalidate the dashboard and analytics paths
  revalidatePath('/dashboard');
  revalidatePath('/analytics');

  return { id: savedSession.id };
}

// Define interface for the Accomplishment model
interface Accomplishment {
  text: string;
  userId: string;
  sessionId: string;
  categories?: string | null;
}

export async function addAccomplishment(formData: FormData) {
    const text = formData.get('text') as string;
    const sessionId = formData.get('sessionId') as string;
    const categories = formData.get('categories') as string | null;
  
    if (!text || !sessionId) {
      throw new Error('Missing required fields');
    }
  
    // Get user from session
    const authData = await getServerSession(authOptions);
    if (!authData || !authData.user?.id) {
      throw new Error('Unauthorized');
    }
  
    // Check if session exists and belongs to user
    const session = await prisma.focusSession.findUnique({
      where: { id: sessionId },
    });
  
    let effectiveSessionId = sessionId;
  
    // If session doesn't exist or doesn't belong to the user, create a new one
    if (!session || session.userId !== authData.user.id) {
      console.log('Session not found in DB, creating a new one');
      // Create a placeholder session
      const newSession = await prisma.focusSession.create({
        data: {
          userId: authData.user.id,
          startTime: new Date(),
          duration: 0, // Placeholder duration
          completed: true,
          category: 'Imported',
        },
      });
      effectiveSessionId = newSession.id;
    }
  
    // Create accomplishment with the effective session ID
    // Use a type-safe approach without casting to any
    const accomplishmentData: Accomplishment = {
      text,
      userId: authData.user.id,
      sessionId: effectiveSessionId,
      categories,
    };
    
    // Use a type assertion for prisma.accomplishment
    // or define a proper type for your Prisma client
    const accomplishment = await (prisma as unknown as { 
      accomplishment: { 
        create: (data: { data: Accomplishment }) => Promise<{ id: string }> 
      } 
    }).accomplishment.create({
      data: accomplishmentData
    });
  
    revalidatePath('/dashboard');
    revalidatePath('/analytics');
  
    return { success: true, id: accomplishment.id };
  }