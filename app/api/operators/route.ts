import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Server-side environment variables
const API_URL = process.env.FIVESIM_BASE_URL;
const API_KEY = process.env.FIVESIM_API_KEY;

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const service = searchParams.get('service');
    
    if (!country) {
      return NextResponse.json(
        { error: 'Country parameter is required' }, 
        { status: 400 }
      );
    }

    // Construct the URL based on whether a service is provided
    let url = `${API_URL}/guest/operators`;
    const params: Record<string, string> = { country };
    
    if (service) {
      params.service = service;
    }

    const response = await axios.get(url, {
      params,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    // Handle different response formats
    let operatorsData: any;
    
    if (response.data && response.data.data && typeof response.data.data === 'object') {
      // Original 5sim API format with nested data property
      operatorsData = response.data.data;
    } else {
      // Otherwise just use what we got
      operatorsData = response.data;
    }
    
    return NextResponse.json(operatorsData);
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operators' },
      { status: 500 }
    );
  }
} 