#!/usr/bin/env tsx

/*
<ai_context>
Grammar API Test Script for Med Writer Application
Tests the GPT-4o grammar checking API against predefined test cases to validate:
- Accuracy Goal: 85% error detection rate
- Performance Goal: API response time under 2 seconds
</ai_context>
*/

import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

// Types matching the existing codebase
interface GrammarError {
  id: string
  type: "spelling" | "grammar" | "style"
  start: number
  end: number
  original: string
  suggestions: string[]
  explanation: string
  medical_context?: string
  confidence?: number
}

interface GrammarCheckResponse {
  errors: GrammarError[]
  processedText: string
  processingTime: number
  confidence: number
  medicalTermsFound: string[]
}

interface TestCase {
  incorrect_sentence: string
  expected_spelling_errors: string[]
  expected_grammar_errors: number
}

interface TestResult {
  sentenceIndex: number
  sentence: string
  detectedSpelling: number
  expectedSpelling: number
  detectedGrammar: number
  expectedGrammar: number
  apiTime: number
  success: boolean
  error?: string
}

interface TestSummary {
  totalTests: number
  totalExpectedSpelling: number
  totalDetectedSpelling: number
  totalExpectedGrammar: number
  totalDetectedGrammar: number
  totalPoints: number
  detectedPoints: number
  accuracyPercentage: number
  averageApiTime: number
  minApiTime: number
  maxApiTime: number
  callsOver2s: number
  passedTests: number
  failedTests: number
}

class GrammarAPITester {
  private testData: TestCase[] = []
  private results: TestResult[] = []
  private apiEndpoint: string
  private authToken: string | null = null

