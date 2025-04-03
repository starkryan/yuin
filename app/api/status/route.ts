import { NextResponse } from 'next/server';
import axios from 'axios';

// Environment variables for the 5SIM API
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export async function GET() {
  try {
    // Check if the API is configured
    if (!API_URL) {
      return NextResponse.json({
        success: true,
        isOperational: false,
        error: 'API URL not configured'
      });
    }

    // Use a guest endpoint to check API availability instead of an authenticated one
    const response = await axios.get(
      `${API_URL}/guest/countries`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    // If we get a 200 OK, the API is operational
    return NextResponse.json({
      success: true,
      isOperational: true,
      statusCode: response.status
    });
  } catch (error: any) {
    console.error('API Status check failed:', error.response?.status || error.message);
    
    // Even if the API check fails, we want to return a 200 OK
    // but with isOperational set to false
    return NextResponse.json({
      success: true,
      isOperational: false,
      error: error.response?.data?.message || error.message || 'Unknown error'
    });
  }
} 