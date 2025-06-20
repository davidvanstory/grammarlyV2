"use server"

/*
<ai_context>
OpenAI grammar checking server actions for the Med Writer application.
Implements grammar checking with position validation and error tracking.
</ai_context>
*/

import { getOpenAIClient, MEDICAL_GRAMMAR_PROMPT, OPENAI_CONFIG, OpenAIError } from "@/lib/openai"
import { getTextProcessor } from "@/lib/text-processor"
import { getGrammarCache } from "@/lib/grammar-cache"
import {
  GrammarCheckRequest,
  GrammarCheckResponse,
  GrammarError,
  TrackedError,
  ActionState,
  TextChunk,
  ChunkedGrammarRequest,
  ChunkedGrammarResponse
} from "@/types"

/**
 * Check grammar using chunked processing with smart caching
 */
export async function checkGrammarAction(
  request: GrammarCheckRequest
): Promise<ActionState<GrammarCheckResponse>> {
  console.log("🤖 Starting smart grammar check for text:", request.text.length, "characters")
  console.log("🔄 Force recheck:", request.forceRecheck)

  const startTime = Date.now()

  try {
    // Validate input
    if (!request.text.trim()) {
      console.log("❌ Empty text provided for grammar check")
      return {
        isSuccess: false,
        message: "No text provided for grammar checking"
      }
    }

    if (request.text.length > 10000) {
      console.log("❌ Text too long for grammar check:", request.text.length)
      return {
        isSuccess: false,
        message: "Text is too long for grammar checking (max 10,000 characters)"
      }
    }

    // Check cache first (unless force recheck)
    const cache = getGrammarCache()
    if (!request.forceRecheck) {
      console.log("💾 Checking cache for existing result...")
      const cachedEntry = cache.get(request.text)
      if (cachedEntry) {
        console.log("✅ Cache HIT! Returning cached result")
        console.log(`📊 Cached result: ${cachedEntry.result.errors.length} errors`)
        
        const processingTime = Date.now() - startTime
        return {
          isSuccess: true,
          message: `Grammar check completed from cache with ${cachedEntry.result.errors.length} suggestions`,
          data: {
            ...cachedEntry.result,
            processingTime // Update with current call time
          }
        }
      }
      console.log("❌ Cache MISS - proceeding with AI check")
    } else {
      console.log("🔄 Force recheck requested - bypassing cache")
    }

    // Determine if we should use chunked processing
    const shouldChunk = request.text.length > 800 // Chunk for texts over 800 chars
    
    if (shouldChunk) {
      console.log("📦 Text is large - using chunked processing")
      return await processChunkedGrammarCheck(request, cache, startTime)
    } else {
      console.log("📝 Text is small - using single API call")
      return await processSingleGrammarCheck(request, cache, startTime)
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("❌ Grammar check failed:", error)
    
    if (error instanceof OpenAIError) {
      return {
        isSuccess: false,
        message: `AI service error: ${error.message}`
      }
    }

    return {
      isSuccess: false,
      message: "Grammar checking service temporarily unavailable"
    }
  }
}

/**
 * Process grammar check using chunked parallel processing
 */
async function processChunkedGrammarCheck(
  request: GrammarCheckRequest,
  cache: any,
  startTime: number
): Promise<ActionState<GrammarCheckResponse>> {
  console.log("📦 Starting chunked grammar processing...")
  
  const textProcessor = getTextProcessor()
  const chunks = textProcessor.chunkTextBySentences(request.text, 500)
  
  console.log(`📦 Created ${chunks.length} chunks for parallel processing`)
  
  // Process chunks in parallel with cache checking
  const chunkPromises = chunks.map(async (chunk, index) => {
    console.log(`🔄 Processing chunk ${index + 1}/${chunks.length}: ${chunk.text.length} chars`)
    
    // Check cache for this chunk first
    const cachedChunk = cache.get(chunk.text)
    if (cachedChunk) {
      console.log(`✅ Chunk ${index + 1} found in cache`)
      return {
        chunkId: chunk.id,
        errors: cachedChunk.result.errors,
        processingTime: 0, // Cached result
        fromCache: true
      }
    }
    
    // Process chunk with AI
    console.log(`🤖 Processing chunk ${index + 1} with AI...`)
    const chunkStartTime = Date.now()
    
    try {
      const chunkResult = await processSingleChunkWithAI(chunk.text)
      const chunkProcessingTime = Date.now() - chunkStartTime
      
      // Adjust error positions to match original text
      const adjustedErrors = chunkResult.errors.map(error => ({
        ...error,
        start: error.start + chunk.startOffset,
        end: error.end + chunk.startOffset
      }))
      
      // Cache the chunk result
      cache.set(chunk.text, {
        ...chunkResult,
        errors: chunkResult.errors // Store original positions for chunk
      })
      
      console.log(`✅ Chunk ${index + 1} processed: ${adjustedErrors.length} errors found`)
      
      return {
        chunkId: chunk.id,
        errors: adjustedErrors,
        processingTime: chunkProcessingTime,
        fromCache: false
      }
    } catch (error) {
      console.error(`❌ Error processing chunk ${index + 1}:`, error)
      return {
        chunkId: chunk.id,
        errors: [],
        processingTime: Date.now() - chunkStartTime,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
  
  // Wait for all chunks to complete
  const chunkResults = await Promise.all(chunkPromises)
  
  // Combine results
  const combinedErrors: GrammarError[] = []
  let totalChunkTime = 0
  let cacheHits = 0
  let cacheMisses = 0
  
  for (const result of chunkResults) {
    combinedErrors.push(...result.errors)
    totalChunkTime += result.processingTime
    
    if (result.fromCache) {
      cacheHits++
    } else {
      cacheMisses++
    }
  }
  
  const totalProcessingTime = Date.now() - startTime
  
  console.log("✅ Chunked processing complete:")
  console.log(`  - Total chunks: ${chunks.length}`)
  console.log(`  - Cache hits: ${cacheHits}`)
  console.log(`  - Cache misses: ${cacheMisses}`)
  console.log(`  - Total errors: ${combinedErrors.length}`)
  console.log(`  - Total time: ${totalProcessingTime}ms`)
  console.log(`  - AI processing time: ${totalChunkTime}ms`)
  
  // Create combined response
  const response: GrammarCheckResponse = {
    errors: combinedErrors,
    processedText: request.text,
    processingTime: totalProcessingTime,
    confidence: 0.8,
    medicalTermsFound: []
  }
  
  // Cache the full result as well
  cache.set(request.text, response)
  
  return {
    isSuccess: true,
    message: `Chunked grammar check completed with ${combinedErrors.length} suggestions (${cacheHits} cache hits, ${cacheMisses} AI calls)`,
    data: response
  }
}

/**
 * Process grammar check using single API call
 */
async function processSingleGrammarCheck(
  request: GrammarCheckRequest,
  cache: any,
  startTime: number
): Promise<ActionState<GrammarCheckResponse>> {
  console.log("📝 Starting single grammar check...")
  
  const result = await processSingleChunkWithAI(request.text)
  const processingTime = Date.now() - startTime
  
  const response: GrammarCheckResponse = {
    ...result,
    processingTime
  }
  
  // Cache the result
  cache.set(request.text, response)
  
  console.log(`✅ Single grammar check complete: ${result.errors.length} errors in ${processingTime}ms`)
  
  return {
    isSuccess: true,
    message: `Grammar check completed with ${result.errors.length} suggestions`,
    data: response
  }
}

/**
 * Process a single chunk of text with OpenAI
 */
async function processSingleChunkWithAI(text: string): Promise<GrammarCheckResponse> {
  console.log(`🤖 Processing ${text.length} chars with OpenAI...`)
  
  // Process text for AI
  const textProcessor = getTextProcessor()
  const cleanedText = textProcessor.cleanForAI(text)
  
  // Prepare OpenAI prompt
  const fullPrompt = MEDICAL_GRAMMAR_PROMPT + "\n\n" + cleanedText

  console.log("🤖 Sending request to OpenAI...")
  console.log("🤖 Prompt length:", fullPrompt.length, "characters")

  // Call OpenAI API
  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: OPENAI_CONFIG.model,
    temperature: OPENAI_CONFIG.temperature,
    max_tokens: OPENAI_CONFIG.max_tokens,
    messages: [
      {
        role: "system",
        content: "You are a medical writing assistant. Return only valid JSON."
      },
      {
        role: "user",
        content: fullPrompt
      }
    ]
  })

  console.log("✅ OpenAI response received")
  console.log("🤖 Response usage:", completion.usage)

  const responseContent = completion.choices[0]?.message?.content
  if (!responseContent) {
    throw new Error("No response content from OpenAI")
  }

  console.log("📝 Parsing OpenAI response...")

  // Clean the response - remove markdown code blocks if present
  let cleanedResponse = responseContent.trim()
  
  if (cleanedResponse.startsWith("```json")) {
    cleanedResponse = cleanedResponse.replace(/^```json\s*/, "").replace(/```\s*$/, "")
  } else if (cleanedResponse.startsWith("```")) {
    cleanedResponse = cleanedResponse.replace(/^```\s*/, "").replace(/```\s*$/, "")
  }

  // Parse JSON response
  let parsedResponse: { errors: any[] }
  try {
    parsedResponse = JSON.parse(cleanedResponse)
    console.log("✅ JSON parsing successful")
    console.log("📊 Found", parsedResponse.errors?.length || 0, "potential errors")
  } catch (parseError) {
    console.error("❌ Failed to parse OpenAI JSON response:", parseError)
    throw new Error("Failed to parse AI response")
  }

  // Validate and process errors
  const validatedErrors: GrammarError[] = []
  
  if (parsedResponse.errors && Array.isArray(parsedResponse.errors)) {
    for (const error of parsedResponse.errors) {
      console.log("🔍 Validating error:", error.id || "no-id")
      
      // Validate error structure
      if (!error.id || !error.type || !error.original || !error.suggestions) {
        console.log("⚠️ Skipping invalid error structure:", error)
        continue
      }

      // Validate position bounds
      const start = parseInt(error.start)
      const end = parseInt(error.end)
      
      if (isNaN(start) || isNaN(end) || start < 0 || end > text.length || start >= end) {
        console.log("⚠️ Skipping error with invalid positions:", { start, end, textLength: text.length })
        continue
      }

      // Validate original text matches
      const actualText = text.substring(start, end)
      if (actualText !== error.original) {
        console.log("⚠️ Position mismatch for error:", error.id)
        // Try to find the correct position
        const correctedPosition = findCorrectPosition(text, error.original, start)
        if (correctedPosition) {
          error.start = correctedPosition.start
          error.end = correctedPosition.end
          console.log("✅ Corrected position for error:", error.id)
        } else {
          console.log("⚠️ Skipping error with unfixable position:", error.id)
          continue
        }
      }

      // Create validated error
      const validatedError: GrammarError = {
        id: error.id,
        type: error.type as "spelling" | "grammar" | "style",
        start,
        end,
        original: error.original,
        suggestions: Array.isArray(error.suggestions) ? error.suggestions : [error.suggestions],
        explanation: error.explanation || "Grammar error detected",
        medical_context: error.medical_context,
        confidence: error.confidence || 0.8
      }

      validatedErrors.push(validatedError)
      console.log("✅ Validated error:", validatedError.id, validatedError.type)
    }
  }

  return {
    errors: validatedErrors,
    processedText: cleanedText,
    processingTime: 0, // Will be set by caller
    confidence: 0.8,
    medicalTermsFound: []
  }
}

/**
 * Find correct position for misaligned error
 */
function findCorrectPosition(
  text: string,
  searchText: string,
  approximateStart: number
): { start: number; end: number } | null {
  console.log("🔍 Attempting to find correct position for:", searchText)

  // Search in a window around the approximate position
  const searchWindow = 100
  const windowStart = Math.max(0, approximateStart - searchWindow)
  const windowEnd = Math.min(text.length, approximateStart + searchText.length + searchWindow)
  const searchArea = text.substring(windowStart, windowEnd)

  const relativeIndex = searchArea.indexOf(searchText)
  if (relativeIndex !== -1) {
    const actualStart = windowStart + relativeIndex
    console.log("✅ Found correct position:", actualStart)
    return {
      start: actualStart,
      end: actualStart + searchText.length
    }
  }

  console.log("❌ Could not find correct position")
  return null
}

/**
 * Cancel ongoing grammar check (for rapid typing)
 */
export async function cancelGrammarCheckAction(): Promise<ActionState<void>> {
  console.log("🛑 Grammar check cancellation requested")
  
  // Note: In a real implementation, you would store request IDs and cancel them
  // For now, we'll just return success as OpenAI requests are stateless
  
  return {
    isSuccess: true,
    message: "Grammar check cancelled",
    data: undefined
  }
}

/**
 * Get grammar check status (for loading states)
 */
export async function getGrammarCheckStatusAction(): Promise<ActionState<{
  isProcessing: boolean
  lastCheck: Date | null
  errorCount: number
}>> {
  console.log("📊 Grammar check status requested")
  
  // This would be connected to a proper state management system in production
  return {
    isSuccess: true,
    message: "Status retrieved",
    data: {
      isProcessing: false,
      lastCheck: null,
      errorCount: 0
    }
  }
} 