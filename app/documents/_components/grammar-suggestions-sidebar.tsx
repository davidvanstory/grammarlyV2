"use client"

import { Brain, BookOpen, Target, AlertTriangle } from "lucide-react"
import { SelectDocument } from "@/db/schema/documents-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

/*
<ai_context>
Grammar suggestions sidebar component for the Med Writer application.
Provides placeholder structure for future grammar suggestions, readability scores, and medical terminology help.
</ai_context>
*/

interface GrammarSuggestionsSidebarProps {
  document: SelectDocument | null
}

export default function GrammarSuggestionsSidebar({
  document
}: GrammarSuggestionsSidebarProps) {
  console.log(
    "📝 Rendering grammar suggestions sidebar for document:",
    document?.title || "None"
  )

  // Calculate basic readability metrics (placeholder implementation)
  const calculateReadabilityScore = (content: string): number => {
    if (!content.trim()) return 0

    const words = content.trim().split(/\s+/).length
    const sentences = content
      .split(/[.!?]+/)
      .filter(s => s.trim().length > 0).length
    const avgWordsPerSentence = sentences > 0 ? words / sentences : 0

    // Simple readability score (0-100, higher is easier to read)
    const score = Math.max(0, Math.min(100, 100 - avgWordsPerSentence * 2))
    return Math.round(score)
  }

  // Get readability level description
  const getReadabilityLevel = (
    score: number
  ): { level: string; color: string; description: string } => {
    if (score >= 80)
      return {
        level: "Easy",
        color: "bg-green-100 text-green-800",
        description: "Very easy to read"
      }
    if (score >= 60)
      return {
        level: "Moderate",
        color: "bg-blue-100 text-blue-800",
        description: "Moderately easy to read"
      }
    if (score >= 40)
      return {
        level: "Difficult",
        color: "bg-orange-100 text-orange-800",
        description: "Difficult to read"
      }
    return {
      level: "Very Difficult",
      color: "bg-red-100 text-red-800",
      description: "Very difficult to read"
    }
  }

  const readabilityScore = document
    ? calculateReadabilityScore(document.content)
    : 0
  const readabilityLevel = getReadabilityLevel(readabilityScore)

  // Word count and other metrics
  const wordCount = document
    ? document.content
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0).length
    : 0
  const characterCount = document ? document.content.length : 0

  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Brain className="size-5 text-blue-600" />
          Writing Assistant
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          AI-powered grammar and style suggestions
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {!document ? (
            <div className="py-8 text-center text-slate-500">
              <Brain className="mx-auto mb-3 size-12 text-slate-300" />
              <p className="text-sm">No document selected</p>
              <p className="mt-1 text-xs text-slate-400">
                Select a document to see writing suggestions
              </p>
            </div>
          ) : (
            <>
              {/* Readability Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Target className="size-4 text-blue-600" />
                    Readability Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-800">
                      {readabilityScore}
                    </span>
                    <Badge className={readabilityLevel.color}>
                      {readabilityLevel.level}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {readabilityLevel.description}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${readabilityScore}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Document Statistics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BookOpen className="size-4 text-blue-600" />
                    Document Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Words:</span>
                    <span className="font-medium">
                      {wordCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Characters:</span>
                    <span className="font-medium">
                      {characterCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Reading time:</span>
                    <span className="font-medium">
                      {Math.ceil(wordCount / 200)} min
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Grammar Suggestions (Placeholder) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="size-4 text-amber-600" />
                    Grammar Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="py-4 text-center text-slate-500">
                    <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-slate-200">
                      <Brain className="size-4 text-slate-400" />
                    </div>
                    <p className="text-xs">
                      AI grammar checking will appear here
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Coming in Phase 5
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Terminology Help (Placeholder) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BookOpen className="size-4 text-green-600" />
                    Medical Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="py-4 text-center text-slate-500">
                    <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-slate-200">
                      <BookOpen className="size-4 text-slate-400" />
                    </div>
                    <p className="text-xs">
                      Medical terminology help will appear here
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Coming in Phase 7
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Writing Tips */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Target className="size-4 text-purple-600" />
                    Writing Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <div className="mt-2 size-1 shrink-0 rounded-full bg-purple-600" />
                      <span>Use active voice when possible</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-2 size-1 shrink-0 rounded-full bg-purple-600" />
                      <span>Define medical terms for clarity</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-2 size-1 shrink-0 rounded-full bg-purple-600" />
                      <span>Keep sentences concise and clear</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-2 size-1 shrink-0 rounded-full bg-purple-600" />
                      <span>Use consistent medical terminology</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
