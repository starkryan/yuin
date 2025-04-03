import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('Processing test webhook for development...');
    
    // Get the body
    const payload = await request.json();
    console.log('Test webhook payload:', JSON.stringify(payload, null, 2));
    
    // Check if it's a user event
    if (payload.type === 'user.created' || payload.type === 'user.updated') {
      const { id, email_addresses, username, first_name, last_name, image_url } = payload.data;
      
      // Get the email from the email_addresses array
      const emailObject = email_addresses && email_addresses[0];
      const email = emailObject && emailObject.email_address;
      
      console.log('User data extracted:', { id, email, username, first_name, last_name });
      
      // Return error if no email
      if (!email) {
        console.error('No email found in webhook data');
        return new Response('Error: No email found in webhook', {
          status: 400,
        });
      }
      
      try {
        console.log('Attempting to upsert user in database with:', { id, email, username });
        
        // Verify prisma connection
        await prisma.$connect();
        console.log('Prisma connection established');
        
        // Validate the required fields are present
        if (!id) {
          console.error('Missing required field: id');
          return new Response('Error: Missing required field: id', { status: 400 });
        }
        
        // Create or update the user in the database
        const result = await prisma.user.upsert({
          where: { clerkId: id as string },
          update: {
            email,
            username: username || null,
            name: [first_name, last_name].filter(Boolean).join(' ') || null,
            imageUrl: image_url || null,
          },
          create: {
            clerkId: id as string,
            email,
            username: username || null,
            name: [first_name, last_name].filter(Boolean).join(' ') || null,
            imageUrl: image_url || null,
            balance: 0, // Default balance for new users
          },
        });
        
        console.log('User successfully saved to database:', result);
        return NextResponse.json({ success: true, user: result });
      } catch (error) {
        console.error('Error saving user to database:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
        }
        return new Response(`Error saving user to database: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          status: 500,
        });
      } finally {
        await prisma.$disconnect();
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received but no action taken',
      eventType: payload.type || 'unknown'
    });
  } catch (error) {
    console.error('Error processing test webhook:', error);
    return new Response(`Error processing test webhook: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
    });
  }
} 