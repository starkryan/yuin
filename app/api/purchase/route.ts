import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { auth } from '@clerk/nextjs/server';

// Environment variables for the 5SIM API
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

// Error handling function
const handleError = (error: any) => {
  console.error('Purchase error:', error.response?.data || error.message || error);
  
  // Extract meaningful error message
  let errorMessage = 'Failed to purchase activation';
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  return NextResponse.json(
    { success: false, error: errorMessage },
    { status: error.response?.status || 500 }
  );
};

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { country, operator, product } = body;

    // Validate required fields
    if (!country || !operator || !product) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: country, operator, product' },
        { status: 400 }
      );
    }

    // Make request to 5SIM API
    const response = await axios.get(
      `${API_URL}/buy/activation/${country}/${operator}/${product}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    // Store the purchase in the database (TODO: implement database interaction)
    // For now, just return the 5SIM response
    return NextResponse.json(response.data);
  } catch (error: any) {
    return handleError(error);
  }
} 