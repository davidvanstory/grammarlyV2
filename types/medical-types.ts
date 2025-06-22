/*
<ai_context>
Medical information tracking types for the Med Writer application.
Defines types for tracking completeness of patient medical information in communications to doctors.
SIMPLIFIED VERSION - removed confidence scores, importance levels, and complex validation for better performance.
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

// Simplified individual medical field tracking - just present or not
export interface MedicalField {
  type: MedicalFieldType
  isPresent: boolean // Simplified: just true/false instead of missing/provided/partial
  description: string
  suggestion: string
  detectedContent?: string // What was found in the text if present
}

// Simplified medical information analysis
export interface MedicalInformation {
  id: string
  overallCompleteness: number // 0-100 percentage based on fields present
  fieldsAnalyzed: MedicalField[]
  recommendedNextSteps: string[]
  missingFields: MedicalFieldType[] // Simplified: just missing field types
  lastAnalyzed: Date
  textLength: number
}

// Medical information check request
export interface MedicalCheckRequest {
  text: string
  previousAnalysis?: MedicalInformation
  forceRecheck?: boolean
}

// Simplified medical information check response
export interface MedicalCheckResponse {
  analysis: MedicalInformation
  processedText: string
  processingTime: number
}

// Medical information tracking state
export interface MedicalTrackingState {
  currentAnalysis: MedicalInformation | null
  isAnalyzing: boolean
  lastCheck: Date | null
  error: string | null
  hasUnsavedChanges: boolean
}

// Medical field configuration for UI display (kept for UI consistency)
export interface MedicalFieldConfig {
  type: MedicalFieldType
  label: string
  icon: string
  description: string
  example: string
  suggestion: string // Static suggestion instead of dynamic generation
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

// Cache entry for medical analysis (for new caching system)
export interface MedicalCacheEntry {
  textHash: string
  originalText: string
  result: MedicalCheckResponse
  timestamp: Date
  lastAccessed: Date
  hitCount: number
  textLength: number
}

// Export all types for easy importing
export type MedicalActionState<T> = ActionState<T>
