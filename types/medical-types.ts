/*
<ai_context>
Medical information tracking types for the Med Writer application.
Defines types for tracking completeness of patient medical information in communications to doctors.
</ai_context>
*/

import { ActionState } from "@/types/server-action-types"

// Medical information field types that patients should provide when writing to doctors
export type MedicalFieldType =
  | "symptoms"
  | "frequency"
  | "duration"
  | "medication"
  | "onset"
  | "intensity"

// Status of each medical information field
export type MedicalFieldStatus = "missing" | "provided" | "partial"

// Individual medical field tracking
export interface MedicalField {
  type: MedicalFieldType
  status: MedicalFieldStatus
  description: string
  importance: "critical" | "important" | "helpful"
  suggestion: string
  detectedContent?: string // What was found in the text
  confidence?: number // AI confidence in detection (0-1)
}

// Complete medical information analysis
export interface MedicalInformation {
  id: string
  overallCompleteness: number // 0-100 percentage
  fieldsAnalyzed: MedicalField[]
  recommendedNextSteps: string[]
  criticalMissing: MedicalFieldType[]
  lastAnalyzed: Date
  textLength: number
}

// Medical information check request
export interface MedicalCheckRequest {
  text: string
  previousAnalysis?: MedicalInformation
  forceRecheck?: boolean
}

// Medical information check response
export interface MedicalCheckResponse {
  analysis: MedicalInformation
  processedText: string
  processingTime: number
  confidence: number
  suggestions: string[]
}

// Medical information tracking state
export interface MedicalTrackingState {
  currentAnalysis: MedicalInformation | null
  isAnalyzing: boolean
  lastCheck: Date | null
  error: string | null
  hasUnsavedChanges: boolean
}

// Medical field configuration for UI display
export interface MedicalFieldConfig {
  type: MedicalFieldType
  label: string
  icon: string
  description: string
  example: string
  promptSuggestion: string
  color: string
  priority: number
}

// Medical information sidebar props
export interface MedicalInfoSidebarProps {
  analysis: MedicalInformation | null
  isAnalyzing?: boolean
  onFieldClick?: (field: MedicalField) => void
  onRefresh?: () => void
}

// Performance metrics for medical analysis
export interface MedicalAnalysisMetrics {
  analysisTime: number
  textProcessingTime: number
  fieldDetectionTime: number
  totalOperationTime: number
  fieldsAnalyzed: number
  textLength: number
}

// Medical field validation result
export interface MedicalFieldValidation {
  isValid: boolean
  field: MedicalFieldType
  confidence: number
  detectedContent: string
  reasoning: string
}

// Export all types for easy importing
export type MedicalActionState<T> = ActionState<T>
