"use server"

/*
<ai_context>
OpenAI grammar checking server actions for the Med Writer application.
Implements grammar checking with position validation and error tracking.
</ai_context>
*/

import { getOpenAIClient, MEDICAL_GRAMMAR_PROMPT, OPENAI_CONFIG, OpenAIError } from "@/lib/openai"
import { getTextProcessor } from "@/lib/text-processor"
import {
  GrammarCheckRequest,
  GrammarCheckResponse,
  GrammarError,
  TrackedError,
  ActionState
} from "@/types"

/**
 * Check grammar using OpenAI GPT-4o with medical terminology awareness
 */
export async function checkGrammarAction(
  request: GrammarCheckRequest
): Promise<ActionState<GrammarCheckResponse>> {
  console.log("🤖 Starting grammar check for text:", request.text.length, "characters")
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

    // Process text for AI
    console.log("📝 Processing text for AI...")
    const textProcessor = getTextProcessor()
    const cleanedText = textProcessor.cleanForAI(request.text)
    
    console.log("📝 Text cleaned for AI processing")

    // Prepare OpenAI prompt (medical prompt is preserved)
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
      console.error("❌ No response content from OpenAI")
      return {
        isSuccess: false,
        message: "No response from AI grammar checker"
      }
    }

    console.log("📝 Parsing OpenAI response...")
    console.log("📝 Raw response length:", responseContent.length)

    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = responseContent.trim()
    
    // Remove markdown code blocks (```json and ```)
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, "").replace(/```\s*$/, "")
      console.log("🧹 Removed markdown code blocks from response")
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, "").replace(/```\s*$/, "")
      console.log("🧹 Removed generic code blocks from response")
    }
    
    console.log("📝 Cleaned response length:", cleanedResponse.length)

    // Parse JSON response
    let parsedResponse: { errors: any[] }
    try {
      parsedResponse = JSON.parse(cleanedResponse)
      console.log("✅ JSON parsing successful")
      console.log("📊 Found", parsedResponse.errors?.length || 0, "potential errors")
    } catch (parseError) {
      console.error("❌ Failed to parse OpenAI JSON response:", parseError)
      console.log("📝 Raw response:", responseContent.substring(0, 500))
      console.log("📝 Cleaned response:", cleanedResponse.substring(0, 500))
      return {
        isSuccess: false,
        message: "Failed to parse AI response"
      }
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
        
        if (isNaN(start) || isNaN(end) || start < 0 || end > request.text.length || start >= end) {
          console.log("⚠️ Skipping error with invalid positions:", { start, end, textLength: request.text.length })
          continue
        }

        // Validate original text matches
        const actualText = request.text.substring(start, end)
        if (actualText !== error.original) {
          console.log("⚠️ Position mismatch for error:", error.id)
          console.log("  Expected:", error.original)
          console.log("  Actual:", actualText)
          // Try to find the correct position
          const correctedPosition = findCorrectPosition(request.text, error.original, start)
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

    const processingTime = Date.now() - startTime
    console.log("⏱️ Grammar check completed in", processingTime, "ms")
    console.log("📊 Final results:", validatedErrors.length, "valid errors")

    // Create response
    const response: GrammarCheckResponse = {
      errors: validatedErrors,
      processedText: cleanedText,
      processingTime,
      confidence: 0.8, // Default confidence since we removed medical confidence calculation
      medicalTermsFound: [] // Empty since we removed medical term extraction
    }

    return {
      isSuccess: true,
      message: `Grammar check completed with ${validatedErrors.length} suggestions`,
      data: response
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