#!/usr/bin/env node

/**
 * This script generates a valid webhook signature for testing Clerk webhooks locally.
 * 
 * Usage:
 *   node scripts/generate-webhook-signature.js
 * 
 * This will create a curl command you can run to test your webhook with a valid signature.
 */

const crypto = require('crypto');
const { exec } = require('child_process');
require('dotenv').config();

// Get the webhook secret from .env
let webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error('ERROR: CLERK_WEBHOOK_SECRET is not set in your .env file');
  process.exit(1);
}

// Remove any quotes from the webhook secret
webhookSecret = webhookSecret.replace(/["']/g, '');

console.log(`Using webhook secret: ${webhookSecret.substring(0, 5)}...`);

// Sample webhook payload for a user.created event
const payload = {
  type: 'user.created',
  data: {
    id: 'user_' + Math.random().toString(36).substring(2, 10),
    email_addresses: [{ email_address: `test_${Date.now()}@example.com` }],
    username: 'test_' + Math.random().toString(36).substring(2, 8),
    first_name: 'Test',
    last_name: 'User',
    image_url: null
  }
};

// Payload as string
const payloadString = JSON.stringify(payload);

// Generate random svix id
const svix_id = `msg_${Math.random().toString(36).substring(2, 15)}`;

// Get the current timestamp
const svix_timestamp = Math.floor(Date.now() / 1000).toString();

// Generate the signature using HMAC
const toSign = `${svix_id}.${svix_timestamp}.${payloadString}`;
console.log('String to sign:', toSign.substring(0, 50) + '...');

const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(toSign)
  .digest('hex');

console.log('Generated signature:', signature);

const svix_signature = `v1,${signature}`;

// Create a curl command
const curlCommand = `curl -X POST -H "Content-Type: application/json" -H "svix-id: ${svix_id}" -H "svix-timestamp: ${svix_timestamp}" -H "svix-signature: ${svix_signature}" -d '${payloadString}' http://localhost:3000/api/webhook/clerk`;

console.log('\n=== Valid Webhook Test Command ===\n');
console.log(curlCommand);
console.log('\n=== Copy and paste this command to test your webhook handler ===\n');

// Optionally execute the command directly
const executeDirectly = false; // Set to true if you want to execute the command automatically

if (executeDirectly) {
  console.log('Executing the command...');
  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Response: ${stdout}`);
  });
} 