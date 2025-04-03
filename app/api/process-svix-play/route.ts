import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * This endpoint processes webhook payloads copied from Svix Play
 * Used for local development and testing
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Processing webhook from Svix Play...');
    
    // Get the payload
    const rawPayload = await request.json();
    console.log('Raw webhook payload received:', JSON.stringify(rawPayload, null, 2));
    
    // Extract the event type - handle different payload structures
    let eventType, userData;
    
    if (rawPayload.type) {
      // Standard format
      eventType = rawPayload.type;
      userData = rawPayload.data;
    } else if (rawPayload.object === 'event' && rawPayload.type) {
      // Full Clerk webhook format from Svix Play
      eventType = rawPayload.type;
      userData = rawPayload.data;
    } else {
      console.error('Unknown payload format');
      return new Response('Error: Unknown payload format', { status: 400 });
    }
    
    console.log(`Processing webhook with type ${eventType}`);
    console.log('User data:', JSON.stringify(userData, null, 2));

    if (eventType === 'user.created' || eventType === 'user.updated') {
      console.log(`Processing ${eventType} event`);
      
      // Extract user information from the data
      const { id, email_addresses, username, first_name, last_name, profile_image_url, image_url } = userData;
      
      // Get email from email_addresses array
      let email;
      if (email_addresses && email_addresses.length > 0) {
        email = email_addresses[0].email_address;
      }
      
      console.log('User data extracted:', { 
        id, 
        email, 
        username,
        first_name: first_name || userData.first_name,
        last_name: last_name || userData.last_name,
        image_url: profile_image_url || image_url 
      });
      
      // Return error if no email
      if (!email && !id) {
        console.error('No email or ID found in webhook data');
        return new Response('Error: No email or ID found in webhook', {
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
            email: email || `${id}@example.com`,
            username: username || null,
            name: [first_name, last_name].filter(Boolean).join(' ') || null,
            imageUrl: profile_image_url || image_url || null,
          },
          create: {
            clerkId: id as string,
            email: email || `${id}@example.com`,
            username: username || null,
            name: [first_name, last_name].filter(Boolean).join(' ') || null,
            imageUrl: profile_image_url || image_url || null,
            balance: 0, // Default balance for new users
          },
        });

        console.log('User successfully saved to database:', result);
        return NextResponse.json({ 
          success: true, 
          message: `User ${id} successfully ${eventType === 'user.created' ? 'created' : 'updated'}`,
          user: result 
        });
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

    if (eventType === 'user.deleted') {
      console.log('Processing user.deleted event');
      const { id } = userData;
      
      try {
        // Find user in our database
        console.log('Looking for user in database with clerkId:', id);
        const user = await prisma.user.findUnique({
          where: { clerkId: id as string },
        });

        if (!user) {
          console.log('User not found in database for deletion');
          return new Response('User not found in database', {
            status: 404,
          });
        }

        console.log('Updating user record for deletion');
        await prisma.user.update({
          where: { clerkId: id as string },
          data: {
            email: `deleted-${id}@example.com`,
            username: null,
            name: null,
            imageUrl: null,
          },
        });

        console.log('User successfully marked as deleted');
        return NextResponse.json({ 
          success: true, 
          message: `User ${id} marked as deleted`
        });
      } catch (error) {
        console.error('Error handling user deletion:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        return new Response(`Error handling user deletion: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          status: 500,
        });
      } finally {
        await prisma.$disconnect();
      }
    }

    // Return a message for unsupported event types
    return NextResponse.json({ 
      success: true, 
      message: `Event type ${eventType} received but not processed` 
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return new Response(`Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
    });
  }
} 