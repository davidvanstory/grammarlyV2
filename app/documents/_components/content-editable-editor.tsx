"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Save, Clock, CheckCircle, AlertCircle } from "lucide-react"
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
}

// Auto-save configuration
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds
const DEBOUNCE_DELAY = 1000 // 1 second debounce for typing
const GRAMMAR_CHECK_DEBOUNCE = 500 // 500ms for grammar checking (reduced from 2000ms)
const SENTENCE_END_IMMEDIATE_CHECK = 100 // 100ms delay after sentence completion

export default function ContentEditableEditor({
  document,
  onDocumentUpdate,
  onGrammarCheck
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

  // Step 2: Add tracking state for document changes to prevent unnecessary effects
  const [prevDocumentId, setPrevDocumentId] = useState<string | null>(null)
  const [prevDocumentContent, setPrevDocumentContent] = useState<string | null>(
    null
  )

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
        // Use consistent text processing for AI - same as highlighting component
        let textForAI = text
        if (editorRef.current) {
          console.log("📝 Using consistent text processor for AI...")
          const textProcessor = getTextProcessor()
          const result = textProcessor.htmlToPlainText(editorRef.current)
          textForAI = result.plainText
          console.log(
            `📝 Processed text for AI: ${textForAI.length} chars (original: ${text.length})`
          )
        }

        const request: GrammarCheckRequest = {
          text: textForAI,
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
    },
    [performGrammarCheck]
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

  // Step 2: Enhanced document change detection with robust tracking
  useEffect(() => {
    if (document) {
      const isActuallyNewDocument = document.id !== prevDocumentId
      const isContentChangedExternally =
        document.content !== prevDocumentContent && document.content !== content

      if (isActuallyNewDocument) {
        console.log(
          "📝 CEE: useEffect[document] - Loading NEW document:",
          document.id,
          "Title:",
          document.title
        )
        setPrevDocumentId(document.id)
        setPrevDocumentContent(document.content)

        // Reset all state for new document
        setContent(document.content)
        setTitle(document.title)
        setHasUnsavedChanges(false)
        setSaveError(null)
        setLastSaved(new Date(document.updatedAt))

        // Reset Phase 4 state for new document
        setErrors([])
        setIsProcessingText(false)
        setTextProcessingResult(null)
        updateEditorState(document.content)

        // Set editor content properly using consistent text processing
        if (
          editorRef.current &&
          editorRef.current.innerText !== document.content
        ) {
          console.log(
            "📝 CEE: Setting initial editor content from NEW document"
          )
          editorRef.current.innerText = document.content // Set plain text
        }

        // Enhanced initial grammar check for NEW document
        if (document.content.trim().length > 10) {
          console.log(
            "🤖 CEE: Triggering initial grammar check for NEW document:",
            document.title
          )
          setTimeout(() => {
            if (editorRef.current) {
              console.log(
                "📝 CEE: Using text processor for NEW document grammar check..."
              )
              const textProcessor = getTextProcessor()
              const result = textProcessor.htmlToPlainText(editorRef.current)
              const processedText = result.plainText
              console.log(
                `📝 CEE: NEW document check text: ${processedText.length} chars (original: ${document.content.length})`
              )
              performGrammarCheck(processedText, true)
            } else {
              console.log("📝 CEE: Fallback grammar check for NEW document")
              performGrammarCheck(document.content, true)
            }
          }, 1000)
        }
      } else if (isContentChangedExternally) {
        // Same document ID, but content prop from parent has changed externally
        console.log(
          "📝 CEE: useEffect[document] - External content update for document:",
          document.id,
          "Title:",
          document.title
        )
        setPrevDocumentContent(document.content)

        setContent(document.content)
        if (title !== document.title) setTitle(document.title)
        setHasUnsavedChanges(false) // Content came from external, so not "unsaved user changes"
        setLastSaved(new Date(document.updatedAt))
        updateEditorState(document.content)

        // Update editor DOM for external changes
        if (
          editorRef.current &&
          editorRef.current.innerText !== document.content
        ) {
          console.log("📝 CEE: Updating editor DOM for external content change")
          editorRef.current.innerText = document.content
        }

        if (document.content.trim().length > 10) {
          setTimeout(() => {
            console.log(
              "🤖 CEE: Triggering grammar check for EXTERNALLY UPDATED document:",
              document.title
            )
            performGrammarCheck(document.content, true)
          }, 1000)
        }
      } else {
        // Document prop reference might have changed, but ID and content are the same
        // as what we last processed from the prop. Only update metadata if needed.
        const newLastSaved = new Date(document.updatedAt)
        if (lastSaved?.getTime() !== newLastSaved.getTime()) {
          console.log(
            "📝 CEE: useEffect[document] - Updating lastSaved timestamp only"
          )
          setLastSaved(newLastSaved)
        } else {
          console.log(
            "📝 CEE: useEffect[document] - Document prop updated (same ID, same content, same timestamp) - Title:",
            document.title
          )
        }

        // Always update prevDocumentContent to track the latest prop version
        if (document.content !== prevDocumentContent) {
          setPrevDocumentContent(document.content)
        }
      }
    } else if (prevDocumentId !== null) {
      // Document became null and there was a document selected before
      console.log("📝 CEE: useEffect[document] - Document deselected")
      setPrevDocumentId(null)
      setPrevDocumentContent(null)

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

      // Clear editor content
      if (editorRef.current) {
        editorRef.current.innerText = ""
      }
    }
  }, [
    document,
    prevDocumentId,
    prevDocumentContent,
    performGrammarCheck,
    updateEditorState,
    content,
    title,
    lastSaved
  ])

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

      // Preserve cursor position before changing innerText
      const selection = window.getSelection()
      let savedRange = null
      let cursorOffset = 0

      if (selection && selection.rangeCount > 0) {
        const currentRange = selection.getRangeAt(0)
        // Check if the cursor is inside the editor before saving
        if (editorRef.current.contains(currentRange.commonAncestorContainer)) {
          savedRange = currentRange.cloneRange()
          // Calculate cursor offset in plain text
          try {
            const textProcessor = getTextProcessor()
            const beforeCursor = currentRange.cloneRange()
            beforeCursor.selectNodeContents(editorRef.current)
            beforeCursor.setEnd(
              currentRange.startContainer,
              currentRange.startOffset
            )
            const beforeText = textProcessor.htmlToPlainText(
              beforeCursor.cloneContents() as any
            ).plainText
            cursorOffset = beforeText.length
            console.log(`📍 Saved cursor position at offset: ${cursorOffset}`)
          } catch (e) {
            console.warn("Could not calculate cursor offset:", e)
          }
        }
      }

      editorRef.current.innerText = content // This will trigger ErrorHighlight to re-run

      // Restore cursor position if possible
      if (savedRange && selection) {
        try {
          // Try to restore to the same character offset
          if (cursorOffset > 0 && cursorOffset <= content.length) {
            const walker = window.document.createTreeWalker(
              editorRef.current,
              NodeFilter.SHOW_TEXT,
              null
            )

            let currentOffset = 0
            let targetNode = null
            let targetOffset = 0
            let textNode = walker.nextNode()

            while (textNode && currentOffset < cursorOffset) {
              const nodeLength = textNode.textContent?.length || 0
              if (currentOffset + nodeLength >= cursorOffset) {
                targetNode = textNode
                targetOffset = cursorOffset - currentOffset
                break
              }
              currentOffset += nodeLength
              textNode = walker.nextNode()
            }

            if (targetNode) {
              const newRange = window.document.createRange()
              newRange.setStart(
                targetNode,
                Math.min(targetOffset, targetNode.textContent?.length || 0)
              )
              newRange.setEnd(
                targetNode,
                Math.min(targetOffset, targetNode.textContent?.length || 0)
              )
              selection.removeAllRanges()
              selection.addRange(newRange)
              console.log(`✅ Restored cursor to offset ${cursorOffset}`)
            } else {
              throw new Error(
                "Could not find target node for cursor restoration"
              )
            }
          } else {
            throw new Error("Invalid cursor offset")
          }
        } catch (e) {
          console.warn(
            "Could not restore cursor position after content sync:",
            e
          )
          // Fallback: move cursor to end
          try {
            const newRange = window.document.createRange()
            newRange.selectNodeContents(editorRef.current)
            newRange.collapse(false) // false for end
            selection.removeAllRanges()
            selection.addRange(newRange)
            console.log("📍 Fallback: moved cursor to end")
          } catch (fallbackError) {
            console.warn("Could not even move cursor to end:", fallbackError)
          }
        }
      }
    }
  }, [content])

  // Save function
  const saveDocument = useCallback(
    async (contentToSave?: string, titleToSave?: string) => {
      if (!document) return

      const finalContent = contentToSave ?? content
      const finalTitle = titleToSave ?? title

      // Don't save if nothing has changed
      if (finalContent === document.content && finalTitle === document.title) {
        console.log("📝 No changes to save")
        return
      }

      console.log("📝 Saving document:", document.title, "->", finalTitle)
      setIsSaving(true)
      setSaveError(null)

      try {
        const result = await updateDocumentAction(document.id, {
          content: finalContent,
          title: finalTitle
        })

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
    [document, content, title, onDocumentUpdate]
  )

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

          {/* Save Button */}
          <Button
            onClick={() => saveDocument()}
            disabled={!hasUnsavedChanges || isSaving}
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Save className="mr-2 size-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
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
