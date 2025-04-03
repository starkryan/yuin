import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Simulating Clerk webhook for user.created...');
    
    // Check database connection
    await prisma.$connect();
    console.log('Database connection established');
    
    // Create a user directly in the database to simulate webhook
    const userId = 'user_' + Math.random().toString(36).substring(2, 10);
    const userEmail = `user_${userId}@example.com`;
    
    const user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: userEmail,
        username: `user_${userId}`,
        name: 'Simulated User',
        balance: 0,
      }
    });
    
    console.log('Simulated webhook user created:', user);
    
    // Now check if the user exists
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      message: 'Webhook simulation completed',
      user: user,
      totalUsers: userCount
    });
  } catch (error) {
    console.error('Error simulating webhook:', error);
    
    let errorMessage = 'Unknown error simulating webhook';
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