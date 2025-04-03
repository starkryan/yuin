import { NextResponse } from 'next/server';
import axios from 'axios';

// Server-side environment variables
const API_URL = process.env.FIVESIM_BASE_URL;
const API_KEY = process.env.FIVESIM_API_KEY;

export async function GET() {
  try {
    const response = await axios.get(`${API_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' }, 
      { status: 500 }
    );
  }
} 