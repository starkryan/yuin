import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting Clerk webhook debug check...');
    
    // Check if webhook secret is configured
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET is not configured');
      return NextResponse.json({
        success: false,
        error: 'Webhook secret not configured',
        help: 'Set CLERK_WEBHOOK_SECRET in your environment variables'
      }, { status: 500 });
    }
    
    // Check database connection
    await prisma.$connect();
    console.log('Database connection established');
    
    // Count users
    const userCount = await prisma.user.count();
    console.log(`Database has ${userCount} users`);
    
    // Get current user if authenticated
    const session = await auth();
    
    // Check if any users have been created via webhook
    const clerkUsers = await prisma.user.findMany({
      where: {
        clerkId: {
          not: ''
        }
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        username: true,
        createdAt: true
      },
      take: 5
    });
    
    // Return diagnostics
    return NextResponse.json({
      success: true,
      webhook: {
        isConfigured: !!webhookSecret,
        secretConfigured: !!webhookSecret
      },
      database: {
        connected: true,
        userCount,
        recentUsers: clerkUsers
      },
      auth: {
        currentUser: session?.userId || null,
        isSignedIn: !!session?.userId
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        webhookSecretLength: webhookSecret?.length || 0
      }
    });
  } catch (error) {
    console.error('Error in Clerk debug endpoint:', error);
    
    let errorMessage = 'Unknown error checking Clerk configuration';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        webhookSecretConfigured: !!process.env.CLERK_WEBHOOK_SECRET
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 