import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import axios from 'axios';
import { auth } from '@clerk/nextjs/server';

// Environment variables for the 5SIM API
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

// GET endpoint to fetch user's balance
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Make request to 5SIM API
    const response = await axios.get(
      `${API_URL}/user/profile`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    // Return the user profile data
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching user profile:', error.response?.data || error.message || error);
    
    // Extract meaningful error message
    let errorMessage = 'Failed to fetch user profile';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
}

// POST endpoint to add to user's balance
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, reference, description } = body;
    
    // Validate the amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Find the user
      const user = await tx.user.findUnique({
        where: { clerkId: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create a deposit transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          amount: Number(amount),
          type: 'DEPOSIT',
          status: 'COMPLETED',
          description: description || 'Balance deposit',
          reference: reference || `deposit-${Date.now()}`
        }
      });

      // Update the user's balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: {
            increment: Number(amount)
          }
        },
        select: { balance: true }
      });

      return {
        user: updatedUser,
        transaction
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        newBalance: result.user.balance,
        transaction: {
          id: result.transaction.id,
          amount: result.transaction.amount,
          type: result.transaction.type,
          status: result.transaction.status,
          createdAt: result.transaction.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Error adding balance:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to add balance';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 