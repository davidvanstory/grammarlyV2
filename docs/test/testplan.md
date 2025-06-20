# Grammar API Test Implementation Specification

## Overview
This test validates that our GPT-4o grammar checking API meets our performance requirements:
- **Accuracy Goal**: 85% error detection rate
- **Performance Goal**: API response time under 2 seconds

## Test Architecture

### Input Data Structure
Create a CSV file with 10 test cases located at: `test/grammar_test_data.csv`

**CSV Columns:**
1. `incorrect_sentence` - Sentence with intentional spelling and grammar errors
2. `expected_spelling_errors` - JSON array of misspelled words that should be detected
3. `expected_grammar_errors` - Integer count of grammar errors that should be detected

**Example CSV:**
```csv
incorrect_sentence,expected_spelling_errors,expected_grammar_errors
"The docter recieve the paitent yesterday.",["docter","recieve","paitent"],1
"She dont have no time for this.",["dont"],2
```

### API Call Details
- **Endpoint**: Your existing GPT-4o grammar checking API
- **Input**: Send only the `incorrect_sentence` (do NOT send the expected errors)
- **Response Format**: JSON with errors array as specified in your current prompt

## Implementation Requirements

### 1. Test Script Structure
Create a test script that:
1. Reads the CSV test data
2. Iterates through each row
3. Makes timed API calls
4. Compares results against expected errors
5. Calculates accuracy and performance metrics

### 2. Timing Measurement
For each API call:
- Start timer immediately before HTTP request to OpenAI
- Stop timer immediately after receiving complete response
- Record time in milliseconds
- Log individual times and calculate summary statistics

### 3. Accuracy Measurement

#### Spelling Error Detection
- Parse GPT-4o response to extract words flagged as spelling errors
- Compare against `expected_spelling_errors` array using exact string matching
- Count: detected spelling errors / expected spelling errors

#### Grammar Error Detection  
- Check if GPT-4o detected ANY grammar errors in the sentence
- Compare against `expected_grammar_errors` count (binary: did it detect >= 1 grammar error?)
- Count: 1 point if grammar errors detected when expected, 0 if missed

#### Overall Scoring
- Total possible points = sum of all expected spelling errors + count of sentences with grammar errors
- Total detected points = sum of correctly detected spelling errors + correctly detected grammar issues
- Accuracy percentage = (total detected points / total possible points) × 100

### 4. Output Format

#### Individual Test Results
For each sentence, log:
```
Sentence X: [detected_spelling]/[expected_spelling] spelling errors, [detected_grammar]/[expected_grammar] grammar errors detected, API time: [time]ms
```

#### Summary Results
At the end, display:
```
=== GRAMMAR API TEST RESULTS ===
Overall Accuracy: [X]% ([detected] out of [total] errors)
Performance Summary:
- Average API time: [avg]ms
- Minimum API time: [min]ms  
- Maximum API time: [max]ms
- Calls over 2s threshold: [count]

PASS/FAIL: 
- Accuracy: [PASS/FAIL] (Goal: 85%, Actual: [X]%)
- Performance: [PASS/FAIL] (Goal: <2000ms, Max: [X]ms)
```

## Test Data Creation Guidelines

### Spelling Errors to Include:
- Common misspellings (receive → recieve, definitely → definately)
- Transposed letters (form → from)
- Missing letters (the → te)
- Extra letters (loose → loose when should be lose)

### Grammar Errors to Include:
- Subject-verb disagreement (The doctors was late)
- Wrong verb tense (I seen it yesterday)
- Double negatives (Don't have no time)
- Missing articles (I went to store)
- Incorrect pronouns (Me and him went)

### Sentence Complexity:
- Mix simple and complex sentences
- Include 1-4 errors per sentence
- Ensure sentences are realistic and varied

## Technical Implementation Notes

### Error Handling
- Handle API timeouts gracefully
- Retry failed requests once
- Log any API errors separately from test results

### Data Parsing
- Parse CSV safely (handle commas in sentences)
- Parse JSON arrays in CSV fields correctly
- Validate expected error counts before running tests

### File Structure
```
test/
├── grammar_test_data.csv
├── run_grammar_test.py (or .js)
└── test_results/
    └── grammar_test_[timestamp].log
```

## Success Criteria
- **Accuracy**: ≥85% error detection rate across all test cases
- **Performance**: All API calls complete in <2000ms
- **Reliability**: Test runs without errors and produces consistent results

## Next Steps After Implementation
1. Run initial test to establish baseline metrics
2. If accuracy <85%, analyze which error types are being missed
3. If performance >2s, investigate API optimization opportunities
4. Consider expanding test dataset based on real-world usage patterns