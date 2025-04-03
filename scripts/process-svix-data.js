#!/usr/bin/env node

/**
 * This script helps process webhook payloads from Svix Play
 * It formats the payload for your local endpoint
 * 
 * Usage:
 *   1. Copy the full JSON from Svix Play
 *   2. Save it to a file called svix-payload.json
 *   3. Run: node scripts/process-svix-data.js
 */

const fs = require('fs');
const { exec } = require('child_process');

// Check if the file exists
if (!fs.existsSync('svix-payload.json')) {
  console.error('Error: svix-payload.json file not found');
  console.log('Please save the Svix Play payload to a file called svix-payload.json');
  process.exit(1);
}

// Read the file
try {
  const data = fs.readFileSync('svix-payload.json', 'utf8');
  const payload = JSON.parse(data);
  
  console.log('Svix payload loaded successfully');
  console.log(`Event Type: ${payload.type}`);
  
  // Create curl command to process the webhook
  const curlCommand = `curl -X POST -H "Content-Type: application/json" -d '${JSON.stringify(payload)}' http://localhost:3000/api/process-svix-play`;
  
  console.log('\n=== Copy and run this command to process the webhook ===\n');
  console.log(curlCommand);
  
  // Ask if user wants to run the command now
  console.log('\nWould you like to run this command now? (y/n)');
  process.stdin.once('data', (input) => {
    const answer = input.toString().trim().toLowerCase();
    if (answer === 'y' || answer === 'yes') {
      console.log('Executing command...');
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
        
        // Check database after processing
        console.log('\nChecking database for user...');
        exec('curl http://localhost:3000/api/debug/database', (dbError, dbStdout, dbStderr) => {
          if (dbError) {
            console.error(`Error checking database: ${dbError.message}`);
            return;
          }
          console.log('Database response:');
          // Try to format the JSON response
          try {
            const dbData = JSON.parse(dbStdout);
            console.log('User count:', dbData.database.userCount);
            console.log('Users:', JSON.stringify(dbData.database.users, null, 2));
          } catch (e) {
            console.log(dbStdout);
          }
        });
      });
    } else {
      console.log('Command not executed. You can manually copy and run it.');
    }
    process.exit(0);
  });
  
} catch (error) {
  console.error('Error processing file:', error.message);
  process.exit(1);
} 