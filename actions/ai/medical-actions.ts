"use server"

/*
<ai_context>
Medical information analysis server actions for the Med Writer application.
Analyzes patient text to determine completeness of medical information for doctor communications.
</ai_context>
*/

import { getOpenAIClient, OPENAI_CONFIG, OpenAIError } from "@/lib/openai"
import { MEDICAL_INFORMATION_PROMPT, MEDICAL_FIELD_CONFIGS } from "@/lib/medical-prompts"
import {
  MedicalCheckRequest,
  MedicalCheckResponse,
  MedicalInformation,
  MedicalField,
  MedicalFieldType,
  MedicalFieldStatus,
  MedicalFieldConfig,
  MedicalActionState
} from "@/types/medical-types"

// Configuration for medical fields is now imported from the medical info sidebar component
// as needed to avoid exporting non-function values from server action files

/**
 * Analyze text for medical information completeness
 */
export async function analyzeMedicalInformationAction(
  request: MedicalCheckRequest
): Promise<MedicalActionState<MedicalCheckResponse>> {
  console.log("🏥 Starting medical information analysis for text:", request.text.length, "characters")
  console.log("🔄 Force recheck:", request.forceRecheck)

  const startTime = Date.now()

  try {
    // Validate input
    if (!request.text.trim()) {
      console.log("❌ Empty text provided for medical analysis")
      return {
        isSuccess: false,
        message: "No text provided for medical information analysis"
      }
    }

    if (request.text.length > 5000) {
      console.log("❌ Text too long for medical analysis:", request.text.length)
      return {
        isSuccess: false,
        message: "Text is too long for medical analysis (max 5,000 characters)"
      }
    }

    console.log("🤖 Calling OpenAI for medical information analysis...")
    
    // Get OpenAI client
    const openai = getOpenAIClient()
    
    // Make API call
    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: "system",
          content: MEDICAL_INFORMATION_PROMPT
        },
        {
          role: "user",
          content: request.text
        }
      ],
      temperature: OPENAI_CONFIG.temperature,
      max_tokens: OPENAI_CONFIG.max_tokens
    })

    console.log("✅ OpenAI medical analysis response received")

    const responseContent = response.choices[0]?.message?.content
    if (!responseContent) {
      console.error("❌ Empty response from OpenAI medical analysis")
      return {
        isSuccess: false,
        message: "No response from medical analysis service"
      }
    }

    console.log("📝 Parsing medical analysis response...")
    let parsedResponse: any

    try {
      parsedResponse = JSON.parse(responseContent)
      console.log("✅ Medical analysis response parsed successfully")
    } catch (parseError) {
      console.error("❌ Failed to parse medical analysis JSON:", parseError)
      console.error("Raw response:", responseContent)
      return {
        isSuccess: false,
        message: "Invalid response format from medical analysis service"
      }
    }

    // Validate and process the response
    const processedAnalysis = await processMedicalAnalysisResponse(parsedResponse, request.text)
    const processingTime = Date.now() - startTime

    console.log(`✅ Medical analysis complete: ${processedAnalysis.overallCompleteness}% complete in ${processingTime}ms`)
    console.log(`📊 Critical missing fields: ${processedAnalysis.criticalMissing.length}`)

    const response_data: MedicalCheckResponse = {
      analysis: processedAnalysis,
      processedText: request.text,
      processingTime,
      confidence: calculateOverallConfidence(processedAnalysis.fieldsAnalyzed),
      suggestions: processedAnalysis.recommendedNextSteps
    }

    return {
      isSuccess: true,
      message: `Medical information analysis completed - ${processedAnalysis.overallCompleteness}% complete`,
      data: response_data
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("❌ Medical information analysis failed:", error)
    
    if (error instanceof OpenAIError) {
      return {
        isSuccess: false,
        message: `Medical analysis service error: ${error.message}`
      }
    }

    return {
      isSuccess: false,
      message: "Medical information analysis service temporarily unavailable"
    }
  }
}

/**
 * Process and validate the medical analysis response from OpenAI
 */
