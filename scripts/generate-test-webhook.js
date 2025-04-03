#!/usr/bin/env node

/**
 * This script generates a test webhook payload for manually testing
 * the webhook processing functionality.
 * 
 * Usage:
 *   node scripts/generate-test-webhook.js
 */

// Generate a random ID
const userId = 'user_' + Math.random().toString(36).substring(2, 10);
const email = `test_${Date.now()}@example.com`;
const username = 'test_' + Math.random().toString(36).substring(2, 8);

// Create a sample user.created webhook payload
const userCreatedPayload = {
  type: 'user.created',
  data: {
    id: userId,
    email_addresses: [{ email_address: email }],
    username: username,
    first_name: 'Test',
    last_name: 'User',
    image_url: null
  }
};

console.log('\n=== Sample user.created Webhook Payload ===\n');
console.log(JSON.stringify(userCreatedPayload, null, 2));
console.log('\n=== Copy this payload to test the webhook endpoint ===\n');

// Create a curl command for easy testing
const curlCommand = `curl -X POST -H "Content-Type: application/json" -d '${JSON.stringify(userCreatedPayload)}' http://localhost:3000/api/process-svix-play`;

console.log('Test using curl:');
console.log(curlCommand);
console.log('\n');

// Sample user.deleted webhook payload
const userDeletedPayload = {
  type: 'user.deleted',
  data: {
    id: userId,
    deleted: true
  }
};

console.log('=== Sample user.deleted Webhook Payload ===\n');
console.log(JSON.stringify(userDeletedPayload, null, 2));
console.log('\n=== Use this to test deletion ===\n'); 