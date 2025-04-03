import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// GET endpoint to fetch user's activations history
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get pagination parameters from the query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the total count for pagination
    const totalCount = await prisma.activation.count({
      where: { userId: user.id }
    });

    // Get the user's activations with pagination
    const activations = await prisma.activation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        // Include related transaction data
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: activations,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user activations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activations history' },
      { status: 500 }
    );
  }
} 