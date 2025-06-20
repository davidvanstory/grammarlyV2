/*
<ai_context>
Grammar error parsing utilities for the Med Writer application.
Handles OpenAI response parsing, position validation, and error classification.
</ai_context>
*/

import {
  GrammarError,
  TrackedError,
  ErrorType,
  TextPosition,
  PositionValidation,
  ErrorStatus
} from "@/types/grammar-types"

/**
 * Error parser class for handling OpenAI grammar check responses
 */
export class ErrorParser {
  private static instance: ErrorParser

  constructor() {
    console.log("🔍 Error parser initialized")
  }

  static getInstance(): ErrorParser {
    if (!ErrorParser.instance) {
      ErrorParser.instance = new ErrorParser()
    }
    return ErrorParser.instance
  }

  /**
   * Parse raw OpenAI response into validated grammar errors
   */
  parseOpenAIResponse(
    rawResponse: string,
    originalText: string,
    previousErrors: TrackedError[] = []
  ): {
    errors: GrammarError[]
    parseErrors: string[]
    validationErrors: string[]
  } {
    console.log("🔍 Parsing OpenAI response...")
    console.log("📝 Response length:", rawResponse.length)
    console.log("📝 Original text length:", originalText.length)

    const parseErrors: string[] = []
    const validationErrors: string[] = []
    const validatedErrors: GrammarError[] = []

    try {
      // Parse JSON response
      let parsedData: any
      try {
        parsedData = JSON.parse(rawResponse)
        console.log("✅ JSON parsing successful")
      } catch (error) {
        console.error("❌ JSON parsing failed:", error)
        parseErrors.push("Invalid JSON format in AI response")
        return { errors: [], parseErrors, validationErrors }
      }

      // Validate response structure
      if (!parsedData || typeof parsedData !== "object") {
        parseErrors.push("Response is not a valid object")
        return { errors: [], parseErrors, validationErrors }
      }

      if (!Array.isArray(parsedData.errors)) {
        parseErrors.push("Response does not contain errors array")
        return { errors: [], parseErrors, validationErrors }
      }

      console.log(
        "📊 Found",
        parsedData.errors.length,
        "potential errors to validate"
      )

      // Process each error
      for (let i = 0; i < parsedData.errors.length; i++) {
        const rawError = parsedData.errors[i]
        console.log(
          `🔍 Processing error ${i + 1}/${parsedData.errors.length}:`,
          rawError.id || "no-id"
        )

        const validationResult = this.validateError(rawError, originalText, i)

        if (validationResult.isValid && validationResult.error) {
          validatedErrors.push(validationResult.error)
          console.log("✅ Error validated:", validationResult.error.id)
        } else {
          validationErrors.push(
            validationResult.reason || `Error ${i + 1} validation failed`
          )
          console.log("❌ Error validation failed:", validationResult.reason)
        }
      }

      console.log("📊 Validation complete:")
      console.log("  - Valid errors:", validatedErrors.length)
      console.log("  - Parse errors:", parseErrors.length)
      console.log("  - Validation errors:", validationErrors.length)

      return {
        errors: validatedErrors,
        parseErrors,
        validationErrors
      }
    } catch (error) {
      console.error("❌ Error parsing failed:", error)
      parseErrors.push(
        `Parsing error: ${error instanceof Error ? error.message : "Unknown error"}`
      )
      return { errors: [], parseErrors, validationErrors }
    }
  }

