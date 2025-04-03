import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Server-side environment variables (not exposed to client)
const API_URL = process.env.FIVESIM_BASE_URL;
const API_KEY = process.env.FIVESIM_API_KEY;

export async function GET(request: NextRequest) {
  try {
    // Get country parameter from query string
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    
    if (!country) {
      return NextResponse.json(
        { error: 'Country parameter is required' }, 
        { status: 400 }
      );
    }

    const response = await axios.get(`${API_URL}/guest/prices`, {
      params: { country },
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    // The 5sim API returns the data in different formats, handle all cases
    let productsData: any;
    
    if (response.data && response.data.data && typeof response.data.data === 'object') {
      // Original 5sim API format with nested data property
      productsData = response.data.data;
    } else {
      // Otherwise just use what we got
      productsData = response.data;
    }
    
    // Create a structure that always has the country as the top-level key
    const formattedData: Record<string, any> = {};
    formattedData[country] = productsData[country] || productsData;
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 