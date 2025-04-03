import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Server-side environment variables
const API_URL = process.env.FIVESIM_BASE_URL;
const API_KEY = process.env.FIVESIM_API_KEY;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    if (!id || id === 'undefined' || id === 'NaN') {
      return NextResponse.json(
        { error: 'Valid activation ID is required' },
        { status: 400 }
      );
    }

    const response = await axios.get(`${API_URL}/user/finish/${id}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`Error finishing activation ${id}:`, error);
    return NextResponse.json(
      { error: `Failed to finish activation ${id}` },
      { status: 500 }
    );
  }
} 