  /**
   * Validate individual error from OpenAI response
   */
  private validateError(
    rawError: any,
    originalText: string,
    index: number
  ): {
    isValid: boolean
    error?: GrammarError
    reason?: string
  } {
    console.log("🔍 Validating error structure...")

    // Validate required fields
    if (!rawError || typeof rawError !== "object") {
      return { isValid: false, reason: "Error is not an object" }
    }

    // Generate ID if missing
    const errorId = rawError.id || `error_${Date.now()}_${index}`

    // Validate error type
    const validTypes: ErrorType[] = ["spelling", "grammar", "style"]
    if (!rawError.type || !validTypes.includes(rawError.type)) {
      return { isValid: false, reason: `Invalid error type: ${rawError.type}` }
    }

    // Validate positions
    const start = parseInt(rawError.start)
    const end = parseInt(rawError.end)

    if (isNaN(start) || isNaN(end)) {
      return { isValid: false, reason: "Invalid position numbers" }
    }

    if (start < 0 || end > originalText.length || start >= end) {
      return {
        isValid: false,
        reason: `Invalid position range: ${start}-${end} (text length: ${originalText.length})`
      }
    }

    // Validate original text matches
    const actualText = originalText.substring(start, end)
    if (!rawError.original || actualText !== rawError.original) {
      console.log("⚠️ Position mismatch detected")
      console.log("  Expected:", rawError.original)
      console.log("  Actual:", actualText)

      // Try to find correct position
      const correctedPosition = this.findCorrectPosition(
        originalText,
        rawError.original,
        start
      )
      if (correctedPosition) {
        rawError.start = correctedPosition.start
        rawError.end = correctedPosition.end
        console.log("✅ Position corrected")
      } else {
        return {
          isValid: false,
          reason: "Could not match original text to position"
        }
      }
    }

    // Validate suggestions
    if (
      !rawError.suggestions ||
      (!Array.isArray(rawError.suggestions) &&
        typeof rawError.suggestions !== "string")
    ) {
      return { isValid: false, reason: "Invalid suggestions format" }
    }

    const suggestions = Array.isArray(rawError.suggestions)
      ? rawError.suggestions
      : [rawError.suggestions]

    if (suggestions.length === 0) {
      return { isValid: false, reason: "No suggestions provided" }
    }

    // Create validated error
    const validatedError: GrammarError = {
      id: errorId,
      type: rawError.type as ErrorType,
      start: parseInt(rawError.start),
      end: parseInt(rawError.end),
      original: rawError.original,
      suggestions: suggestions.filter(
        (s: any) => typeof s === "string" && s.trim().length > 0
      ),
      explanation: rawError.explanation || "Grammar error detected",
      medical_context: rawError.medical_context,
      confidence: this.validateConfidence(rawError.confidence)
    }

    console.log("✅ Error validation successful:", validatedError.id)
    return { isValid: true, error: validatedError }
  }

  /**
   * Find correct position for misaligned text
   */
  private findCorrectPosition(
    text: string,
    target: string,
    approximateStart: number,
    searchWindow: number = 100
  ): { start: number; end: number } | null {
    console.log(
      "🔍 Searching for correct position of:",
      target.substring(0, 50)
    )

    // Search in expanding windows
    const windows = [searchWindow, searchWindow * 2, searchWindow * 4]

    for (const window of windows) {
      const searchStart = Math.max(0, approximateStart - window)
      const searchEnd = Math.min(text.length, approximateStart + window)
      const searchText = text.substring(searchStart, searchEnd)

      const index = searchText.indexOf(target)
      if (index !== -1) {
        const actualStart = searchStart + index
        const actualEnd = actualStart + target.length
        console.log("✅ Found correct position:", {
          start: actualStart,
          end: actualEnd
        })
        return { start: actualStart, end: actualEnd }
      }
    }

    // Try fuzzy matching for minor differences
    return this.fuzzyPositionMatch(text, target, approximateStart, searchWindow)
  }

  /**
   * Fuzzy position matching for slight text differences
   */
  private fuzzyPositionMatch(
    text: string,
    target: string,
    approximateStart: number,
    searchWindow: number
  ): { start: number; end: number } | null {
    console.log("🔍 Attempting fuzzy position matching...")

    const searchStart = Math.max(0, approximateStart - searchWindow)
    const searchEnd = Math.min(text.length, approximateStart + searchWindow)

    // Try matching with normalized text (remove extra spaces, etc.)
    const normalizedTarget = target.replace(/\s+/g, " ").trim()

    for (let i = searchStart; i < searchEnd - normalizedTarget.length; i++) {
      const candidate = text.substring(i, i + normalizedTarget.length)
      const normalizedCandidate = candidate.replace(/\s+/g, " ").trim()

      if (normalizedCandidate === normalizedTarget) {
        console.log("✅ Fuzzy match found:", {
          start: i,
          end: i + candidate.length
        })
        return { start: i, end: i + candidate.length }
      }
    }

    console.log("❌ No fuzzy match found")
    return null
  }

