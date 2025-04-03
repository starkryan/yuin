import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting database debug check...');
    
    // Check database connection
    await prisma.$connect();
    console.log('Database connection established');
    
    // Count users
    const userCount = await prisma.user.count();
    console.log(`Database has ${userCount} users`);
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        username: true,
        name: true,
        createdAt: true
      },
      take: 10
    });
    
    // Return diagnostics
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        userCount,
        users
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL?.substring(0, 20) + '...' // Show partial URL for security
      }
    });
  } catch (error) {
    console.error('Error in database debug endpoint:', error);
    
    let errorMessage = 'Unknown error checking database';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      environment: {
        NODE_ENV: process.env.NODE_ENV
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 