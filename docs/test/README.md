# Grammar API Test Suite

This directory contains comprehensive tests for the Med Writer grammar checking API to validate accuracy and performance requirements.

## Test Goals

- **Accuracy Goal**: 85% error detection rate
- **Performance Goal**: API response time under 2 seconds

## Test Structure

### Files

- `grammar_test_data.csv` - Test cases with intentional errors
- `testplan.md` - Detailed test specification
- `results/` - Test execution results (auto-generated)

### Test Data Format

The CSV contains:
- `incorrect_sentence` - Text with intentional spelling/grammar errors
- `expected_spelling_errors` - JSON array of expected misspelled words
- `expected_grammar_errors` - Count of expected grammar issues

## Running Tests

### Prerequisites

1. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```

2. **Ensure OpenAI API key is configured**:
   ```bash
   # Add to .env.local
   OPENAI_API_KEY=your_api_key_here
   ```

### Execute Tests

**Option 1: Using npm script (recommended)**:
```bash
npm run test:grammar
```

**Option 2: Direct execution**:
```bash
npx tsx scripts/test-grammar-api.ts
```

**Option 3: Using the runner script**:
```bash
node scripts/run-grammar-test.js
```

### Test Output

The test suite provides:

1. **Real-time progress**: Individual test results as they execute
2. **Detailed logging**: All API calls and responses
3. **Summary report**: Overall accuracy and performance metrics
4. **File output**: Detailed results saved to `docs/test/results/`

### Sample Output

```
🧪 Grammar API Test Suite
==================================================
📊 Loading test data from CSV...
📝 Loaded 10 test cases

🧪 Running tests...
==================================================

📝 Test 1/10: "The docter recieve the paitent yesterday."
   Expected: 3 spelling, 1 grammar
🔄 Testing sentence: "The docter recieve the paitent yesterday..."
📤 Sending API request...
⏱️ API call completed in 1245ms
✅ API call successful - Found 4 errors
🔍 Analyzing response accuracy...
📊 Response breakdown:
  - Spelling errors detected: 3
  - Grammar errors detected: 1
  - Style errors detected: 0
✅ Found expected spelling error: "docter"
✅ Found expected spelling error: "recieve"
✅ Found expected spelling error: "paitent"
✅ Grammar errors detected as expected
📊 Test 1 Results:
   Spelling: 3/3 detected
   Grammar: 1/1 detected
   API Time: 1245ms
   Status: ✅ SUCCESS

...

============================================================
🏆 GRAMMAR API TEST RESULTS
============================================================

📈 ACCURACY RESULTS:
   Overall Accuracy: 87.5% (21 out of 24 errors)
   Spelling Detection: 18/20 (90.0%)
   Grammar Detection: 3/4 (75.0%)

⏱️ PERFORMANCE RESULTS:
   Average API time: 1456ms
   Minimum API time: 892ms
   Maximum API time: 1967ms
   Calls over 2s threshold: 0

🧪 TEST EXECUTION:
   Total tests: 10
   Passed tests: 10
   Failed tests: 0

🎯 PASS/FAIL STATUS:
   Accuracy: ✅ PASS (Goal: 85%, Actual: 87.5%)
   Performance: ✅ PASS (Goal: <2000ms, Max: 1967ms)

🏁 OVERALL RESULT: ✅ PASS
```

## Test Cases

The test suite includes diverse error types:

### Spelling Errors
- Common misspellings (receive → recieve, necessary → necesary)
- Medical terminology (doctor → docter, patient → paitent)
- Transposed letters (monitor → moniter)

### Grammar Errors
- Subject-verb disagreement ("The doctors was late")
- Double negatives ("Don't have no time")
- Incorrect pronouns ("Me and him went")
- Verb tense errors ("I seen it yesterday")

### Medical Context
- Tests include medical terminology (BP, ECG, CHF)
- Ensures medical terms aren't flagged as errors
- Validates context-aware suggestions

## Interpreting Results

### Accuracy Measurement
- **Spelling**: Exact match of detected vs expected misspelled words
- **Grammar**: Binary detection (found any grammar errors when expected)
- **Overall**: Combined score of all detected errors vs expected

### Performance Measurement
- **API Time**: Complete round-trip time to OpenAI API
- **Threshold**: All calls must complete under 2000ms
- **Statistics**: Min, max, average, and threshold violations

### Pass/Fail Criteria
- **Accuracy PASS**: ≥85% overall error detection
- **Performance PASS**: All API calls <2000ms
- **Overall PASS**: Both accuracy and performance pass

## Troubleshooting

### Common Issues

**Authentication Errors**:
- Test endpoint bypasses authentication
- Ensure `SKIP_AUTH=true` environment variable is set

**API Timeout**:
- Check OpenAI API key configuration
- Verify internet connectivity
- Monitor OpenAI API status

**Missing Test Data**:
- Ensure `grammar_test_data.csv` exists in `docs/test/`
- Check CSV format matches specification

**TypeScript Errors**:
- Run `npm install` to ensure dependencies
- Check that `tsx` and `csv-parse` are installed

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_api_key_here

# Optional for testing
SKIP_AUTH=true
NODE_ENV=test
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Extending Tests

### Adding Test Cases

1. Edit `grammar_test_data.csv`
2. Add new rows with format: `sentence,["errors"],count`
3. Run tests to validate new cases

### Modifying Thresholds

Update constants in `scripts/test-grammar-api.ts`:
```typescript
const ACCURACY_THRESHOLD = 85; // Percentage
const PERFORMANCE_THRESHOLD = 2000; // Milliseconds
```

### Custom Analysis

The test script can be imported and extended:
```typescript
import { GrammarAPITester } from './scripts/test-grammar-api';

const tester = new GrammarAPITester();
const results = await tester.runTests();
// Custom analysis of results
```

## Results Archive

Test results are automatically saved to `docs/test/results/` with timestamps:
- `grammar_test_2024-01-15T10-30-45.log`
- Contains detailed individual results and summary

## Integration

### CI/CD Pipeline

Add to your GitHub Actions or deployment pipeline:
```bash
# Start server in background
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 10

# Run tests
npm run test:grammar

# Stop server
kill $SERVER_PID
```

### Monitoring

Regular test execution can monitor:
- Grammar checking accuracy over time
- Performance degradation
- OpenAI API reliability

## Support

For issues with the test suite:
1. Check the troubleshooting section
2. Review test logs in `docs/test/results/`
3. Verify environment configuration
4. Test individual API calls manually 