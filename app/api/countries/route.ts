import { NextResponse } from 'next/server';
import axios from 'axios';

// Server-side environment variables (not exposed to client)
const API_URL = process.env.FIVESIM_BASE_URL;
const API_KEY = process.env.FIVESIM_API_KEY;

export async function GET() {
  try {
    const response = await axios.get(`${API_URL}/guest/countries`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    // The 5sim API returns the data in different formats, handle both cases
    let countriesData;
    
    if (response.data && response.data.data && typeof response.data.data === 'object') {
      // Original 5sim API format with nested data property
      countriesData = response.data.data;
    } else if (Array.isArray(response.data)) {
      // If the API returns an array of countries, convert to object format
      countriesData = {};
      response.data.forEach((country) => {
        if (country && country.country) {
          countriesData[country.country] = country;
        }
      });
    } else {
      // Otherwise just use what we got
      countriesData = response.data;
    }
    
    return NextResponse.json(countriesData);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
} 