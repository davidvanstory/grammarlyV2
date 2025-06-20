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
  TextProcessingResult
} from "@/types/grammar-types"

/*
<ai_context>
Content-editable editor component for the Med Writer application.
Implements rich text editing with auto-save, title editing, and medical writing optimizations.
</ai_context>
*/

interface ContentEditableEditorProps {
  document: SelectDocument | null
  onDocumentUpdate: (document: SelectDocument) => void
}

// Auto-save configuration
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds
const DEBOUNCE_DELAY = 1000 // 1 second debounce for typing

export default function ContentEditableEditor({
  document,
  onDocumentUpdate
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

  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const positionTrackerRef = useRef<PositionTracker | null>(null)

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
        isProcessing: isProcessingText
      }))
    },
    [document?.content, isProcessingText]
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

      // Note: Save will be triggered by the existing auto-save mechanism
    },
    [updateEditorState]
  )

  const handleSubstantialTextChange = useCallback((newText: string) => {
    console.log("📢 Substantial text change detected:", newText.length, "chars")

    // Clear existing errors on substantial changes
    setErrors([])

    // Update position tracker
    if (editorRef.current && positionTrackerRef.current) {
      positionTrackerRef.current.updatePositionMap()
    }
  }, [])

  // Phase 4 hooks - Position tracking and text change detection
  const textChangeHook = useTextChange(
    editorRef as React.RefObject<HTMLElement>,
    {
      debounceMs: 300,
      onTextChange: handleTextChangeWithPositionTracking,
      onSubstantialChange: handleSubstantialTextChange,
      substantialChangeThreshold: 50
    }
  )

  // Update local state when document prop changes
  useEffect(() => {
    if (document) {
      console.log("📝 Updating editor content for document:", document.title)
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
    if (editorRef.current && editorRef.current.innerText !== content) {
      console.log("📝 Updating editor DOM content, length:", content.length)
      // Preserve cursor position
      const selection = window.getSelection()
      let cursorPosition = 0

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        cursorPosition = range.startOffset
      }

      // Set the content as plain text to avoid HTML issues
      editorRef.current.innerText = content

      // Restore cursor position
      if (selection && editorRef.current.firstChild) {
        try {
          const range = window.document.createRange()
          const textNode = editorRef.current.firstChild
          const maxOffset = textNode.textContent?.length || 0
          const safeOffset = Math.min(cursorPosition, maxOffset)

          range.setStart(textNode, safeOffset)
          range.setEnd(textNode, safeOffset)
          selection.removeAllRanges()
          selection.addRange(range)
        } catch (error) {
          console.log("📝 Could not restore cursor position:", error)
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

  // Debounced save for auto-save
  const debouncedSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges) {
        saveDocument()
      }
    }, DEBOUNCE_DELAY)
  }, [hasUnsavedChanges, saveDocument])

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

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    console.log("📝 Content changed, length:", newContent.length)
    console.log("📝 Content is empty:", newContent.trim() === "")
    console.log("📝 Placeholder should be visible:", newContent.trim() === "")
    setContent(newContent)
    setHasUnsavedChanges(true)
    debouncedSave()
  }

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
          onInput={e => {
            const target = e.target as HTMLDivElement
            const newContent = target.innerHTML || ""
            console.log(
              "📝 Content input detected, HTML length:",
              newContent.length
            )
            // Convert HTML to plain text for storage but preserve formatting
            const plainText = target.innerText || ""
            handleContentChange(plainText)
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
              handleContentChange(plainText)
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
                handleContentChange(plainText)
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

        {content.trim() === "" && (
          <div className="prose prose-slate prose-lg pointer-events-none absolute inset-x-6 top-6 text-slate-400 transition-opacity duration-200 ease-in-out">
            <div className="mx-auto max-w-4xl">
              <p className="mb-4">
                Start writing your medical document here...
              </p>
              <p className="mb-3 text-sm font-medium">
                Tips for medical writing with Phase 4 enhancements:
              </p>
              <ul className="space-y-1 text-sm">
                <li>
                  ✨ Advanced position tracking for precise error highlighting
                </li>
                <li>
                  🔍 Real-time text processing with medical terminology
                  awareness
                </li>
                <li>📍 Mathematical cursor position management</li>
                <li>🎯 Intelligent text change detection with debouncing</li>
                <li>Auto-save is enabled every 30 seconds</li>
              </ul>
            </div>
          </div>
        )}

        {/* Phase 4 Debug Info (remove in production) */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute bottom-4 right-4 rounded bg-slate-900 p-2 text-xs text-white opacity-80">
            <div>📊 Errors: {errors.length}</div>
            <div>📝 Processing: {isProcessingText ? "Yes" : "No"}</div>
            <div>📍 Cursor: {cursorPosition.getCurrentPosition().offset}</div>
            {textProcessingResult && (
              <div>📏 Text: {textProcessingResult.plainText.length} chars</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
