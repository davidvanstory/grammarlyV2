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
SIMPLIFIED VERSION - Updated to work with new simplified medical field structure (isPresent boolean instead of status).
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

  // Helper function to get field status color based on isPresent
  const getFieldStatusColor = (isPresent: boolean): string => {
    return isPresent
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200"
  }

  // Helper function to get field status icon
  const getFieldStatusIcon = (isPresent: boolean): string => {
    return isPresent ? "✅" : "❌"
  }

  // Helper function to get field status text
  const getFieldStatusText = (isPresent: boolean): string => {
    return isPresent ? "provided" : "missing"
  }

  // Group fields by status for overview
  const presentFields = analysis?.fieldsAnalyzed.filter(f => f.isPresent) || []
  const missingFields = analysis?.fieldsAnalyzed.filter(f => !f.isPresent) || []

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
                    {presentFields.length} of {analysis.fieldsAnalyzed.length}{" "}
                    fields provided
                  </p>

                  {/* Missing Fields Alert */}
                  {missingFields.length > 0 && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2">
                      <div className="flex items-center gap-1 text-xs font-medium text-red-800">
                        <AlertTriangle className="size-3" />
                        Information Missing
                      </div>
                      <p className="mt-1 text-xs text-red-700">
                        {missingFields.length} field
                        {missingFields.length > 1 ? "s" : ""} missing for
                        complete medical information
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
                    {presentFields.length > 0 && (
                      <Badge
                        className="border-green-200 bg-green-100 text-green-800"
                        variant="outline"
                      >
                        ✅ {presentFields.length} provided
                      </Badge>
                    )}
                    {missingFields.length > 0 && (
                      <Badge
                        className="border-red-200 bg-red-100 text-red-800"
                        variant="outline"
                      >
                        ❌ {missingFields.length} missing
                      </Badge>
                    )}
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
                        // Sort by status (missing first), then by field priority
                        const config_a = MEDICAL_FIELD_CONFIGS[a.type]
                        const config_b = MEDICAL_FIELD_CONFIGS[b.type]

                        if (a.isPresent !== b.isPresent) {
                          return a.isPresent ? 1 : -1 // missing fields first
                        }
                        return config_a.priority - config_b.priority
                      })
                      .map(field => {
                        const config = MEDICAL_FIELD_CONFIGS[field.type]
                        return (
                          <div
                            key={field.type}
                            className={`cursor-pointer rounded-lg border p-3 transition-all hover:shadow-sm ${getFieldStatusColor(field.isPresent)}`}
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
                                  className={`text-xs ${getFieldStatusColor(field.isPresent)}`}
                                >
                                  {getFieldStatusIcon(field.isPresent)}{" "}
                                  {getFieldStatusText(field.isPresent)}
                                </Badge>
                              </div>
                            </div>

                            {/* Detected Content */}
                            {field.detectedContent && field.isPresent && (
                              <div className="mb-2 rounded bg-white/50 p-2">
                                <p className="text-xs font-medium opacity-80">
                                  Found:
                                </p>
                                <p className="text-xs italic">
                                  "{field.detectedContent}"
                                </p>
                              </div>
                            )}

                            {/* Suggestion for missing fields */}
                            {!field.isPresent && (
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
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Missing fields:</span>
                    <span>{analysis.missingFields.length}</span>
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
