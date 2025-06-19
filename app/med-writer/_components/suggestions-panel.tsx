"use client"

/*
<ai_context>
Suggestions panel component for the right sidebar of Med Writer.
Shows writing suggestions and grammar improvements when available.
</ai_context>
*/

import { useState } from "react"
import { SelectDocument } from "@/db/schema/documents-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, ChevronRight, ChevronDown, BookOpen } from "lucide-react"

interface SuggestionsPanelProps {
  document: SelectDocument | null
}

export default function SuggestionsPanel({ document }: SuggestionsPanelProps) {
  console.log(
    "Rendering suggestions panel for document:",
    document?.id || "none"
  )

  const [isExpanded, setIsExpanded] = useState(true)

  const toggleExpanded = () => {
    console.log("Toggling suggestions panel:", !isExpanded)
    setIsExpanded(!isExpanded)
  }

  if (!document) {
    return (
      <Card className="h-full bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Lightbulb className="size-5 text-yellow-500" />
            Writing Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <BookOpen className="mx-auto mb-3 size-12 text-gray-300" />
            <p className="text-sm">
              Select a document to see writing suggestions and grammar
              improvements.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-col bg-white shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
          <span className="flex items-center gap-2">
            <Lightbulb className="size-5 text-yellow-500" />
            Writing Suggestions
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="size-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="flex-1 space-y-4 overflow-y-auto">
          <div className="py-8 text-center text-gray-500">
            <Lightbulb className="mx-auto mb-3 size-12 text-gray-300" />
            <p className="text-sm">
              No suggestions available for this document yet.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