  constructor() {
    console.log("🧪 Initializing Grammar API Tester...")
    
    // Set API endpoint - use test endpoint that bypasses auth
    this.apiEndpoint = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/test-grammar-check`
      : "http://localhost:3000/api/test-grammar-check"
    
    console.log("🌐 API Endpoint:", this.apiEndpoint)
  }

  /**
   * Load test data from CSV file
   */
  private loadTestData(): void {
    console.log("📊 Loading test data from CSV...")
    
    const csvPath = path.join(process.cwd(), "docs", "test", "grammar_test_data.csv")
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`Test data file not found at: ${csvPath}`)
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    })

    console.log(`📝 Loaded ${records.length} test cases`)

    // Parse the CSV data
    this.testData = records.map((record: any) => {
      let expectedSpellingErrors: string[]
      
      try {
        // Parse the JSON array from CSV
        expectedSpellingErrors = JSON.parse(record.expected_spelling_errors)
      } catch (error) {
        console.warn(`⚠️ Failed to parse spelling errors for sentence: ${record.incorrect_sentence}`)
        expectedSpellingErrors = []
      }

      return {
        incorrect_sentence: record.incorrect_sentence,
        expected_spelling_errors: expectedSpellingErrors,
        expected_grammar_errors: parseInt(record.expected_grammar_errors) || 0
      }
    })

    console.log("✅ Test data loaded successfully")
    console.log("📋 Test Data Summary:")
    this.testData.forEach((test, index) => {
      console.log(`  ${index + 1}. Sentence: "${test.incorrect_sentence.substring(0, 50)}..."`)
      console.log(`     Expected Spelling: ${test.expected_spelling_errors.length} errors`)
      console.log(`     Expected Grammar: ${test.expected_grammar_errors} errors`)
    })
  }

  /**
   * Get authentication token for API calls
   */
  private async authenticate(): Promise<void> {
    console.log("🔐 Setting up authentication...")
    
    // For testing purposes, we'll use a test user token
    // In a real scenario, you might need to programmatically authenticate
    // For now, we'll assume the API is accessible or we have a test token
    
    // Check if auth is required by environment
    if (process.env.SKIP_AUTH === "true") {
      console.log("⏭️ Skipping authentication (SKIP_AUTH=true)")
      return
    }

    // You would implement actual authentication here
    // For now, we'll proceed without token and handle 401 errors
    console.log("⚠️ No authentication token configured - API calls may fail if auth is required")
  }

  /**
   * Make a single grammar check API call
   */
  private async makeGrammarCheckCall(sentence: string): Promise<{
    response: GrammarCheckResponse | null
    apiTime: number
    error?: string
  }> {
    console.log(`🔄 Testing sentence: "${sentence.substring(0, 50)}..."`)
    
    const startTime = Date.now()
    
    try {
      const requestBody = {
        text: sentence,
        previousErrors: [],
        forceRecheck: true
      }

      console.log("📤 Sending API request...")
      
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add auth header if we have a token
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` })
        },
        body: JSON.stringify(requestBody)
      })

      const apiTime = Date.now() - startTime
      console.log(`⏱️ API call completed in ${apiTime}ms`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API call failed with status ${response.status}:`, errorText)
        
        return {
          response: null,
          apiTime,
          error: `HTTP ${response.status}: ${errorText}`
        }
      }

      const result = await response.json()
      
      if (!result.success) {
        console.error("❌ API returned error:", result.error)
        return {
          response: null,
          apiTime,
          error: result.error || "API returned success: false"
        }
      }

      console.log(`✅ API call successful - Found ${result.data.errors.length} errors`)
      
      return {
        response: result.data as GrammarCheckResponse,
        apiTime,
      }

    } catch (error) {
      const apiTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("❌ API call exception:", errorMessage)
      
      return {
        response: null,
        apiTime,
        error: errorMessage
      }
    }
  }

  /**
   * Analyze grammar check response for accuracy
   */
  private analyzeResponse(
    testCase: TestCase,
    response: GrammarCheckResponse
  ): { detectedSpelling: number; detectedGrammar: number } {
    console.log("🔍 Analyzing response accuracy...")
    
    const spellingErrors = response.errors.filter(error => error.type === "spelling")
    const grammarErrors = response.errors.filter(error => error.type === "grammar")
    
    console.log(`📊 Response breakdown:`)
    console.log(`  - Spelling errors detected: ${spellingErrors.length}`)
    console.log(`  - Grammar errors detected: ${grammarErrors.length}`)
    console.log(`  - Style errors detected: ${response.errors.filter(e => e.type === "style").length}`)

    // Check spelling error detection accuracy
    let detectedSpellingCount = 0
    for (const expectedWord of testCase.expected_spelling_errors) {
      const found = spellingErrors.some(error => 
        error.original.toLowerCase().includes(expectedWord.toLowerCase())
      )
      if (found) {
        detectedSpellingCount++
        console.log(`✅ Found expected spelling error: "${expectedWord}"`)
      } else {
        console.log(`❌ Missed expected spelling error: "${expectedWord}"`)
      }
    }

    // Check grammar error detection (binary: detected any when expected > 0)
    const detectedGrammarCount = testCase.expected_grammar_errors > 0 && grammarErrors.length > 0 ? 1 : 0
    
    if (testCase.expected_grammar_errors > 0) {
      if (grammarErrors.length > 0) {
        console.log(`✅ Grammar errors detected as expected`)
      } else {
        console.log(`❌ Expected grammar errors but none detected`)
      }
    } else {
      console.log(`ℹ️ No grammar errors expected for this sentence`)
    }

    return {
      detectedSpelling: detectedSpellingCount,
      detectedGrammar: detectedGrammarCount
    }
  }

  /**
   * Run all tests
   */
  public async runTests(): Promise<TestSummary> {
    console.log("🚀 Starting Grammar API Test Suite...")
    console.log("=" .repeat(50))
    
    // Load test data
    this.loadTestData()
    
    // Authenticate
    await this.authenticate()
    
    console.log("🧪 Running tests...")
    console.log("=" .repeat(50))

    // Run each test case
    for (let i = 0; i < this.testData.length; i++) {
      const testCase = this.testData[i]
      
      console.log(`\n📝 Test ${i + 1}/${this.testData.length}: "${testCase.incorrect_sentence}"`)
      console.log(`   Expected: ${testCase.expected_spelling_errors.length} spelling, ${testCase.expected_grammar_errors} grammar`)
      
      // Make API call
      const { response, apiTime, error } = await this.makeGrammarCheckCall(testCase.incorrect_sentence)
      
      if (error || !response) {
        console.log(`❌ Test ${i + 1} FAILED: ${error}`)
        
        this.results.push({
          sentenceIndex: i,
          sentence: testCase.incorrect_sentence,
          detectedSpelling: 0,
          expectedSpelling: testCase.expected_spelling_errors.length,
          detectedGrammar: 0,
          expectedGrammar: testCase.expected_grammar_errors > 0 ? 1 : 0,
          apiTime,
          success: false,
          error
        })
        continue
      }

      // Analyze accuracy
      const { detectedSpelling, detectedGrammar } = this.analyzeResponse(testCase, response)
      
      const result: TestResult = {
        sentenceIndex: i,
        sentence: testCase.incorrect_sentence,
        detectedSpelling,
        expectedSpelling: testCase.expected_spelling_errors.length,
        detectedGrammar,
        expectedGrammar: testCase.expected_grammar_errors > 0 ? 1 : 0,
        apiTime,
        success: true
      }
      
      this.results.push(result)
      
      // Log individual result
      console.log(`📊 Test ${i + 1} Results:`)
      console.log(`   Spelling: ${detectedSpelling}/${testCase.expected_spelling_errors.length} detected`)
      console.log(`   Grammar: ${detectedGrammar}/${testCase.expected_grammar_errors > 0 ? 1 : 0} detected`)
      console.log(`   API Time: ${apiTime}ms`)
      console.log(`   Status: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`)
      
      // Add delay between requests to avoid rate limiting
      if (i < this.testData.length - 1) {
        console.log("⏸️ Waiting 1 second before next test...")
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Calculate summary
    return this.calculateSummary()
  }

  /**
   * Calculate test summary and results
   */
  private calculateSummary(): TestSummary {
    console.log("\n" + "=" .repeat(50))
    console.log("📊 CALCULATING TEST SUMMARY...")
    console.log("=" .repeat(50))

    const successfulResults = this.results.filter(r => r.success)
    const apiTimes = successfulResults.map(r => r.apiTime)
    
    const totalExpectedSpelling = this.results.reduce((sum, r) => sum + r.expectedSpelling, 0)
    const totalDetectedSpelling = this.results.reduce((sum, r) => sum + r.detectedSpelling, 0)
    const totalExpectedGrammar = this.results.reduce((sum, r) => sum + r.expectedGrammar, 0)
    const totalDetectedGrammar = this.results.reduce((sum, r) => sum + r.detectedGrammar, 0)
    
    const totalPoints = totalExpectedSpelling + totalExpectedGrammar
    const detectedPoints = totalDetectedSpelling + totalDetectedGrammar
    const accuracyPercentage = totalPoints > 0 ? (detectedPoints / totalPoints) * 100 : 0
    
    const summary: TestSummary = {
      totalTests: this.results.length,
      totalExpectedSpelling,
      totalDetectedSpelling,
      totalExpectedGrammar,
      totalDetectedGrammar,
      totalPoints,
      detectedPoints,
      accuracyPercentage,
      averageApiTime: apiTimes.length > 0 ? apiTimes.reduce((sum, time) => sum + time, 0) / apiTimes.length : 0,
      minApiTime: apiTimes.length > 0 ? Math.min(...apiTimes) : 0,
      maxApiTime: apiTimes.length > 0 ? Math.max(...apiTimes) : 0,
      callsOver2s: apiTimes.filter(time => time > 2000).length,
      passedTests: successfulResults.length,
      failedTests: this.results.length - successfulResults.length
    }

    this.printSummary(summary)
    this.saveResults(summary)
    
    return summary
  }

  /**
   * Print formatted test summary
   */
  private printSummary(summary: TestSummary): void {
    console.log("\n" + "=" .repeat(60))
    console.log("🏆 GRAMMAR API TEST RESULTS")
    console.log("=" .repeat(60))
    
    console.log(`\n📈 ACCURACY RESULTS:`)
    console.log(`   Overall Accuracy: ${summary.accuracyPercentage.toFixed(1)}% (${summary.detectedPoints} out of ${summary.totalPoints} errors)`)
    console.log(`   Spelling Detection: ${summary.totalDetectedSpelling}/${summary.totalExpectedSpelling} (${summary.totalExpectedSpelling > 0 ? ((summary.totalDetectedSpelling / summary.totalExpectedSpelling) * 100).toFixed(1) : 0}%)`)
    console.log(`   Grammar Detection: ${summary.totalDetectedGrammar}/${summary.totalExpectedGrammar} (${summary.totalExpectedGrammar > 0 ? ((summary.totalDetectedGrammar / summary.totalExpectedGrammar) * 100).toFixed(1) : 0}%)`)
    
    console.log(`\n⏱️ PERFORMANCE RESULTS:`)
    console.log(`   Average API time: ${Math.round(summary.averageApiTime)}ms`)
    console.log(`   Minimum API time: ${summary.minApiTime}ms`)
    console.log(`   Maximum API time: ${summary.maxApiTime}ms`)
    console.log(`   Calls over 2s threshold: ${summary.callsOver2s}`)
    
    console.log(`\n🧪 TEST EXECUTION:`)
    console.log(`   Total tests: ${summary.totalTests}`)
    console.log(`   Passed tests: ${summary.passedTests}`)
    console.log(`   Failed tests: ${summary.failedTests}`)
    
    console.log(`\n🎯 PASS/FAIL STATUS:`)
    const accuracyPass = summary.accuracyPercentage >= 85
    const performancePass = summary.maxApiTime < 2000
    
    console.log(`   Accuracy: ${accuracyPass ? "✅ PASS" : "❌ FAIL"} (Goal: 85%, Actual: ${summary.accuracyPercentage.toFixed(1)}%)`)
    console.log(`   Performance: ${performancePass ? "✅ PASS" : "❌ FAIL"} (Goal: <2000ms, Max: ${summary.maxApiTime}ms)`)
    
    const overallPass = accuracyPass && performancePass
    console.log(`\n🏁 OVERALL RESULT: ${overallPass ? "✅ PASS" : "❌ FAIL"}`)
    
    console.log("=" .repeat(60))
  }

  /**
   * Save detailed results to file
   */
  private saveResults(summary: TestSummary): void {
    console.log("💾 Saving detailed results to file...")
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const resultsDir = path.join(process.cwd(), "docs", "test", "results")
    const resultsFile = path.join(resultsDir, `grammar_test_${timestamp}.log`)
    
    // Ensure results directory exists
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true })
    }
    
    let output = `Grammar API Test Results - ${new Date().toISOString()}\n`
    output += "=" .repeat(80) + "\n\n"
    
    // Individual test results
    output += "INDIVIDUAL TEST RESULTS:\n"
    output += "-" .repeat(40) + "\n"
    
    this.results.forEach((result, index) => {
      output += `Sentence ${index + 1}: ${result.detectedSpelling}/${result.expectedSpelling} spelling errors, `
      output += `${result.detectedGrammar}/${result.expectedGrammar} grammar errors detected, `
      output += `API time: ${result.apiTime}ms`
      
      if (!result.success) {
        output += ` - FAILED: ${result.error}`
      }
      
      output += `\n`
      output += `  Text: "${result.sentence}"\n\n`
    })
    
    // Summary results
    output += "\nSUMMARY RESULTS:\n"
    output += "-" .repeat(40) + "\n"
    output += `Overall Accuracy: ${summary.accuracyPercentage.toFixed(1)}% (${summary.detectedPoints} out of ${summary.totalPoints} errors)\n`
    output += `Performance Summary:\n`
    output += `- Average API time: ${Math.round(summary.averageApiTime)}ms\n`
    output += `- Minimum API time: ${summary.minApiTime}ms\n`
    output += `- Maximum API time: ${summary.maxApiTime}ms\n`
    output += `- Calls over 2s threshold: ${summary.callsOver2s}\n\n`
    
    const accuracyPass = summary.accuracyPercentage >= 85
    const performancePass = summary.maxApiTime < 2000
    
    output += `PASS/FAIL:\n`
    output += `- Accuracy: ${accuracyPass ? "PASS" : "FAIL"} (Goal: 85%, Actual: ${summary.accuracyPercentage.toFixed(1)}%)\n`
    output += `- Performance: ${performancePass ? "PASS" : "FAIL"} (Goal: <2000ms, Max: ${summary.maxApiTime}ms)\n`
    
    fs.writeFileSync(resultsFile, output)
    console.log(`📄 Results saved to: ${resultsFile}`)
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🧪 Grammar API Test Suite")
  console.log("=" .repeat(40))
  
  try {
    const tester = new GrammarAPITester()
    const summary = await tester.runTests()
    
    // Exit with appropriate code
    const success = summary.accuracyPercentage >= 85 && summary.maxApiTime < 2000
    process.exit(success ? 0 : 1)
    
  } catch (error) {
    console.error("💥 Test suite failed with error:", error)
    process.exit(1)
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  main()
}

export { GrammarAPITester } 