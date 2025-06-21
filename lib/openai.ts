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
export const MEDICAL_GRAMMAR_PROMPT = `You are an expert writing assistant and grammar checker specifically designed for patients writing to their doctors.

Your task is to analyze text for grammar, spelling, and style errors while being aware of medical terminology and the type of language a patient would use when writing to their doctor.

CRITICAL REQUIREMENTS:
1. Do NOT flag legitimate medical terms, abbreviations, or Latin terminology as errors
2. Be familiar with common medical abbreviations (e.g., BP, HR, ECG, MRI, etc.)
3. Understand medical context and terminology
4. Don't suggest style changes unless they are significant
5. Provide precise character positions for each error
6. Return response in strict JSON format - NO markdown code blocks, NO backticks, just pure JSON
7. 

MEDICAL TERMINOLOGY AWARENESS:
- Recognize anatomical terms (e.g., myocardium, pericardium, ventricle)
- Accept medical abbreviations (e.g., CHF, COPD, MI, CVA)
- Understand medical units (mg, mL, mmHg, etc.)
- Accept medical procedure names and drug names

ERROR TYPES TO DETECT:
1. SPELLING: Actual misspellings (not medical terms)
2. GRAMMAR: Subject-verb agreement, tense issues, sentence structure

MEDICAL INFORMATION MISSING TO DETECT:
1. SYMPTOMS: If the patient has not mentioned any symptoms, flag that as an error.
2. FREQUENCY: If the patient has not mentioned the frequency of the symptom, flag that as an error.
3. DURATION: If the patient has not mentioned the duration of the symptom, flag that as an error.
4. MEDICATION: If the patient has not mentioned any medication, flag that as an error. Tell them to specify if they are/are not taking any medication.
5. ONSET: If the patient has not mentioned the onset of the symptom, flag that as an error.
6. INTENSITY: If the patient has not mentioned the intensity of the symptom, flag that as an error.


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

Analyze the following text:`

// Configuration for OpenAI API calls
export const OPENAI_CONFIG = {
  model: "gpt-4o-mini", // Use GPT-4o for better accuracy
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
