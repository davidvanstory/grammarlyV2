"use client"

/*
<ai_context>
Suggestions panel component for the right sidebar of Med Writer.
Will eventually show grammar suggestions, but currently displays placeholder content.
</ai_context>
*/

import { useState } from "react"
import { SelectDocument } from "@/db/schema/documents-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Lightbulb,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Zap
} from "lucide-react"

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

  // Placeholder suggestions data (will be replaced with real grammar checking)
  const placeholderSuggestions = [
    {
      id: 1,
      type: "grammar",
      severity: "medium",
      text: "Consider using active voice",
      explanation:
        "Active voice makes your writing clearer and more direct, which is important in medical documentation.",
      original: "The patient was examined by the doctor",
      suggestion: "The doctor examined the patient"
    },
    {
      id: 2,
      type: "clarity",
      severity: "low",
      text: "Define medical abbreviation",
      explanation: "Consider defining abbreviations on first use for clarity.",
      original: "Patient has HTN",
      suggestion: "Patient has hypertension (HTN)"
    },
    {
      id: 3,
      type: "style",
      severity: "low",
      text: "Consider more specific term",
      explanation:
        "More precise terminology can improve professional communication.",
      original: "The medication works well",
      suggestion: "The medication demonstrates high efficacy"
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return "🔴"
      case "medium":
        return "🟡"
      case "low":
        return "🔵"
      default:
        return "⚪"
    }
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
          {/* Coming Soon Banner */}
          <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Zap className="size-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                AI Grammar Checking
              </span>
              <Badge className="bg-blue-100 text-xs text-blue-800">
                Coming Soon
              </Badge>
            </div>
            <p className="text-sm text-blue-700">
              Advanced grammar and style suggestions will be available in the
              next phase of development.
            </p>
          </div>

          {/* Placeholder Suggestions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              Sample Suggestions:
            </h4>

            {placeholderSuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className={`rounded-lg border p-3 ${getSeverityColor(suggestion.severity)}`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">
                      {getSeverityIcon(suggestion.severity)}
                    </span>
                    <span className="text-sm font-medium">
                      {suggestion.text}
                    </span>
                  </div>
                </div>

                <p className="mb-2 text-xs opacity-80">
                  {suggestion.explanation}
                </p>

                <div className="space-y-1 text-xs">
                  <div className="rounded border bg-white/50 p-2">
                    <span className="font-medium">Original: </span>
                    <span className="line-through opacity-60">
                      {suggestion.original}
                    </span>
                  </div>
                  <div className="rounded border bg-white/50 p-2">
                    <span className="font-medium">Suggestion: </span>
                    <span className="text-green-800">
                      {suggestion.suggestion}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    disabled
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    disabled
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Future Features */}
          <div className="border-t pt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900">
              Upcoming Features:
            </h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Real-time grammar checking</li>
              <li>• Medical terminology validation</li>
              <li>• Style consistency suggestions</li>
              <li>• Citation format checking</li>
              <li>• Readability improvements</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
