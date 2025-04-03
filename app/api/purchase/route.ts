import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Server-side environment variables
const API_URL = process.env.FIVESIM_BASE_URL;
const API_KEY = process.env.FIVESIM_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { country, operator, product } = body;
    
    // Validate required parameters
    if (!country || !operator || !product) {
      return NextResponse.json(
        { error: 'Missing required parameters: country, operator, product' }, 
        { status: 400 }
      );
    }
    
    console.log(`Purchasing activation for: ${country}/${operator}/${product}`);
    
    // Purchase activation from 5sim API using the exact endpoint format from the curl example
    const response = await axios.get(
      `${API_URL}/user/buy/activation/${country}/${operator}/${product}`, 
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    );
    
    console.log('Purchase response:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error purchasing activation:', error);
    
    // Handle different error types and provide more helpful error messages
    if (axios.isAxiosError(error) && error.response) {
      const statusCode = error.response.status;
      const errorData = error.response.data;
      
      console.error('API error details:', { statusCode, errorData });
      
      return NextResponse.json(
        { 
          error: 'Failed to purchase activation', 
          details: errorData,
          status: statusCode 
        }, 
        { status: statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to purchase activation', message: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 