/*
<ai_context>
Contains document-related TypeScript interfaces and types for the Med Writer application.
</ai_context>
*/

import { SelectDocument, InsertDocument } from "@/db/schema/documents-schema"

// Re-export database types for convenience
export type { SelectDocument, InsertDocument }

// Document creation interface for forms
export interface CreateDocumentData {
  title: string
  content?: string
}

// Document update interface for forms
export interface UpdateDocumentData {
  title?: string
  content?: string
}

// Document with metadata for UI display
export interface DocumentWithMetadata extends SelectDocument {
  wordCount: number
  lastModified: string
  isNew?: boolean
}

// Document list item for sidebar display
export interface DocumentListItem {
  id: string
  title: string
  updatedAt: Date
  wordCount: number
  preview: string // First 100 characters of content
}

// Document editor state
export interface DocumentEditorState {
  document: SelectDocument | null
  isLoading: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  lastSaved: Date | null
  error: string | null
}

// Auto-save configuration
export interface AutoSaveConfig {
  enabled: boolean
  intervalMs: number
  debounceMs: number
}

// Document validation result
export interface DocumentValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Medical document specific types
export interface MedicalDocumentMetadata {
  patientReferences: string[]
  medicalTermsCount: number
  readabilityScore: number
  estimatedReadingTime: number
}

// Document search/filter options
export interface DocumentSearchOptions {
  query?: string
  sortBy: "title" | "createdAt" | "updatedAt"
  sortOrder: "asc" | "desc"
  limit?: number
  offset?: number
}
