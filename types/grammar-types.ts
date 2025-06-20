/*
<ai_context>
Grammar checking and error types for the Med Writer application.
Defines types for error highlighting, position tracking, and grammar suggestions.
</ai_context>
*/

// Error types for grammar checking
export type ErrorType = "spelling" | "grammar" | "style"

// Position information for text errors
export interface TextPosition {
  start: number
  end: number
  line?: number
  column?: number
}

// Grammar error from AI analysis
export interface GrammarError {
  id: string
  type: ErrorType
  start: number
  end: number
  original: string
  suggestions: string[]
  explanation: string
  medical_context?: string
  confidence?: number
}

// Error state for tracking corrections
export type ErrorStatus = "pending" | "applied" | "dismissed" | "ignored"

// Enhanced error with state tracking
export interface TrackedError extends GrammarError {
  status: ErrorStatus
  originalPosition: TextPosition
  currentPosition: TextPosition
  appliedAt?: Date
  dismissedAt?: Date
}

// Position mapping for DOM to text conversion
export interface PositionMapping {
  domOffset: number
  textOffset: number
  nodeIndex: number
  nodeType: "text" | "element"
}

// Text change detection
export interface TextChange {
  type: "insert" | "delete" | "replace"
  start: number
  end: number
  oldText: string
  newText: string
  timestamp: Date
}

// Cursor position information
export interface CursorPosition {
  offset: number
  node: Node | null
  nodeOffset: number
  isAtEnd: boolean
}

// Error highlighting configuration
export interface HighlightConfig {
  errorType: ErrorType
  className: string
  color: string
  underlineStyle: "solid" | "wavy" | "dotted"
}

// Text processing result
export interface TextProcessingResult {
  plainText: string
  positionMap: PositionMapping[]
  wordCount: number
  characterCount: number
  hasChanges: boolean
}

// Grammar check request
export interface GrammarCheckRequest {
  text: string
  previousErrors?: TrackedError[]
  forceRecheck?: boolean
  medicalContext?: boolean
}

// Grammar check response
export interface GrammarCheckResponse {
  errors: GrammarError[]
  processedText: string
  processingTime: number
  confidence: number
  medicalTermsFound: string[]
}

// Position calculation result
export interface PositionCalculation {
  newPositions: TextPosition[]
  adjustedErrors: TrackedError[]
  invalidatedErrors: string[]
  recalculationNeeded: boolean
}

// Text editor state for position tracking
export interface EditorState {
  content: string
  cursorPosition: CursorPosition
  errors: TrackedError[]
  lastCheck: Date | null
  isProcessing: boolean
  hasUnsavedChanges: boolean
}

// Error highlighting span attributes
export interface ErrorSpanAttributes {
  "data-error-id": string
  "data-error-type": ErrorType
  "data-error-start": string
  "data-error-end": string
  className: string
  title?: string
}

// Position validation result
export interface PositionValidation {
  isValid: boolean
  actualText: string
  expectedText: string
  adjustedPosition?: TextPosition
  error?: string
}

// Medical terminology context
export interface MedicalContext {
  termsFound: string[]
  abbreviationsUsed: string[]
  specialTerms: string[]
  confidence: number
}

// Undo/redo state for text changes
export interface UndoRedoState {
  content: string
  cursorPosition: CursorPosition
  errors: TrackedError[]
  timestamp: Date
}

// Performance metrics for position tracking
export interface PerformanceMetrics {
  positionCalculationTime: number
  textProcessingTime: number
  errorHighlightingTime: number
  totalOperationTime: number
  errorsProcessed: number
  textLength: number
}
