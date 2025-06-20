#!/usr/bin/env node

/**
 * Grammar API Test Runner
 * Simple script to run the TypeScript grammar test with proper setup
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Grammar API Test Runner');
console.log('🚀 Starting test execution...\n');

// Set environment variables for testing
process.env.SKIP_AUTH = 'true';
process.env.NODE_ENV = 'test';

// Path to the TypeScript test file
const testScript = path.join(__dirname, 'test-grammar-api.ts');

// Run the test with tsx
const testProcess = spawn('npx', ['tsx', testScript], {
  stdio: 'inherit',
  env: {
    ...process.env,
    SKIP_AUTH: 'true',
    NODE_ENV: 'test'
  }
});

testProcess.on('close', (code) => {
  console.log(`\n🏁 Test execution completed with exit code: ${code}`);
  
  if (code === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed or there were errors.');
  }
  
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('💥 Failed to start test process:', error);
  process.exit(1);
}); 