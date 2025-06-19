"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Save, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { SelectDocument } from "@/db/schema/documents-schema"
import { updateDocumentAction } from "@/actions/db/documents-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

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

  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update local state when document prop changes
  useEffect(() => {
    if (document) {
      console.log("📝 Updating editor content for document:", document.title)
      setContent(document.content)
      setTitle(document.title)
      setHasUnsavedChanges(false)
      setSaveError(null)
      setLastSaved(new Date(document.updatedAt))
    } else {
      console.log("📝 No document selected, clearing editor")
      setContent("")
      setTitle("")
      setHasUnsavedChanges(false)
      setSaveError(null)
      setLastSaved(null)
    }
  }, [document])

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
      <div className="flex-1 overflow-auto p-6">
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

        {content.trim() === "" && (
          <div className="prose prose-slate prose-lg pointer-events-none absolute inset-6 text-slate-400">
            <p>Start writing your medical document here...</p>
            <p className="text-sm">Tips for medical writing:</p>
            <ul className="text-sm">
              <li>Use clear, concise language</li>
              <li>Define medical terms when necessary</li>
              <li>Structure your content logically</li>
              <li>Auto-save is enabled every 30 seconds</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
