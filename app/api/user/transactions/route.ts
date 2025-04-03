import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// Define the summary type
interface TransactionSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  totalPurchases: number;
  totalRefunds: number;
}

// GET endpoint to fetch user's transaction history
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get pagination and filter parameters from the query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const type = searchParams.get('type'); // Optional filter by transaction type

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

    // Prepare filter conditions
    const whereCondition: any = { userId: user.id };
    if (type) {
      whereCondition.type = type;
    }

    // Get the total count for pagination
    const totalCount = await prisma.transaction.count({
      where: whereCondition
    });

    // Get the user's transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Get summary information
    const summaryResult = await prisma.$queryRaw<TransactionSummary[]>`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'DEPOSIT' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as "totalDeposits",
        COALESCE(SUM(CASE WHEN type = 'WITHDRAWAL' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as "totalWithdrawals",
        COALESCE(SUM(CASE WHEN type = 'PURCHASE' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as "totalPurchases",
        COALESCE(SUM(CASE WHEN type = 'REFUND' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as "totalRefunds"
      FROM "Transaction"
      WHERE "userId" = ${user.id}
    `;

    const summary: TransactionSummary = summaryResult[0] || {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalPurchases: 0,
      totalRefunds: 0
    };

    return NextResponse.json({
      success: true,
      data: transactions,
      summary,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    );
  }
} 