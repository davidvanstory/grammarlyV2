"use client"

/*
<ai_context>
Document editor component for the center panel of Med Writer.
Features auto-save, title editing, readability scoring, and real-time text editing.
</ai_context>
*/

import { useState, useEffect, useCallback, useRef } from "react"
import { SelectDocument } from "@/db/schema/documents-schema"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Clock, CheckCircle } from "lucide-react"
import { calculateFleschScore, getFleschRating } from "@/lib/readability"

interface DocumentEditorProps {
  document: SelectDocument | null
  onUpdateDocument: (
    documentId: string,
    updates: { title?: string; content?: string }
  ) => void
  isSaving: boolean
}

export default function DocumentEditor({
  document,
  onUpdateDocument,
  isSaving
}: DocumentEditorProps) {
  console.log("Rendering document editor for document:", document?.id || "none")

  const [title, setTitle] = useState(document?.title || "")
  const [content, setContent] = useState(document?.content || "")
  const [wordCount, setWordCount] = useState(0)
  const [readabilityScore, setReadabilityScore] = useState<number | null>(null)
  const [readabilityRating, setReadabilityRating] = useState<string>("")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Auto-save timers
  const titleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const contentTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Update local state when document changes
  useEffect(() => {
    console.log("Document changed, updating editor state")
    setTitle(document?.title || "")
    setContent(document?.content || "")
  }, [document])

  // Calculate readability score and word count
  useEffect(() => {
    if (content.trim()) {
      console.log(
        "Calculating readability score for content length:",
        content.length
      )
      const words = content.trim().split(/\s+/).length
      setWordCount(words)

      if (words >= 10) {
        // Minimum words for meaningful readability score
        const score = calculateFleschScore(content)
        const rating = getFleschRating(score)
        setReadabilityScore(score)
        setReadabilityRating(rating)
        console.log("Readability calculated - Score:", score, "Rating:", rating)
      } else {
        setReadabilityScore(null)
        setReadabilityRating("")
      }
    } else {
      setWordCount(0)
      setReadabilityScore(null)
      setReadabilityRating("")
    }
  }, [content])

  // Auto-save title with debouncing
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      console.log("Title changed:", newTitle)
      setTitle(newTitle)

      if (!document) return

      // Clear existing timeout
      if (titleTimeoutRef.current) {
        clearTimeout(titleTimeoutRef.current)
      }

      // Set new timeout for auto-save
      titleTimeoutRef.current = setTimeout(() => {
        if (newTitle.trim() && newTitle !== document.title) {
          console.log("Auto-saving title:", newTitle)
          onUpdateDocument(document.id, { title: newTitle.trim() })
          setLastSaved(new Date())
        }
      }, 1000) // 1 second delay
    },
    [document, onUpdateDocument]
  )

  // Auto-save content with debouncing
  const handleContentChange = useCallback(
    (newContent: string) => {
      console.log("Content changed, length:", newContent.length)
      setContent(newContent)

      if (!document) return

      // Clear existing timeout
      if (contentTimeoutRef.current) {
        clearTimeout(contentTimeoutRef.current)
      }

      // Set new timeout for auto-save
      contentTimeoutRef.current = setTimeout(() => {
        if (newContent !== document.content) {
          console.log("Auto-saving content")
          onUpdateDocument(document.id, { content: newContent })
          setLastSaved(new Date())
        }
      }, 2000) // 2 second delay for content
    },
    [document, onUpdateDocument]
  )

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
      if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current)
    }
  }, [])

  if (!document) {
    return (
      <Card className="h-full bg-white shadow-lg">
        <CardContent className="flex h-full items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="mb-2 text-lg">No document selected</p>
            <p className="text-sm">
              Select a document from the sidebar or create a new one to start
              writing.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getReadabilityColor = (score: number) => {
    if (score >= 60) return "bg-green-100 text-green-800"
    if (score >= 30) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <Card className="flex h-full flex-col bg-white shadow-lg">
      <CardHeader className="pb-4">
        <div className="space-y-4">
          {/* Document Title */}
          <Input
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Document title..."
            className="border-none px-0 text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          {/* Stats and Status Bar */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>

              {readabilityScore !== null && (
                <Badge
                  className={`${getReadabilityColor(readabilityScore)} border-0`}
                >
                  Readability: {Math.round(readabilityScore)} (
                  {readabilityRating})
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-gray-500">
              {isSaving ? (
                <>
                  <Clock className="size-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="size-4 text-green-500" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>Auto-save enabled</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <Textarea
          value={content}
          onChange={e => handleContentChange(e.target.value)}
          placeholder="Start writing your medical document here..."
          className="min-h-[500px] flex-1 resize-none border-none px-0 text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        {/* Writing Tips for Medical Students */}
        {content.length < 50 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 font-medium text-blue-900">
              Writing Tips for Medical Students:
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Use clear, concise language</li>
              <li>• Define medical terms when appropriate</li>
              <li>• Organize content with proper headings</li>
              <li>• Support statements with evidence</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
