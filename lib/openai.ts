/*
<ai_context>
Server-side OpenAI client configuration for grammar checking and medical text analysis.
This file should only be imported in server-side code to avoid client-side instantiation.
</ai_context>
*/

import OpenAI from "openai"

// Server-side OpenAI client factory function
export function createOpenAIClient(): OpenAI {
  console.log("🤖 Creating OpenAI client...")

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is not configured")
    throw new Error("OPENAI_API_KEY environment variable is required")
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

// Get or create OpenAI client instance (server-side only)
let openaiInstance: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = createOpenAIClient()
  }
  return openaiInstance
}

// Medical-specific prompts for grammar checking
export const MEDICAL_GRAMMAR_PROMPT = `You are an expert medical writing assistant and grammar checker specifically designed for medical students, healthcare professionals, and medical educators.

Your task is to analyze medical text for grammar, spelling, and style errors while being aware of medical terminology.

CRITICAL REQUIREMENTS:
1. Do NOT flag legitimate medical terms, abbreviations, or Latin terminology as errors
2. Be familiar with common medical abbreviations (e.g., BP, HR, ECG, MRI, etc.)
3. Understand medical context and terminology
4. Provide precise character positions for each error
5. Return response in strict JSON format

MEDICAL TERMINOLOGY AWARENESS:
- Recognize anatomical terms (e.g., myocardium, pericardium, ventricle)
- Accept medical abbreviations (e.g., CHF, COPD, MI, CVA)
- Allow Latin medical terms (e.g., in situ, per os, ad libitum)
- Understand medical units (mg, mL, mmHg, etc.)
- Accept medical procedure names and drug names

ERROR TYPES TO DETECT:
1. SPELLING: Actual misspellings (not medical terms)
2. GRAMMAR: Subject-verb agreement, tense issues, sentence structure
3. STYLE: Unclear phrasing, redundancy, word choice improvements

RESPONSE FORMAT (strict JSON):
{
  "errors": [
    {
      "id": "unique_error_id",
      "type": "spelling|grammar|style",
      "start": number,
      "end": number,
      "original": "original text",
      "suggestions": ["suggestion1", "suggestion2"],
      "explanation": "Brief explanation of the error",
      "medical_context": "Additional medical context if relevant"
    }
  ]
}

POSITION ACCURACY: Character positions must be exact. Count carefully from the beginning of the text (0-indexed).

Analyze the following medical text:`

// Configuration for OpenAI API calls
export const OPENAI_CONFIG = {
  model: "gpt-4o", // Use GPT-4o for better accuracy
  temperature: 0.1, // Low temperature for consistent results
  max_tokens: 2000,
  timeout: 30000 // 30 second timeout
} as const

// Error handling for OpenAI API calls
export class OpenAIError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = "OpenAIError"
  }
}

// Logging utility for OpenAI operations
export function logOpenAIOperation(operation: string, details?: any) {
  console.log(`🤖 OpenAI ${operation}:`, details || "")
}
