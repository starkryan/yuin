import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Creating test user...');
    
    // Check database connection
    await prisma.$connect();
    console.log('Database connection established');
    
    // Create a test user
    const testUser = await prisma.user.upsert({
      where: { 
        email: 'test@example.com' 
      },
      update: {
        username: 'testuser',
        name: 'Test User',
        balance: 100,
      },
      create: {
        clerkId: 'test_clerk_id',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        balance: 100,
      },
    });
    
    console.log('Test user created:', testUser);
    
    return NextResponse.json({
      success: true,
      user: testUser
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    
    let errorMessage = 'Unknown error creating test user';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 