async function processMedicalAnalysisResponse(
  rawResponse: any,
  originalText: string
): Promise<MedicalInformation> {
  console.log("🔄 Processing medical analysis response...")

  // Validate response structure
  if (!rawResponse.fields || !Array.isArray(rawResponse.fields)) {
    console.warn("⚠️ Invalid fields array in response, creating default analysis")
    return createDefaultMedicalAnalysis(originalText)
  }

  // Process each field
  const fieldsAnalyzed: MedicalField[] = []
  const allFieldTypes: MedicalFieldType[] = ["symptoms", "frequency", "duration", "medication", "onset", "intensity"]

  for (const fieldType of allFieldTypes) {
    const fieldData = rawResponse.fields.find((f: any) => f.type === fieldType)
    const config = MEDICAL_FIELD_CONFIGS[fieldType]

    if (fieldData) {
      // Process detected field
      const processedField: MedicalField = {
        type: fieldType,
        status: validateFieldStatus(fieldData.status),
        description: config.description,
        importance: getFieldImportance(fieldType),
        suggestion: fieldData.reasoning || config.promptSuggestion,
        detectedContent: fieldData.detectedContent || undefined,
        confidence: validateConfidence(fieldData.confidence)
      }
      fieldsAnalyzed.push(processedField)
      console.log(`✅ Processed ${fieldType}: ${processedField.status} (confidence: ${processedField.confidence})`)
    } else {
      // Field not detected - mark as missing
      const missingField: MedicalField = {
        type: fieldType,
        status: "missing",
        description: config.description,
        importance: getFieldImportance(fieldType),
        suggestion: config.promptSuggestion,
        confidence: 1.0 // High confidence that it's missing
      }
      fieldsAnalyzed.push(missingField)
      console.log(`❌ Field ${fieldType} not detected - marked as missing`)
    }
  }

  // Calculate completeness
  const providedFields = fieldsAnalyzed.filter(f => f.status === "provided").length
  const partialFields = fieldsAnalyzed.filter(f => f.status === "partial").length
  const overallCompleteness = Math.round(((providedFields + (partialFields * 0.5)) / allFieldTypes.length) * 100)

  // Identify critical missing fields
  const criticalMissing = fieldsAnalyzed
    .filter(f => f.status === "missing" && f.importance === "critical")
    .map(f => f.type)

  // Generate analysis ID
  const analysisId = `medical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const analysis: MedicalInformation = {
    id: analysisId,
    overallCompleteness,
    fieldsAnalyzed,
    recommendedNextSteps: rawResponse.suggestions || generateDefaultSuggestions(fieldsAnalyzed),
    criticalMissing,
    lastAnalyzed: new Date(),
    textLength: originalText.length
  }

  console.log(`📊 Medical analysis processed: ${overallCompleteness}% complete, ${criticalMissing.length} critical missing`)
  return analysis
}

/**
 * Create default medical analysis when AI response is invalid
 */
function createDefaultMedicalAnalysis(text: string): MedicalInformation {
  console.log("🔄 Creating default medical analysis")
  
  const fieldsAnalyzed: MedicalField[] = Object.entries(MEDICAL_FIELD_CONFIGS).map(([type, config]) => ({
    type: type as MedicalFieldType,
    status: "missing" as MedicalFieldStatus,
    description: config.description,
    importance: getFieldImportance(type as MedicalFieldType),
    suggestion: config.promptSuggestion,
    confidence: 0.5
  }))

  return {
    id: `medical_default_${Date.now()}`,
    overallCompleteness: 0,
    fieldsAnalyzed,
    recommendedNextSteps: [
      "Please provide more specific details about your symptoms",
      "Include information about when your symptoms started",
      "Mention any medications you're currently taking"
    ],
    criticalMissing: ["symptoms", "duration", "medication"],
    lastAnalyzed: new Date(),
    textLength: text.length
  }
}

/**
 * Validate field status from AI response
 */
function validateFieldStatus(status: any): MedicalFieldStatus {
  const validStatuses: MedicalFieldStatus[] = ["missing", "provided", "partial"]
  if (validStatuses.includes(status)) {
    return status
  }
  console.warn(`⚠️ Invalid field status: ${status}, defaulting to missing`)
  return "missing"
}

/**
 * Validate confidence score from AI response
 */
function validateConfidence(confidence: any): number {
  if (typeof confidence === "number" && confidence >= 0 && confidence <= 1) {
    return confidence
  }
  console.warn(`⚠️ Invalid confidence score: ${confidence}, defaulting to 0.5`)
  return 0.5
}

/**
 * Get field importance level
 */
function getFieldImportance(fieldType: MedicalFieldType): "critical" | "important" | "helpful" {
  switch (fieldType) {
    case "symptoms":
    case "duration":
    case "medication":
      return "critical"
    case "frequency":
    case "onset":
      return "important"
    case "intensity":
      return "helpful"
    default:
      return "important"
  }
}

/**
 * Calculate overall confidence from field confidences
 */
function calculateOverallConfidence(fields: MedicalField[]): number {
  if (fields.length === 0) return 0
  
  const totalConfidence = fields.reduce((sum, field) => sum + (field.confidence || 0.5), 0)
  return Math.round((totalConfidence / fields.length) * 100) / 100
}

/**
 * Generate default suggestions when AI doesn't provide them
 */
function generateDefaultSuggestions(fields: MedicalField[]): string[] {
  const missingFields = fields.filter(f => f.status === "missing")
  const suggestions: string[] = []

  if (missingFields.length > 0) {
    suggestions.push("Consider adding more details about your health concerns")
    
    if (missingFields.some(f => f.type === "symptoms")) {
      suggestions.push("Describe your specific symptoms or health issues")
    }
    
    if (missingFields.some(f => f.type === "duration")) {
      suggestions.push("Mention when your symptoms started")
    }
    
    if (missingFields.some(f => f.type === "medication")) {
      suggestions.push("List current medications or mention if you're not taking any")
    }
  }

  return suggestions.length > 0 ? suggestions : ["Your message contains good medical information"]
}

/**
 * Get medical information analysis status
 */
export async function getMedicalAnalysisStatusAction(): Promise<MedicalActionState<{
  isProcessing: boolean
  lastAnalysis: Date | null
  fieldsAnalyzed: number
}>> {
  console.log("📊 Medical analysis status requested")
  
  return {
    isSuccess: true,
    message: "Status retrieved",
    data: {
      isProcessing: false,
      lastAnalysis: null,
      fieldsAnalyzed: 0
    }
  }
} 