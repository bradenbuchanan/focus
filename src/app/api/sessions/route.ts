// src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/ds';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user - use getServerSession instead of auth
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Build query filters
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get sessions without accomplishments first - we'll fix this after the migration
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId: session.user.id,
        ...(startDate || endDate ? { startTime: dateFilter } : {}),
      },
      orderBy: {
        startTime: 'desc',
      },
      take: limit,
      // We'll uncomment this after the migration is applied and Prisma client is regenerated
      // include: {
      //   accomplishments: true,
      // },
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