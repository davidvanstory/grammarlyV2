"use client"

import { useState, useEffect } from "react"
import {
  Brain,
  Target,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Heart,
  RefreshCw
} from "lucide-react"
import { SelectDocument } from "@/db/schema/documents-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TrackedError, ErrorType } from "@/types/grammar-types"
import {
  MedicalInformation,
  MedicalField,
  MedicalFieldType,
  MedicalInfoSidebarProps
} from "@/types/medical-types"
import { MEDICAL_FIELD_CONFIGS } from "@/lib/medical-prompts"

/*
<ai_context>
Unified suggestions sidebar for the Med Writer application.
Combines grammar suggestions and medical information tracking in a tabbed interface.
Defaults to medical information tab with reset on document change.
Includes badge counts for visual indicators.
</ai_context>
*/

interface UnifiedSuggestionsSidebarProps {
  document: SelectDocument | null
  // Grammar props
  grammarErrors?: TrackedError[]
  isGrammarChecking?: boolean
  onGrammarErrorClick?: (error: TrackedError) => void
  // Medical props
  medicalAnalysis: MedicalInformation | null
  isMedicalAnalyzing?: boolean
  onMedicalFieldClick?: (field: MedicalField) => void
  onMedicalRefresh?: () => void
}

export default function UnifiedSuggestionsSidebar({
  document,
  grammarErrors = [],
  isGrammarChecking = false,
  onGrammarErrorClick,
  medicalAnalysis,
  isMedicalAnalyzing = false,
  onMedicalFieldClick,
  onMedicalRefresh
}: UnifiedSuggestionsSidebarProps) {
  console.log("🎯 Rendering unified suggestions sidebar")
  console.log("📄 Document:", document?.title || "None")
  console.log("📊 Grammar errors:", grammarErrors.length)
  console.log("🏥 Medical analysis:", medicalAnalysis?.id || "None")
  console.log("🤖 Grammar checking:", isGrammarChecking)
  console.log("🔄 Medical analyzing:", isMedicalAnalyzing)

  // Tab state - defaults to medical, resets on document change
  const [activeTab, setActiveTab] = useState<"medical" | "grammar">("medical")

  // Reset to medical tab when document changes
  useEffect(() => {
    console.log("🔄 Document changed, resetting to medical tab")
    setActiveTab("medical")
  }, [document?.id])

  // Calculate badge counts
  const grammarErrorCount = grammarErrors.length
  const missingMedicalFieldsCount = medicalAnalysis?.missingFields?.length || 0

  console.log(
    "🔢 Badge counts - Grammar:",
    grammarErrorCount,
    "Medical missing:",
    missingMedicalFieldsCount
  )

  // Grammar helper functions (from original grammar sidebar)
  const getErrorTypeColor = (type: ErrorType): string => {
    switch (type) {
      case "spelling":
        return "bg-red-100 text-red-800"
      case "grammar":
        return "bg-blue-100 text-blue-800"
      case "style":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getErrorTypeIcon = (type: ErrorType): string => {
    switch (type) {
      case "spelling":
        return "🔤"
      case "grammar":
        return "📝"
      case "style":
        return "✨"
      default:
        return "❓"
    }
  }

  // Group errors by type
  const errorsByType = grammarErrors.reduce(
    (acc, error) => {
      if (!acc[error.type]) {
        acc[error.type] = []
      }
      acc[error.type].push(error)
      return acc
    },
    {} as Record<ErrorType, TrackedError[]>
  )

  // Calculate readability metrics for grammar tab
  const calculateReadabilityScore = (content: string): number => {
    if (!content.trim()) return 0

    const words = content.trim().split(/\s+/).length
    const sentences = content
      .split(/[.!?]+/)
      .filter(s => s.trim().length > 0).length
    const avgWordsPerSentence = sentences > 0 ? words / sentences : 0

    const score = Math.max(0, Math.min(100, 100 - avgWordsPerSentence * 2))
    return Math.round(score)
  }

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
      {/* Header with Tabs */}
      <div className="border-b border-slate-200 p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Writing Assistant
        </h2>

        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as "medical" | "grammar")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="medical" className="relative">
              <Heart className="mr-2 size-4" />
              Patient Info
              {missingMedicalFieldsCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 size-5 rounded-full p-0 text-xs"
                >
                  {missingMedicalFieldsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="grammar" className="relative">
              <Brain className="mr-2 size-4" />
              Grammar
              {grammarErrorCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 size-5 rounded-full p-0 text-xs"
                >
                  {grammarErrorCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Medical Information Tab Content */}
          <TabsContent value="medical" className="mt-0">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-4 p-1">
                {!document ? (
                  <div className="py-8 text-center text-slate-500">
                    <Heart className="mx-auto mb-3 size-12 text-slate-300" />
                    <p className="text-sm">No document selected</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Select a document to track medical information
                    </p>
                  </div>
                ) : !medicalAnalysis ? (
                  <div className="py-6 text-center text-slate-500">
                    <Heart className="mx-auto mb-2 size-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">
                      Start writing, suggestions will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Refresh button */}
                    {onMedicalRefresh && (
                      <div className="mb-3 flex justify-end">
                        <Button
                          onClick={onMedicalRefresh}
                          size="sm"
                          variant="outline"
                          disabled={isMedicalAnalyzing}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <RefreshCw
                            className={`mr-2 size-3 ${isMedicalAnalyzing ? "animate-spin" : ""}`}
                          />
                          Refresh
                        </Button>
                      </div>
                    )}

                    {medicalAnalysis.fieldsAnalyzed
                      .sort((a, b) => {
                        const config_a = MEDICAL_FIELD_CONFIGS[a.type]
                        const config_b = MEDICAL_FIELD_CONFIGS[b.type]

                        if (a.isPresent !== b.isPresent) {
                          return a.isPresent ? 1 : -1
                        }
                        return config_a.priority - config_b.priority
                      })
                      .map(field => {
                        const config = MEDICAL_FIELD_CONFIGS[field.type]
                        return (
                          <div
                            key={field.type}
                            className={`cursor-pointer rounded border p-2 transition-all hover:shadow-sm ${
                              field.isPresent
                                ? "border-green-200 bg-green-50"
                                : "border-red-200 bg-red-50"
                            }`}
                            onClick={() => onMedicalFieldClick?.(field)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-800">
                                {config.label}
                              </span>
                              <div className="flex items-center gap-1">
                                {field.isPresent ? (
                                  <span className="text-green-600">✓</span>
                                ) : (
                                  <span className="text-red-600">✗</span>
                                )}
                                <span
                                  className={`text-xs ${
                                    field.isPresent
                                      ? "text-green-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  {field.isPresent ? "provided" : "missing"}
                                </span>
                              </div>
                            </div>

                            {!field.isPresent && (
                              <div className="mt-1 text-xs text-slate-600">
                                <p>{field.description}</p>
                                {config.example && (
                                  <p className="mt-0.5 text-slate-500">
                                    Example: {config.example}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}

                    {medicalAnalysis.lastAnalyzed && (
                      <div className="mt-4 text-center text-xs text-slate-400">
                        Last analyzed:{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          hour: "2-digit",
                          minute: "2-digit"
                        }).format(medicalAnalysis.lastAnalyzed)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Grammar Suggestions Tab Content */}
          <TabsContent value="grammar" className="mt-0">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-4 p-1">
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
                          <FileText className="size-4 text-blue-600" />
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

                    {/* Grammar Suggestions */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="size-4 text-amber-600" />
                            Grammar Suggestions
                          </div>
                          {isGrammarChecking && (
                            <Clock className="size-4 animate-spin text-blue-500" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {isGrammarChecking ? (
                          <div className="py-4 text-center text-slate-500">
                            <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-blue-100">
                              <Clock className="size-4 animate-spin text-blue-600" />
                            </div>
                            <p className="text-xs">Checking grammar...</p>
                            <p className="mt-1 text-xs text-slate-400">
                              AI is analyzing your text
                            </p>
                          </div>
                        ) : grammarErrors.length === 0 ? (
                          <div className="py-4 text-center text-slate-500">
                            <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-green-100">
                              <CheckCircle className="size-4 text-green-600" />
                            </div>
                            <p className="text-xs">No issues found</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Your writing looks great!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Error Summary */}
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(errorsByType).map(
                                ([type, typeErrors]) => (
                                  <Badge
                                    key={type}
                                    className={getErrorTypeColor(
                                      type as ErrorType
                                    )}
                                  >
                                    {getErrorTypeIcon(type as ErrorType)}{" "}
                                    {typeErrors.length} {type}
                                  </Badge>
                                )
                              )}
                            </div>

                            <Separator />

                            {/* Error List */}
                            <div className="max-h-64 space-y-2 overflow-y-auto">
                              {grammarErrors
                                .slice(0, 10)
                                .map((error, index) => (
                                  <div
                                    key={error.id}
                                    className="cursor-pointer rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => onGrammarErrorClick?.(error)}
                                  >
                                    <div className="mb-2 flex items-start justify-between">
                                      <Badge
                                        className={`${getErrorTypeColor(error.type)} text-xs`}
                                      >
                                        {getErrorTypeIcon(error.type)}{" "}
                                        {error.type}
                                      </Badge>
                                      <span className="text-xs text-slate-400">
                                        {error.start}-{error.end}
                                      </span>
                                    </div>

                                    <div className="mb-2">
                                      <p className="mb-1 text-xs text-slate-600">
                                        <span className="font-medium">
                                          Issue:
                                        </span>{" "}
                                        "{error.original}"
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {error.explanation}
                                      </p>
                                    </div>

                                    <div className="space-y-1">
                                      <p className="text-xs font-medium text-slate-700">
                                        Suggestions:
                                      </p>
                                      {error.suggestions
                                        .slice(0, 2)
                                        .map((suggestion, i) => (
                                          <Button
                                            key={i}
                                            variant="outline"
                                            size="sm"
                                            className="mr-1 h-6 px-2 text-xs"
                                            onClick={e => {
                                              e.stopPropagation()
                                              console.log(
                                                "Apply suggestion:",
                                                suggestion
                                              )
                                            }}
                                          >
                                            {suggestion}
                                          </Button>
                                        ))}
                                    </div>
                                  </div>
                                ))}

                              {grammarErrors.length > 10 && (
                                <div className="py-2 text-center">
                                  <p className="text-xs text-slate-500">
                                    Showing 10 of {grammarErrors.length}{" "}
                                    suggestions
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
