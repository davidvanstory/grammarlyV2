#!/usr/bin/env node

/**
 * Grammar API Test Setup Verification
 * Verifies that all test files and dependencies are correctly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Grammar API Test Setup Verification');
console.log('=' .repeat(50));

let allChecksPass = true;

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} - FILE MISSING`);
    allChecksPass = false;
    return false;
  }
}

function checkPackage(packageName) {
  try {
    require.resolve(packageName);
    console.log(`✅ Package installed: ${packageName}`);
    return true;
  } catch (error) {
    console.log(`❌ Package missing: ${packageName}`);
    allChecksPass = false;
    return false;
  }
}

console.log('\n📁 Checking Required Files:');
console.log('-' .repeat(30));

// Check test files
checkFile('docs/test/grammar_test_data.csv', 'Test data CSV');
checkFile('docs/test/testplan.md', 'Test plan document');
checkFile('docs/test/README.md', 'Test documentation');
checkFile('docs/test/results', 'Results directory');

// Check script files
checkFile('scripts/test-grammar-api.ts', 'Main test script');
checkFile('scripts/run-grammar-test.js', 'Test runner script');

// Check API files
checkFile('app/api/test-grammar-check/route.ts', 'Test API endpoint');
checkFile('app/api/grammar-check/route.ts', 'Main API endpoint');

// Check supporting files
checkFile('actions/ai/grammar-actions.ts', 'Grammar actions');
checkFile('lib/openai.ts', 'OpenAI configuration');
checkFile('types/grammar-types.ts', 'Grammar types');

console.log('\n📦 Checking Required Packages:');
console.log('-' .repeat(30));

// Check dependencies
checkPackage('csv-parse');
checkPackage('tsx');
checkPackage('openai');

console.log('\n🔧 Checking Package.json Scripts:');
console.log('-' .repeat(30));

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts['test:grammar']) {
    console.log('✅ npm script: test:grammar');
  } else {
    console.log('❌ npm script missing: test:grammar');
    allChecksPass = false;
  }
  
  if (packageJson.scripts['test:grammar-direct']) {
    console.log('✅ npm script: test:grammar-direct');
  } else {
    console.log('❌ npm script missing: test:grammar-direct');
    allChecksPass = false;
  }
} catch (error) {
  console.log('❌ Failed to read package.json');
  allChecksPass = false;
}

console.log('\n📊 Checking Test Data Format:');
console.log('-' .repeat(30));

try {
  const csvContent = fs.readFileSync('docs/test/grammar_test_data.csv', 'utf8');
  const lines = csvContent.trim().split('\n');
  
  if (lines.length > 1) {
    console.log(`✅ Test data: ${lines.length - 1} test cases found`);
    
    // Check first data line format
    const firstDataLine = lines[1];
    const columns = firstDataLine.split(',');
    
    if (columns.length >= 3) {
      console.log('✅ CSV format: Correct number of columns');
    } else {
      console.log('❌ CSV format: Incorrect number of columns');
      allChecksPass = false;
    }
  } else {
    console.log('❌ Test data: No test cases found');
    allChecksPass = false;
  }
} catch (error) {
  console.log('❌ Failed to read test data CSV');
  allChecksPass = false;
}

console.log('\n🌍 Environment Check:');
console.log('-' .repeat(30));

if (process.env.OPENAI_API_KEY) {
  console.log('✅ OPENAI_API_KEY is configured');
} else {
  console.log('⚠️  OPENAI_API_KEY not found in environment');
  console.log('   Add to your .env.local file for testing');
}

console.log('\n' + '=' .repeat(50));

if (allChecksPass) {
  console.log('🎉 ALL CHECKS PASSED!');
  console.log('📋 Setup is complete and ready for testing');
  console.log('');
  console.log('🚀 To run the tests:');
  console.log('   1. Start Next.js server: npm run dev');
  console.log('   2. Run tests: npm run test:grammar');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED!');
  console.log('🔧 Please fix the issues above before running tests');
  process.exit(1);
} 