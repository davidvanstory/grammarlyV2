/*
<ai_context>
Medical analysis prompts and configurations for the Med Writer application.
Defines the AI prompts and field configurations for analyzing patient medical information completeness.
</ai_context>
*/

// Medical information analysis prompt for OpenAI
export const MEDICAL_INFORMATION_PROMPT = `You are a medical communication expert that analyzes patient messages to doctors.

Your task is to evaluate whether the patient has provided key medical information categories that doctors typically need.

CRITICAL REQUIREMENTS:
1. Analyze the text for the presence of these medical information categories
2. For each category, determine if it's: "missing", "provided", or "partial"
3. Provide specific suggestions for missing information
4. Return response in strict JSON format - NO markdown code blocks, NO backticks, just pure JSON

MEDICAL INFORMATION CATEGORIES TO EVALUATE:

1. SYMPTOMS: Has the patient described their specific symptoms clearly?
   - "missing": No symptoms mentioned
   - "partial": Vague symptoms (e.g., "not feeling well")
   - "provided": Specific symptoms described (e.g., "sharp chest pain", "persistent cough")

2. FREQUENCY: How often do the symptoms occur?
   - "missing": No frequency information
   - "partial": Vague frequency (e.g., "sometimes")
   - "provided": Specific frequency (e.g., "3 times daily", "every morning")

3. DURATION: How long have the symptoms been present?
   - "missing": No duration mentioned
   - "partial": Vague duration (e.g., "for a while")
   - "provided": Specific duration (e.g., "for 2 weeks", "since Monday")

4. MEDICATION: Current medications or treatments?
   - "missing": No medication information
   - "partial": Mentions some medications but unclear
   - "provided": Clear medication list or statement of no medications

5. ONSET: When/how did the symptoms start?
   - "missing": No onset information
   - "partial": Vague onset (e.g., "started recently")
   - "provided": Specific onset (e.g., "started after eating", "began Sunday morning")

6. INTENSITY: How severe are the symptoms?
   - "missing": No severity information
   - "partial": Vague severity (e.g., "bad", "uncomfortable")
   - "provided": Specific severity (e.g., "7/10 pain", "mild burning sensation")

RESPONSE FORMAT (strict JSON only - NO markdown, NO backticks):
{
  "fields": [
    {
      "type": "symptoms|frequency|duration|medication|onset|intensity",
      "status": "missing|provided|partial",
      "detectedContent": "exact text found (if any)",
      "confidence": 0.95,
      "reasoning": "why this field has this status"
    }
  ],
  "overallCompleteness": 85,
  "criticalMissing": ["field_types_that_are_missing"],
  "suggestions": ["specific suggestions for what to add"],
  "recommendedNextSteps": ["actionable steps for the patient"]
}

Analyze the following patient text:`

// Import types for medical field configurations
import { MedicalFieldType, MedicalFieldConfig } from "@/types/medical-types"

// Configuration for each medical field type
export const MEDICAL_FIELD_CONFIGS: Record<
  MedicalFieldType,
  MedicalFieldConfig
> = {
  symptoms: {
    type: "symptoms",
    label: "Symptoms",
    icon: "🩺",
    description: "What health issues are you experiencing?",
    example: "headache, dizziness, chest pain",
    promptSuggestion: "Describe your specific symptoms or health concerns",
    color: "bg-red-100 text-red-800",
    priority: 1
  },
  frequency: {
    type: "frequency",
    label: "Frequency",
    icon: "📅",
    description: "How often do your symptoms occur?",
    example: "daily, 3 times a week, occasionally",
    promptSuggestion: "How often do you experience these symptoms?",
    color: "bg-blue-100 text-blue-800",
    priority: 2
  },
  duration: {
    type: "duration",
    label: "Duration",
    icon: "⏱️",
    description: "How long have you had these symptoms?",
    example: "for 2 weeks, since last month, started yesterday",
    promptSuggestion: "When did your symptoms start?",
    color: "bg-green-100 text-green-800",
    priority: 3
  },
  medication: {
    type: "medication",
    label: "Medication",
    icon: "💊",
    description: "What medications are you currently taking?",
    example: "Ibuprofen 200mg, no current medications",
    promptSuggestion:
      "List your current medications or mention if you're not taking any",
    color: "bg-purple-100 text-purple-800",
    priority: 4
  },
  onset: {
    type: "onset",
    label: "Onset",
    icon: "⚡",
    description: "What triggered or started your symptoms?",
    example: "after exercise, gradually developed, sudden onset",
    promptSuggestion: "What seemed to trigger or start your symptoms?",
    color: "bg-orange-100 text-orange-800",
    priority: 5
  },
  intensity: {
    type: "intensity",
    label: "Intensity",
    icon: "📊",
    description: "How severe are your symptoms?",
    example: "mild pain, severe, 7/10 intensity",
    promptSuggestion: "How would you rate the severity of your symptoms?",
    color: "bg-yellow-100 text-yellow-800",
    priority: 6
  }
}
