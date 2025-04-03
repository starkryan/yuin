import { NextResponse } from 'next/server';
import axios from 'axios';

// Server-side environment variables
const API_URL = process.env.FIVESIM_BASE_URL;
const API_KEY = process.env.FIVESIM_API_KEY;

export async function GET() {
  try {
    // Make a simple request to check if the API is available
    const response = await axios.get(`${API_URL}/guest/countries`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Error checking API status:', error);
    return NextResponse.json({ status: 'error', message: 'API is unavailable' }, { status: 500 });
  }
} 