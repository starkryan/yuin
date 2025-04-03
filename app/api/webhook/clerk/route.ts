import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Webhook } from 'svix';

export async function POST(req: Request) {
  try {
    // Get the headers
    const headersList = req.headers;
    const svix_id = headersList.get('svix-id');
    const svix_timestamp = headersList.get('svix-timestamp');
    const svix_signature = headersList.get('svix-signature');

    console.log('Webhook received with headers:', { 
      svix_id, 
      svix_timestamp,
      svix_signature: svix_signature ? `${svix_signature.substring(0, 10)}...` : null
    });
    
    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing Svix headers in webhook request');
      return new Response('Error: Missing svix headers', {
        status: 400,
      });
    }

    // Get the body as text first to avoid parsing issues
    const rawBody = await req.text();
    
    // Parse the body as JSON
    let payload;
    try {
      payload = JSON.parse(rawBody);
      console.log('Webhook payload received:', JSON.stringify(payload, null, 2));
    } catch (e) {
      console.error('Error parsing webhook payload:', e);
      return new Response('Error parsing webhook payload', { 
        status: 400 
      });
    }
    
    // Check if webhook secret is configured
    let webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET is not configured');
      return new Response('Error: Webhook secret not configured', {
        status: 500,
      });
    }
    
    // Remove any quotes that might be in the secret
    webhookSecret = webhookSecret.replace(/["']/g, '');
    
    console.log('Using webhook secret:', webhookSecret.substring(0, 5) + '...');

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(webhookSecret);

    let evt: WebhookEvent;

    // Verify the webhook
    try {
      console.log('Verifying webhook signature...');
      
      evt = wh.verify(rawBody, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
      
      console.log('Webhook verification successful');
    } catch (err) {
      console.error('Error verifying webhook:', err);
      
      // For development, continue processing even if verification fails
      if (process.env.NODE_ENV === 'development' && payload) {
        console.log('DEVELOPMENT MODE: Bypassing webhook verification failure');
        evt = { type: payload.type, data: payload.data } as WebhookEvent;
      } else {
        return new Response(`Error verifying webhook: ${err instanceof Error ? err.message : 'Unknown error'}`, {
          status: 400,
        });
      }
    }

    // Handle the webhook
    const eventType = evt.type;
    console.log(`Processing webhook with type ${eventType}`);

    if (eventType === 'user.created' || eventType === 'user.updated') {
      console.log(`Processing ${eventType} event`);
      const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

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
        return NextResponse.json({ success: true });
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
      const { id } = evt.data;
      
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
        return NextResponse.json({ success: true });
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

    // Return a 200 response for other events
    console.log(`Successfully processed ${eventType} event`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in webhook handler:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return new Response(`Unexpected error in webhook handler: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
    });
  }
} 