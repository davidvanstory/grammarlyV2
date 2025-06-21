"use client"

import {
  Heart,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Target
} from "lucide-react"
import { SelectDocument } from "@/db/schema/documents-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  MedicalInformation,
  MedicalField,
  MedicalFieldType,
  MedicalInfoSidebarProps
} from "@/types/medical-types"
import { MEDICAL_FIELD_CONFIGS } from "@/lib/medical-prompts"

/*
<ai_context>
Medical information sidebar component for the Med Writer application.
Displays completeness tracking for patient medical information when writing to doctors.
Shows which medical fields are missing, provided, or partial.
</ai_context>
*/

export default function MedicalInfoSidebar({
  analysis,
  isAnalyzing = false,
  onFieldClick,
  onRefresh
}: MedicalInfoSidebarProps) {
  console.log(
    "🏥 Rendering medical info sidebar with analysis:",
    analysis?.id || "None"
  )
  console.log(
    "📊 Overall completeness:",
    analysis?.overallCompleteness || 0,
    "%"
  )
  console.log("🔄 Is analyzing:", isAnalyzing)

  // Helper function to get field status color
  const getFieldStatusColor = (status: string): string => {
    switch (status) {
      case "provided":
        return "bg-green-100 text-green-800 border-green-200"
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "missing":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Helper function to get field status icon
  const getFieldStatusIcon = (status: string): string => {
    switch (status) {
      case "provided":
        return "✅"
      case "partial":
        return "⚠️"
      case "missing":
        return "❌"
      default:
        return "❓"
    }
  }

  // Helper function to get importance color
  const getImportanceColor = (importance: string): string => {
    switch (importance) {
      case "critical":
        return "text-red-600"
      case "important":
        return "text-orange-600"
      case "helpful":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  // Group fields by status for overview
  const fieldsByStatus =
    analysis?.fieldsAnalyzed.reduce(
      (acc, field) => {
        if (!acc[field.status]) {
          acc[field.status] = []
        }
        acc[field.status].push(field)
        return acc
      },
      {} as Record<string, MedicalField[]>
    ) || {}

  // Get completeness color based on percentage
  const getCompletenessColor = (percentage: number): string => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    if (percentage >= 40) return "text-orange-600"
    return "text-red-600"
  }

  // Get completeness description
  const getCompletenessDescription = (percentage: number): string => {
    if (percentage >= 90) return "Excellent medical detail"
    if (percentage >= 70) return "Good medical information"
    if (percentage >= 50) return "Basic information provided"
    if (percentage >= 25) return "Limited medical details"
    return "Missing key information"
  }

  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Heart className="size-5 text-red-600" />
            Medical Information
          </h2>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              size="sm"
              variant="outline"
              disabled={isAnalyzing}
              className="text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw
                className={`size-4 ${isAnalyzing ? "animate-spin" : ""}`}
              />
            </Button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Helps ensure complete patient information for doctors
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {!analysis ? (
            <div className="py-8 text-center text-slate-500">
              <Heart className="mx-auto mb-3 size-12 text-slate-300" />
              <p className="text-sm">No analysis available</p>
              <p className="mt-1 text-xs text-slate-400">
                Type your message to analyze medical information
              </p>
            </div>
          ) : (
            <>
              {/* Overall Completeness Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="size-4 text-red-600" />
                      Information Completeness
                    </div>
                    {isAnalyzing && (
                      <Clock className="size-4 animate-spin text-blue-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`text-2xl font-bold ${getCompletenessColor(analysis.overallCompleteness)}`}
                    >
                      {analysis.overallCompleteness}%
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        analysis.overallCompleteness >= 70
                          ? "border-green-200 text-green-800"
                          : "border-orange-200 text-orange-800"
                      }
                    >
                      {getCompletenessDescription(analysis.overallCompleteness)}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <Progress
                    value={analysis.overallCompleteness}
                    className="mb-2"
                  />

                  <p className="text-xs text-slate-500">
                    {
                      analysis.fieldsAnalyzed.filter(
                        f => f.status === "provided"
                      ).length
                    }{" "}
                    of {analysis.fieldsAnalyzed.length} fields provided
                  </p>

                  {/* Critical Missing Alert */}
                  {analysis.criticalMissing.length > 0 && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2">
                      <div className="flex items-center gap-1 text-xs font-medium text-red-800">
                        <AlertTriangle className="size-3" />
                        Critical Information Missing
                      </div>
                      <p className="mt-1 text-xs text-red-700">
                        {analysis.criticalMissing.length} critical field
                        {analysis.criticalMissing.length > 1 ? "s" : ""} missing
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Field Status Overview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Info className="size-4 text-blue-600" />
                    Field Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(fieldsByStatus).map(([status, fields]) => (
                      <Badge
                        key={status}
                        className={getFieldStatusColor(status)}
                        variant="outline"
                      >
                        {getFieldStatusIcon(status)} {fields.length} {status}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Field Analysis */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Heart className="size-4 text-red-600" />
                    Medical Fields
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {analysis.fieldsAnalyzed
                      .sort((a, b) => {
                        // Sort by importance, then by status (missing first)
                        const importanceOrder = {
                          critical: 0,
                          important: 1,
                          helpful: 2
                        }
                        const statusOrder = {
                          missing: 0,
                          partial: 1,
                          provided: 2
                        }

                        if (
                          importanceOrder[a.importance] !==
                          importanceOrder[b.importance]
                        ) {
                          return (
                            importanceOrder[a.importance] -
                            importanceOrder[b.importance]
                          )
                        }
                        return statusOrder[a.status] - statusOrder[b.status]
                      })
                      .map(field => {
                        const config = MEDICAL_FIELD_CONFIGS[field.type]
                        return (
                          <div
                            key={field.type}
                            className={`cursor-pointer rounded-lg border p-3 transition-all hover:shadow-sm ${getFieldStatusColor(field.status)}`}
                            onClick={() => onFieldClick?.(field)}
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{config.icon}</span>
                                <div>
                                  <h4 className="text-sm font-medium">
                                    {config.label}
                                  </h4>
                                  <p className="text-xs opacity-80">
                                    {field.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getFieldStatusColor(field.status)}`}
                                >
                                  {getFieldStatusIcon(field.status)}{" "}
                                  {field.status}
                                </Badge>
                                <span
                                  className={`text-xs font-medium ${getImportanceColor(field.importance)}`}
                                >
                                  {field.importance}
                                </span>
                              </div>
                            </div>

                            {/* Detected Content */}
                            {field.detectedContent && (
                              <div className="mb-2 rounded bg-white/50 p-2">
                                <p className="text-xs font-medium opacity-80">
                                  Found:
                                </p>
                                <p className="text-xs italic">
                                  "{field.detectedContent}"
                                </p>
                              </div>
                            )}

                            {/* Suggestion */}
                            {field.status !== "provided" && (
                              <div className="rounded bg-white/30 p-2">
                                <p className="text-xs font-medium opacity-80">
                                  Suggestion:
                                </p>
                                <p className="text-xs">{field.suggestion}</p>
                                {config.example && (
                                  <p className="mt-1 text-xs opacity-70">
                                    Example: {config.example}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Confidence Score */}
                            {field.confidence && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs opacity-60">
                                  Confidence:
                                </span>
                                <Progress
                                  value={field.confidence * 100}
                                  className="h-1 flex-1"
                                />
                                <span className="text-xs opacity-60">
                                  {Math.round(field.confidence * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Next Steps */}
              {analysis.recommendedNextSteps.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Target className="size-4 text-purple-600" />
                      Recommended Improvements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs text-slate-600">
                      {analysis.recommendedNextSteps.map((step, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="mt-2 size-1 shrink-0 rounded-full bg-purple-600" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analysis Metadata */}
              {analysis.lastAnalyzed && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Last analyzed:</span>
                    <span>
                      {new Intl.DateTimeFormat("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      }).format(analysis.lastAnalyzed)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Text length:</span>
                    <span>{analysis.textLength} characters</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