  /**
   * Validate confidence score
   */
  private validateConfidence(confidence: any): number {
    if (typeof confidence === "number" && confidence >= 0 && confidence <= 1) {
      return confidence
    }

    if (typeof confidence === "string") {
      const parsed = parseFloat(confidence)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed
      }
    }

    // Default confidence
    return 0.8
  }

  /**
   * Convert GrammarError to TrackedError
   */
  convertToTrackedError(
    grammarError: GrammarError,
    status: ErrorStatus = "pending"
  ): TrackedError {
    console.log("🔄 Converting to tracked error:", grammarError.id)

    const trackedError: TrackedError = {
      ...grammarError,
      status,
      originalPosition: {
        start: grammarError.start,
        end: grammarError.end
      },
      currentPosition: {
        start: grammarError.start,
        end: grammarError.end
      }
    }

    return trackedError
  }

  /**
   * Validate position against DOM content
   */
  validatePosition(error: GrammarError, domText: string): PositionValidation {
    console.log("🔍 Validating position against DOM:", error.id)

    const actualText = domText.substring(error.start, error.end)
    const isValid = actualText === error.original

    if (isValid) {
      console.log("✅ Position validation successful")
      return {
        isValid: true,
        actualText,
        expectedText: error.original
      }
    }

    console.log("❌ Position validation failed")
    console.log("  Expected:", error.original)
    console.log("  Actual:", actualText)

    // Try to find adjusted position
    const adjustedPosition = this.findCorrectPosition(
      domText,
      error.original,
      error.start
    )

    return {
      isValid: false,
      actualText,
      expectedText: error.original,
      adjustedPosition: adjustedPosition
        ? {
            start: adjustedPosition.start,
            end: adjustedPosition.end
          }
        : undefined,
      error: `Position mismatch for error ${error.id}`
    }
  }

  /**
   * Generate unique error ID
   */
  generateErrorId(type: ErrorType, position: number): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${type}_${position}_${timestamp}_${random}`
  }

  /**
   * Merge similar errors to avoid duplicates
   */
  mergeSimilarErrors(errors: GrammarError[]): GrammarError[] {
    console.log("🔄 Merging similar errors...")
    console.log("📊 Input errors:", errors.length)

    const mergedErrors: GrammarError[] = []
    const processedPositions = new Set<string>()

    for (const error of errors) {
      const positionKey = `${error.start}-${error.end}`

      if (processedPositions.has(positionKey)) {
        console.log("⚠️ Skipping duplicate position:", positionKey)
        continue
      }

      // Check for overlapping errors
      const overlapping = mergedErrors.find(existing =>
        this.errorsOverlap(existing, error)
      )

      if (overlapping) {
        console.log(
          "🔄 Merging overlapping errors:",
          error.id,
          "with",
          overlapping.id
        )
        // Merge suggestions and keep the higher confidence error
        if (
          error.confidence &&
          overlapping.confidence &&
          error.confidence > overlapping.confidence
        ) {
          overlapping.suggestions = [
            ...new Set([...overlapping.suggestions, ...error.suggestions])
          ]
          overlapping.confidence = error.confidence
          overlapping.explanation = error.explanation
        }
      } else {
        mergedErrors.push(error)
        processedPositions.add(positionKey)
      }
    }

    console.log("📊 Merged errors:", mergedErrors.length)
    return mergedErrors
  }

  /**
   * Check if two errors overlap
   */
  private errorsOverlap(error1: GrammarError, error2: GrammarError): boolean {
    return !(error1.end <= error2.start || error2.end <= error1.start)
  }
}

// Export singleton instance
export const errorParser = ErrorParser.getInstance()

// Export convenience functions
export function parseGrammarErrors(
  rawResponse: string,
  originalText: string,
  previousErrors: TrackedError[] = []
) {
  return errorParser.parseOpenAIResponse(
    rawResponse,
    originalText,
    previousErrors
  )
}

export function validateErrorPosition(error: GrammarError, domText: string) {
  return errorParser.validatePosition(error, domText)
}

export function convertToTrackedErrors(errors: GrammarError[]): TrackedError[] {
  return errors.map(error => errorParser.convertToTrackedError(error))
}

export function mergeSimilarErrors(errors: GrammarError[]): GrammarError[] {
  return errorParser.mergeSimilarErrors(errors)
}
