"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Save,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  FileText,
  Stethoscope
} from "lucide-react"
import { SelectDocument } from "@/db/schema/documents-schema"
import { updateDocumentAction } from "@/actions/db/documents-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

// Phase 4 imports - Position tracking and text processing
import { createPositionTracker, PositionTracker } from "@/lib/position-tracker"
import { processContentEditable, getTextProcessor } from "@/lib/text-processor"
import { useCursorPosition } from "@/hooks/use-cursor-position"
import { useTextChange } from "@/hooks/use-text-change"
import ErrorHighlight from "@/components/editor/error-highlight"
import {
  TrackedError,
  TextChange,
  CursorPosition,
  EditorState,
  TextProcessingResult,
  GrammarCheckRequest,
  GrammarCheckResponse
} from "@/types/grammar-types"
// Phase 5 imports - Grammar checking integration
import { convertToTrackedErrors } from "@/lib/error-parser"

// Medical summary imports - "Summarize for Dr." feature
import {
  MedicalSummaryRequest,
  MedicalSummaryResponse,
  MedicalSummaryState
} from "@/types/medical-types"

/*
<ai_context>
Content-editable editor component for the Med Writer application.
Implements rich text editing with auto-save, title editing, and medical writing optimizations.
</ai_context>
*/

interface ContentEditableEditorProps {
  document: SelectDocument | null
  onDocumentUpdate: (document: SelectDocument) => void
  onGrammarCheck?: (errors: TrackedError[]) => void
  onMedicalAnalysis?: (text: string, forceRecheck?: boolean) => void
  medicalAnalysis?: any // Pass existing medical analysis data for summary generation
}

// Auto-save configuration
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds
const DEBOUNCE_DELAY = 1000 // 1 second debounce for typing
const GRAMMAR_CHECK_DEBOUNCE = 500 // 500ms for grammar checking (reduced from 2000ms)
const SENTENCE_END_IMMEDIATE_CHECK = 100 // 100ms delay after sentence completion

