// src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/ds';
import { createClient } from '@supabase/supabase-js';
import { Prisma } from '@prisma/client';

// Simple server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export async function GET(req: NextRequest) {
  try {
    // Authenticate user with Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Build query filters with proper typing
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get sessions
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId: user.id,
        ...(startDate || endDate ? { startTime: dateFilter } : {}),
      },
      orderBy: {
        startTime: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}