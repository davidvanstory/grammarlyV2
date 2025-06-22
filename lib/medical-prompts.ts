/*
<ai_context>
Medical analysis prompts and configurations for the Med Writer application.
Defines the AI prompts and field configurations for analyzing patient medical information completeness.
SIMPLIFIED VERSION - removed complex analysis, confidence scores, and importance levels for better performance.
</ai_context>
*/

// Simplified medical information analysis prompt for OpenAI - much faster processing
export const MEDICAL_INFORMATION_PROMPT = `You are a medical communication expert that analyzes patient messages to doctors with strict criteria.

Your task is to determine if each medical information category meets SPECIFIC REQUIREMENTS in the text.

CRITICAL REQUIREMENTS:
1. Return only TRUE or FALSE for each category based on STRICT CRITERIA below
2. Return response in strict JSON format - NO markdown code blocks, NO backticks, just pure JSON
3. Be very discerning - only return TRUE if the specific criteria are met
4. The examples below are ILLUSTRATIVE - apply the underlying concepts flexibly, not exact word matching

STRICT MEDICAL INFORMATION CRITERIA:

1. SYMPTOMS: Must mention a SPECIFIC BODY PART or ORGAN (not vague general complaints)
   - CONCEPT: Anatomically specific location or organ system
   - Examples of TRUE: "headache", "chest pain", "stomach ache", "back pain", "leg cramps", "knee hurts", "shoulder discomfort", "throat soreness"
   - Examples of FALSE: "feeling unwell", "pain", "discomfort", "not feeling good", "sick"

2. DURATION: Must include a SPECIFIC TIME WINDOW or TIME REFERENCE (not vague temporal references)
   - CONCEPT: Quantifiable time period or specific temporal anchor
   - Examples of TRUE: "2 hours", "20 minutes", "several days", "3 weeks", "started yesterday", "for the past month", "since Tuesday", "all week"
   - Examples of FALSE: "recently", "lately", "for a while", "ongoing", "chronic", "sometimes"

3. MEDICATION: Must mention a SPECIFIC MEDICATION NAME or brand (not generic drug categories)
   - CONCEPT: Identifiable pharmaceutical product by name or brand
   - Examples of TRUE: "Ibuprofen", "Tylenol", "Advil", "Lisinopril", "Metformin", "aspirin", "Benadryl"
   - Examples of FALSE: "pain medication", "pills", "medicine", "treatment", "drugs", "antibiotics"

4. ONSET: Must include an EXPLICIT STATEMENT of when symptoms began with time reference (not vague beginnings)
   - CONCEPT: Specific temporal marker for symptom initiation
   - Examples of TRUE: "started yesterday", "began 3 days ago", "woke up with", "after dinner last night", "this morning", "when I stood up"
   - Examples of FALSE: "gradual onset", "slowly developed", "came on", "appeared", "progressive"

5. INTENSITY: Must include a SPECIFIC FEELING, SEVERITY RATING, or INTENSITY DESCRIPTOR (not vague qualifiers)
   - CONCEPT: Quantifiable or descriptive severity measurement
   - Examples of TRUE: "severe", "mild", "throbbing", "sharp", "7/10", "excruciating", "dull ache", "stabbing", "burning"
   - Examples of FALSE: "bad", "uncomfortable", "bothersome", "noticeable", "troubling"

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
    description: "What specific body part or organ is affected?",
    example: "headache, chest pain, stomach ache, back pain",
    suggestion: "Mention the specific body part or organ that's bothering you",
    color: "bg-red-100 text-red-800",
    priority: 1
  },

  duration: {
    type: "duration",
    label: "Duration",
    icon: "⏱️",
    description: "How long have you had these symptoms? (specific time)",
    example: "2 hours, 20 minutes, several days, 3 weeks, started yesterday",
    suggestion:
      "Include a specific time window like hours, days, weeks, or when it started",
    color: "bg-green-100 text-green-800",
    priority: 2
  },
  medication: {
    type: "medication",
    label: "Medication",
    icon: "💊",
    description: "What specific medications are you taking?",
    example: "Ibuprofen 200mg, Tylenol, Advil, Lisinopril",
    suggestion:
      "List specific medication names or brands (not just 'pain medication')",
    color: "bg-purple-100 text-purple-800",
    priority: 3
  },
  onset: {
    type: "onset",
    label: "Onset",
    icon: "⚡",
    description: "When exactly did your symptoms begin?",
    example: "started yesterday, began 3 days ago, this morning, after dinner",
    suggestion:
      "State exactly when your symptoms started with a time reference",
    color: "bg-orange-100 text-orange-800",
    priority: 4
  },
  intensity: {
    type: "intensity",
    label: "Intensity",
    icon: "🌡️",
    description: "How would you describe the severity or feeling?",
    example: "severe, mild, throbbing, sharp, 7/10 pain, excruciating",
    suggestion:
      "Use specific descriptors like severity ratings or feeling words",
    color: "bg-yellow-100 text-yellow-800",
    priority: 5
  }
}

// Static default suggestions - no need to generate dynamically
export const STATIC_MEDICAL_SUGGESTIONS = [
  "Include specific body parts or organs affected (not just 'pain' or 'discomfort')",
  "Add a specific time window like hours, days, or weeks (not just 'recently')",
  "List actual medication names or brands (not just 'pain medication' or 'pills')",
  "State exactly when symptoms started with a time reference (like 'yesterday' or '3 days ago')",
  "Use specific intensity descriptors like severity ratings or feeling words (not just 'bad')"
]