export default function ContentEditableEditor({
  document,
  onDocumentUpdate,
  onGrammarCheck,
  onMedicalAnalysis,
  medicalAnalysis
}: ContentEditableEditorProps) {
  console.log(
    "📝 Rendering content editor for document:",
    document?.title || "None"
  )

  // Editor state
  const [content, setContent] = useState(document?.content || "")
  const [title, setTitle] = useState(document?.title || "")
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Phase 4 state - Position tracking and error management
  const [errors, setErrors] = useState<TrackedError[]>([])
  const [isProcessingText, setIsProcessingText] = useState(false)
  const [textProcessingResult, setTextProcessingResult] =
    useState<TextProcessingResult | null>(null)
  const [editorState, setEditorState] = useState<EditorState>({
    content: "",
    cursorPosition: { offset: 0, node: null, nodeOffset: 0, isAtEnd: false },
    errors: [],
    lastCheck: null,
    isProcessing: false,
    hasUnsavedChanges: false
  })

  // Phase 5 state - Grammar checking
  const [isGrammarChecking, setIsGrammarChecking] = useState(false)
  const [lastGrammarCheck, setLastGrammarCheck] = useState<Date | null>(null)
  const [grammarCheckError, setGrammarCheckError] = useState<string | null>(
    null
  )

  // Medical Summary state - "Summarize for Dr." feature
  const [medicalSummary, setMedicalSummary] = useState<string | null>(
    document?.medicalSummary || null
  )
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [lastSummaryGenerated, setLastSummaryGenerated] = useState<Date | null>(
    null
  )
  const [hasCopiedSummary, setHasCopiedSummary] = useState(false)

  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const positionTrackerRef = useRef<PositionTracker | null>(null)
  const grammarCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const grammarCheckAbortControllerRef = useRef<AbortController | null>(null)

  // Phase 4 hooks - Position tracking and text change detection
  const cursorPosition = useCursorPosition(
    editorRef as React.RefObject<HTMLElement>
  )

  // Phase 4 helper functions
  const updateEditorState = useCallback(
    (newContent: string) => {
      console.log(
        "🔄 Updating editor state with new content:",
        newContent.length,
        "chars"
      )
      const currentCursor = cursorPosition?.getCurrentPosition() || {
        offset: 0,
        node: null,
        nodeOffset: 0,
        isAtEnd: false
      }

      setEditorState(prev => ({
        ...prev,
        content: newContent,
        cursorPosition: currentCursor,
        hasUnsavedChanges: newContent !== (document?.content || ""),
        isProcessing: isProcessingText || isGrammarChecking
      }))
    },
    [document?.content, isProcessingText, isGrammarChecking]
  )

  // Phase 5 - Grammar checking function
  const performGrammarCheck = useCallback(
    async (text: string, forceRecheck: boolean = false) => {
      console.log("🤖 Starting grammar check...")
      console.log("📝 Text length:", text.length)
      console.log("🔄 Force recheck:", forceRecheck)

      // Skip if text is too short or too long
      if (text.trim().length < 10) {
        console.log("⚠️ Text too short for grammar check")
        return
      }

      if (text.length > 10000) {
        console.log("⚠️ Text too long for grammar check")
        return
      }

      // Cancel any existing grammar check
      if (grammarCheckAbortControllerRef.current) {
        console.log("🛑 Cancelling previous grammar check")
        grammarCheckAbortControllerRef.current.abort()
      }

      // Create new abort controller
      const abortController = new AbortController()
      grammarCheckAbortControllerRef.current = abortController

      setIsGrammarChecking(true)
      setGrammarCheckError(null)

      try {
        const request: GrammarCheckRequest = {
          text,
          previousErrors: errors,
          forceRecheck
        }

        console.log("🌐 Calling grammar check API...")
        const response = await fetch("/api/grammar-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(request),
          signal: abortController.signal
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Grammar check failed")
        }

        const result = await response.json()
        console.log("✅ Grammar check API response received")
        console.log("📊 Found", result.data.errors.length, "errors")

        if (result.success && result.data) {
          const grammarResponse = result.data as GrammarCheckResponse

          // Convert to tracked errors
          const trackedErrors = convertToTrackedErrors(grammarResponse.errors)

          console.log("🔄 Converting to tracked errors:", trackedErrors.length)

          // Update errors state
          setErrors(trackedErrors)
          setLastGrammarCheck(new Date())

          // Notify parent component
          if (onGrammarCheck) {
            onGrammarCheck(trackedErrors)
          }

          console.log("✅ Grammar check completed successfully")
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("🛑 Grammar check aborted")
          return
        }

        console.error("❌ Grammar check failed:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Grammar check failed"
        setGrammarCheckError(errorMessage)
        toast.error(`Grammar check failed: ${errorMessage}`)
      } finally {
        setIsGrammarChecking(false)
        grammarCheckAbortControllerRef.current = null
      }
    },
    [errors, onGrammarCheck]
  )

  // Phase 5 - Smart debounced grammar checking
  const smartGrammarCheck = useCallback(
    (text: string, isImmediate: boolean = false) => {
      console.log(
        `⏰ Scheduling ${isImmediate ? "immediate" : "debounced"} grammar check...`
      )

      // Clear existing timeout
      if (grammarCheckTimeoutRef.current) {
        clearTimeout(grammarCheckTimeoutRef.current)
      }

      // Check if text ends with complete sentence for immediate processing
      const textProcessor = getTextProcessor()
      const endsWithSentence = textProcessor.endsWithCompleteSentence(text)

      // Determine delay based on context
      let delay = GRAMMAR_CHECK_DEBOUNCE

      if (isImmediate || endsWithSentence) {
        delay = SENTENCE_END_IMMEDIATE_CHECK
        console.log("⚡ Using immediate check - sentence completed or forced")
      }

      // Schedule grammar check with smart timing
      grammarCheckTimeoutRef.current = setTimeout(() => {
        console.log(
          `🚀 Executing ${isImmediate || endsWithSentence ? "immediate" : "debounced"} grammar check`
        )
        performGrammarCheck(text)
      }, delay)
    },
    [performGrammarCheck]
  )

  const handleTextChangeWithPositionTracking = useCallback(
    (change: TextChange, newText: string, cursor: CursorPosition) => {
      console.log("📝 Text change with position tracking:", change.type)

      // Update content state
      setContent(newText)
      setHasUnsavedChanges(true)

      // Update editor state
      updateEditorState(newText)

      // Process text for position mapping
      if (editorRef.current) {
        setIsProcessingText(true)
        try {
          const processor = getTextProcessor()
          const result = processor.htmlToPlainText(editorRef.current)
          setTextProcessingResult(result)
          console.log(
            "📝 Text processing complete:",
            result.plainText.length,
            "chars"
          )
        } catch (error) {
          console.error("❌ Error processing text:", error)
        } finally {
          setIsProcessingText(false)
        }
      }

      // Phase 5 - Trigger smart grammar check
      if (newText.trim().length > 10) {
        console.log("🤖 Scheduling grammar check for text change")
        smartGrammarCheck(newText)
      }

      // Medical Analysis - Trigger medical information analysis (modular feature)
      if (onMedicalAnalysis && newText.trim().length > 10) {
        console.log("🏥 Triggering medical analysis for text change")
        onMedicalAnalysis(newText)
      }

      // Note: Save will be triggered by the existing auto-save mechanism
    },
    [updateEditorState, smartGrammarCheck]
  )

  const handleSubstantialTextChange = useCallback(
    (newText: string) => {
      console.log(
        "📢 Substantial text change detected:",
        newText.length,
        "chars"
      )

      // Clear existing errors on substantial changes
      setErrors([])

      // Update position tracker
      if (editorRef.current && positionTrackerRef.current) {
        positionTrackerRef.current.updatePositionMap()
      }

      // Phase 5 - Force grammar check on substantial changes
      if (newText.trim().length > 10) {
        console.log("🤖 Forcing grammar check for substantial change")
        performGrammarCheck(newText, true)
      }

      // Medical Analysis - Force medical analysis on substantial changes (modular feature)
      if (onMedicalAnalysis && newText.trim().length > 10) {
        console.log("🏥 Forcing medical analysis for substantial change")
        onMedicalAnalysis(newText, true)
      }
    },
    [performGrammarCheck, onMedicalAnalysis]
  )

  // Handle sentence completion for immediate grammar checking
  const handleSentenceComplete = useCallback(
    (newText: string) => {
      console.log("📝 Sentence completed - triggering immediate grammar check")
      if (newText.trim().length > 10) {
        smartGrammarCheck(newText, true) // Force immediate check
      }
    },
    [smartGrammarCheck]
  )

  // Phase 4 hooks - Position tracking and text change detection with smart debouncing
  const textChangeHook = useTextChange(
    editorRef as React.RefObject<HTMLElement>,
    {
      debounceMs: 300,
      onTextChange: handleTextChangeWithPositionTracking,
      onSubstantialChange: handleSubstantialTextChange,
      onSentenceComplete: handleSentenceComplete,
      substantialChangeThreshold: 50,
      enableSmartDebouncing: true
    }
  )

  // Update local state when document prop changes
  useEffect(() => {
    if (document) {
      console.log("📝 Updating editor content for document:", document.title)
      console.log(
        "🏥 Medical summary:",
        document.medicalSummary ? "present" : "not present"
      )
      setContent(document.content)
      setTitle(document.title)
      setMedicalSummary(document.medicalSummary || null)
      setHasUnsavedChanges(false)
      setSaveError(null)
      setLastSaved(new Date(document.updatedAt))

      // Reset Phase 4 state for new document
      setErrors([])
      setIsProcessingText(false)
      setTextProcessingResult(null)
      updateEditorState(document.content)

      // Reset medical summary state for new document
      setIsGeneratingSummary(false)
      setSummaryError(null)
      setLastSummaryGenerated(null)
      setHasCopiedSummary(false)

      // NEW: Trigger grammar check for newly loaded document
      if (document.content.trim().length > 10) {
        console.log("🤖 Triggering initial grammar check for new document")
        // Use setTimeout to allow UI to update first
        setTimeout(() => {
          performGrammarCheck(document.content, true)
        }, 1000) // 1 second delay to allow content to load
      }

      // Medical Analysis - Trigger initial medical analysis for newly loaded document (modular feature)
      if (onMedicalAnalysis && document.content.trim().length > 10) {
        console.log("🏥 Triggering initial medical analysis for new document")
        setTimeout(() => {
          onMedicalAnalysis(document.content, true)
        }, 1500) // 1.5 second delay to avoid conflicts with grammar check
      }
    } else {
      console.log("📝 No document selected, clearing editor")
      setContent("")
      setTitle("")
      setHasUnsavedChanges(false)
      setSaveError(null)
      setLastSaved(null)

      // Clear Phase 4 state
      setErrors([])
      setIsProcessingText(false)
      setTextProcessingResult(null)
      updateEditorState("")
    }
  }, [document])

  // Initialize position tracker when editor ref is available
  useEffect(() => {
    if (editorRef.current && !positionTrackerRef.current) {
      console.log("🎯 Initializing position tracker...")
      positionTrackerRef.current = createPositionTracker(editorRef.current)
    }
  }, [editorRef.current])

  // Handle error interactions
  const handleErrorClick = useCallback((error: TrackedError) => {
    console.log("🖱️ Error clicked:", error.id, error.type)
    // TODO: Show error correction interface in Phase 6
  }, [])

  const handleErrorHover = useCallback((error: TrackedError | null) => {
    console.log("🖱️ Error hover:", error?.id || "none")
    // TODO: Show error tooltip in Phase 6
  }, [])

  // Update editor content when content state changes
  useEffect(() => {
    // Only update the editor's content if it's different from the state.
    // This is crucial for loading new documents without interfering with user typing.
    if (editorRef.current && content !== editorRef.current.innerText) {
      console.log(
        "📝 Synchronizing editor DOM with new content, length:",
        content.length
      )
      editorRef.current.innerText = content
    }
  }, [content])

  // Save function
  const saveDocument = useCallback(
    async (
      contentToSave?: string,
      titleToSave?: string,
      summaryToSave?: string
    ) => {
      if (!document) return

      const finalContent = contentToSave ?? content
      const finalTitle = titleToSave ?? title
      const finalSummary = summaryToSave ?? medicalSummary

      // Don't save if nothing has changed
      if (
        finalContent === document.content &&
        finalTitle === document.title &&
        finalSummary === document.medicalSummary
      ) {
        console.log("📝 No changes to save")
        return
      }

      console.log("📝 Saving document:", document.title, "->", finalTitle)
      console.log("🏥 Saving medical summary:", finalSummary ? "yes" : "no")
      setIsSaving(true)
      setSaveError(null)

      try {
        const updateData: any = {
          content: finalContent,
          title: finalTitle
        }

        // Include medical summary if provided
        if (finalSummary !== undefined) {
          updateData.medicalSummary = finalSummary
        }

        const result = await updateDocumentAction(document.id, updateData)

        if (result.isSuccess) {
          console.log("✅ Document saved successfully")
          onDocumentUpdate(result.data)
          setHasUnsavedChanges(false)
          setLastSaved(new Date())
          toast.success("Document saved")
        } else {
          console.error("❌ Failed to save document:", result.message)
          setSaveError(result.message)
          toast.error(result.message)
        }
      } catch (error) {
        console.error("❌ Error saving document:", error)
        setSaveError("Failed to save document")
        toast.error("Failed to save document")
      } finally {
        setIsSaving(false)
      }
    },
    [document, content, title, medicalSummary, onDocumentUpdate]
  )

  // Medical Summary - Generate summary for doctor communication
  const generateMedicalSummary = useCallback(async () => {
    console.log("🏥 Starting medical summary generation...")
    console.log("📝 Content length:", content.length)
    console.log("🔍 Has medical analysis:", !!medicalAnalysis)

    // Validation
    if (!content.trim()) {
      console.log("❌ No content to summarize")
      toast.error("Please write some content before generating a summary")
      return
    }

    if (content.trim().length < 20) {
      console.log("❌ Content too short for summary")
      toast.error("Content is too short for a meaningful summary")
      return
    }

    setIsGeneratingSummary(true)
    setSummaryError(null)
    setHasCopiedSummary(false)

    try {
      const request: MedicalSummaryRequest = {
        text: content,
        medicalAnalysis: medicalAnalysis,
        documentId: document?.id
      }

      console.log("🌐 Calling medical summary API...")
      const response = await fetch("/api/medical-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate medical summary")
      }

      const result = await response.json()
      console.log("✅ Medical summary API response received")
      console.log("📊 Summary word count:", result.data.wordCount)

      if (result.success && result.data) {
        const summaryResponse = result.data as MedicalSummaryResponse
        const formattedSummary = `Medical Summary: ${summaryResponse.summary}`

        console.log("✅ Medical summary generated successfully")
        console.log("📝 Summary:", formattedSummary)

        setMedicalSummary(formattedSummary)
        setLastSummaryGenerated(new Date())
        setSummaryError(null)

        // Save the summary to the document
        if (document) {
          console.log("💾 Saving medical summary to document...")
          await saveDocument(content, title, formattedSummary)
        }

        toast.success(
          `Medical summary generated! (${summaryResponse.wordCount} words)`
        )
      }
    } catch (error) {
      console.error("❌ Medical summary generation failed:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate summary"
      setSummaryError(errorMessage)
      toast.error(`Summary generation failed: ${errorMessage}`)
    } finally {
      setIsGeneratingSummary(false)
    }
  }, [content, medicalAnalysis, document, title, saveDocument])

  // Copy summary and original text together
  const copySummaryAndText = useCallback(async () => {
    console.log("📋 Copying summary and original text...")

    if (!medicalSummary) {
      toast.error("No summary available to copy")
      return
    }

    try {
      const combinedText = `${medicalSummary}\n\n${content}`
      await navigator.clipboard.writeText(combinedText)

      console.log("✅ Summary and text copied to clipboard")
      console.log("📊 Total copied length:", combinedText.length)

      setHasCopiedSummary(true)
      toast.success("Summary and message copied to clipboard!")

      // Reset copied state after 3 seconds
      setTimeout(() => {
        setHasCopiedSummary(false)
      }, 3000)
    } catch (error) {
      console.error("❌ Failed to copy to clipboard:", error)
      toast.error("Failed to copy to clipboard")
    }
  }, [medicalSummary, content])

  // Set up auto-save interval
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearInterval(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setInterval(() => {
      if (hasUnsavedChanges && !isSaving) {
        console.log("⏰ Auto-saving document...")
        saveDocument()
      }
    }, AUTO_SAVE_INTERVAL)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearInterval(autoSaveTimeoutRef.current)
      }
    }
  }, [hasUnsavedChanges, isSaving, saveDocument])

  // Handle title changes
  const handleTitleChange = (newTitle: string) => {
    console.log("📝 Title changed:", newTitle)
    setTitle(newTitle)
    setHasUnsavedChanges(true)
  }

  // Handle title save
  const handleTitleSave = async () => {
    if (!document || title.trim() === document.title) {
      setIsEditingTitle(false)
      return
    }

    if (!title.trim()) {
      setTitle(document.title)
      setIsEditingTitle(false)
      toast.error("Title cannot be empty")
      return
    }

    await saveDocument(content, title.trim())
    setIsEditingTitle(false)
  }

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes === 1) return "1 minute ago"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`

    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearInterval(autoSaveTimeoutRef.current)
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (grammarCheckTimeoutRef.current) {
        clearTimeout(grammarCheckTimeoutRef.current)
      }
      if (grammarCheckAbortControllerRef.current) {
        grammarCheckAbortControllerRef.current.abort()
      }
    }
  }, [])

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-lg bg-slate-200">
            <svg
              className="size-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-slate-600">
            No Document Selected
          </h3>
          <p className="text-sm text-slate-400">
            Select a document from the sidebar or create a new one to start
            writing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          {/* Title */}
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  handleTitleSave()
                } else if (e.key === "Escape") {
                  setTitle(document.title)
                  setIsEditingTitle(false)
                }
              }}
              onBlur={handleTitleSave}
              className="h-auto border-none p-0 text-2xl font-bold focus-visible:ring-0"
              autoFocus
            />
          ) : (
            <h1
              className="cursor-pointer text-2xl font-bold text-slate-800 transition-colors hover:text-blue-600"
              onClick={() => setIsEditingTitle(true)}
            >
              {title}
            </h1>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col items-end gap-3">
            {/* Top Row: Save and Copy Buttons (small) */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => saveDocument()}
                disabled={!hasUnsavedChanges || isSaving}
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
              >
                <Save className="mr-1 size-3" />
                {isSaving ? "Saving..." : "Save"}
              </Button>

              <Button
                onClick={copySummaryAndText}
                disabled={!medicalSummary || hasCopiedSummary}
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
              >
                <Copy className="mr-1 size-3" />
                {hasCopiedSummary ? "Copied!" : "Copy"}
              </Button>
            </div>

            {/* Bottom Row: Summarize for Dr. Button (bigger, professional) */}
            <Button
              onClick={generateMedicalSummary}
              disabled={
                isGeneratingSummary ||
                !content.trim() ||
                content.trim().length < 20
              }
              size="default"
              className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
            >
              <Stethoscope className="mr-2 size-4" />
              {isGeneratingSummary ? "Generating..." : "Summarize for Dr."}
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-4 text-sm text-slate-500">
          {/* Save Status */}
          <div className="flex items-center gap-1">
            {isSaving ? (
              <>
                <Clock className="size-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveError ? (
              <>
                <AlertCircle className="size-4 text-red-500" />
                <span className="text-red-500">Save failed</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <Clock className="size-4 text-amber-500" />
                <span className="text-amber-600">Unsaved changes</span>
              </>
            ) : (
              <>
                <CheckCircle className="size-4 text-green-500" />
                <span>Saved</span>
              </>
            )}
          </div>

          {/* Grammar Check Status */}
          <div className="flex items-center gap-1">
            {isGrammarChecking ? (
              <>
                <Clock className="size-4 animate-spin text-blue-500" />
                <span className="text-blue-600">Checking grammar...</span>
              </>
            ) : grammarCheckError ? (
              <>
                <AlertCircle className="size-4 text-red-500" />
                <span className="text-red-500">Check failed</span>
              </>
            ) : lastGrammarCheck ? (
              <>
                <CheckCircle className="size-4 text-green-500" />
                <span>{errors.length} suggestions</span>
              </>
            ) : (
              <>
                <Clock className="size-4 text-slate-400" />
                <span>Grammar check pending</span>
              </>
            )}
          </div>

          {/* Last Saved */}
          {lastSaved && <span>Last saved {formatLastSaved(lastSaved)}</span>}

          {/* Word Count */}
          <span>
            {
              content
                .trim()
                .split(/\s+/)
                .filter(word => word.length > 0).length
            }{" "}
            words
          </span>
        </div>
      </div>

      {/* Medical Summary Display */}
      {medicalSummary && (
        <div className="shrink-0 border-b border-slate-200 bg-emerald-50 p-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <FileText className="size-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-emerald-800">
                    Generated for Your Doctor
                  </h3>
                  {lastSummaryGenerated && (
                    <span className="text-xs text-emerald-600">
                      Generated {lastSummaryGenerated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className="break-words text-sm leading-relaxed text-slate-700">
                  {medicalSummary}
                </p>
                {summaryError && (
                  <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-600">
                    {summaryError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Generation Status */}
      {isGeneratingSummary && (
        <div className="shrink-0 border-b border-slate-200 bg-blue-50 p-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
              <div className="flex size-8 shrink-0 items-center justify-center">
                <Clock className="size-4 animate-spin text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Generating Medical Summary...
                </h3>
                <p className="mt-1 text-xs text-blue-600">
                  Analyzing your message and creating a professional summary for
                  your doctor
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="relative flex-1 overflow-auto p-6">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dir="ltr"
          className="prose prose-slate prose-lg ltr mx-auto min-h-full w-full max-w-4xl focus:outline-none"
          style={{
            lineHeight: "1.8",
            fontSize: "16px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            direction: "ltr",
            textAlign: "left",
            unicodeBidi: "embed",
            writingMode: "horizontal-tb"
          }}
          onPaste={e => {
            console.log("📝 Paste event detected")
            // Handle paste as plain text to avoid formatting issues
            e.preventDefault()
            const text = e.clipboardData.getData("text/plain")
            console.log("📝 Pasting text:", text.substring(0, 50) + "...")

            // Insert text at cursor position
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0)
              range.deleteContents()

              // Create text node and insert
              const textNode = window.document.createTextNode(text)
              range.insertNode(textNode)

              // Move cursor to end of inserted text
              range.setStartAfter(textNode)
              range.setEndAfter(textNode)
              selection.removeAllRanges()
              selection.addRange(range)

              // Trigger content change
              const target = e.target as HTMLDivElement
              const plainText = target.innerText || ""
              setContent(plainText)
              setHasUnsavedChanges(true)
            }
          }}
          onKeyDown={e => {
            console.log("📝 Key pressed:", e.key)
            // Handle Enter key to create new lines properly
            if (e.key === "Enter") {
              e.preventDefault()
              const selection = window.getSelection()
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                const br = window.document.createElement("br")
                range.deleteContents()
                range.insertNode(br)
                range.setStartAfter(br)
                range.setEndAfter(br)
                selection.removeAllRanges()
                selection.addRange(range)

                // Trigger content change
                const target = e.target as HTMLDivElement
                const plainText = target.innerText || ""
                setContent(plainText)
                setHasUnsavedChanges(true)
              }
            }
          }}
        >
          {/* Content will be set via useEffect instead of dangerouslySetInnerHTML */}
        </div>

        {/* Phase 4 - Error Highlighting */}
        <ErrorHighlight
          errors={errors}
          containerRef={editorRef as React.RefObject<HTMLElement>}
          onErrorClick={handleErrorClick}
          onErrorHover={handleErrorHover}
        />

        {/* Phase 4 & 5 Debug Info (remove in production) */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute bottom-4 right-4 rounded bg-slate-900 p-2 text-xs text-white opacity-80">
            <div>📊 Errors: {errors.length}</div>
            <div>📝 Processing: {isProcessingText ? "Yes" : "No"}</div>
            <div>🤖 Grammar Check: {isGrammarChecking ? "Yes" : "No"}</div>
            <div>📍 Cursor: {cursorPosition.getCurrentPosition().offset}</div>
            {textProcessingResult && (
              <div>📏 Text: {textProcessingResult.plainText.length} chars</div>
            )}
            {lastGrammarCheck && (
              <div>⏰ Last Check: {lastGrammarCheck.toLocaleTimeString()}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
