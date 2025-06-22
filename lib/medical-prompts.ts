/*
<ai_context>
Medical analysis prompts and configurations for the Med Writer application.
Defines the AI prompts and field configurations for analyzing patient medical information completeness.
SIMPLIFIED VERSION - removed complex analysis, confidence scores, and importance levels for better performance.
</ai_context>
*/

// Simplified medical information analysis prompt for OpenAI - much faster processing
export const MEDICAL_INFORMATION_PROMPT = `You are a medical communication expert that quickly analyzes patient messages to doctors.

Your task is to determine if each medical information category is mentioned in the text.

CRITICAL REQUIREMENTS:
1. Return only TRUE or FALSE for each category
2. Return response in strict JSON format - NO markdown code blocks, NO backticks, just pure JSON
3. Process quickly - no complex reasoning needed

MEDICAL INFORMATION CATEGORIES TO CHECK:

1. SYMPTOMS: Are specific symptoms mentioned? (not just "feeling bad")
2. DURATION: Is how long symptoms have been present mentioned?
3. MEDICATION: Are current medications or treatments mentioned?
4. ONSET: Is when/how symptoms started mentioned?
5. INTENSITY: Is symptom severity/intensity mentioned?

SIMPLIFIED RESPONSE FORMAT (strict JSON only):
{
  "fields": {
    "symptoms": true/false,
    "duration": true/false,
    "medication": true/false,
    "onset": true/false,
    "intensity": true/false
  },
  "overallCompleteness": 80
}

Analyze the following patient text:

`

// Import types for medical field configurations
import { MedicalFieldType, MedicalFieldConfig } from "@/types/medical-types"

// Static configuration for each medical field type - no dynamic generation needed
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
    suggestion: "Describe your specific symptoms or health concerns in detail",
    color: "bg-red-100 text-red-800",
    priority: 1
  },

  duration: {
    type: "duration",
    label: "Duration",
    icon: "⏱️",
    description: "How long have you had these symptoms?",
    example: "for 2 weeks, since last month, started yesterday",
    suggestion:
      "Include when your symptoms started or how long you've had them",
    color: "bg-green-100 text-green-800",
    priority: 2
  },
  medication: {
    type: "medication",
    label: "Medication",
    icon: "💊",
    description: "What medications are you currently taking?",
    example: "Ibuprofen 200mg, no current medications",
    suggestion:
      "List your current medications or mention if you're not taking any",
    color: "bg-purple-100 text-purple-800",
    priority: 3
  },
  onset: {
    type: "onset",
    label: "Onset",
    icon: "⚡",
    description: "What triggered or started your symptoms?",
    example: "after exercise, gradually developed, sudden onset",
    suggestion: "Describe what seemed to trigger or start your symptoms",
    color: "bg-orange-100 text-orange-800",
    priority: 4
  },
  intensity: {
    type: "intensity",
    label: "Intensity",
    icon: "🌡️",
    description: "How severe are your symptoms?",
    example: "mild, severe, 7/10 pain",
    suggestion: "Rate or describe the severity of your symptoms",
    color: "bg-yellow-100 text-yellow-800",
    priority: 5
  }
}

// Static default suggestions - no need to generate dynamically
export const STATIC_MEDICAL_SUGGESTIONS = [
  "Consider adding more specific details about your symptoms",
  "Include when your symptoms started and how long you've had them",
  "Mention any medications you're currently taking or that you're not taking any",
  "Include what may have triggered your symptoms",
  "Rate the severity or intensity of your symptoms"
]
