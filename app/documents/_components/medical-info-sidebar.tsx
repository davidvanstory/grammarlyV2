"use client"

import { Heart, RefreshCw, Clock } from "lucide-react"
import { SelectDocument } from "@/db/schema/documents-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
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
SIMPLIFIED VERSION - Clean, compact view showing only essential field status.
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

  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <Heart className="size-4 text-red-600" />
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
                className={`size-3 ${isAnalyzing ? "animate-spin" : ""}`}
              />
            </Button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Quick view of patient information completeness
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-3">
          {!analysis ? (
            <div className="py-6 text-center text-slate-500">
              <Heart className="mx-auto mb-2 size-8 text-slate-300" />
              <p className="text-sm">No analysis available</p>
              <p className="mt-1 text-xs text-slate-400">
                Type your message to analyze medical information
              </p>
            </div>
          ) : (
            <div className="space-y-2">
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
                      className={`cursor-pointer rounded border p-2 transition-all hover:shadow-sm ${
                        field.isPresent
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                      onClick={() => onFieldClick?.(field)}
                    >
                      {/* Field name and status */}
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

                      {/* Question and example - only show for missing fields */}
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

              {/* Analysis timestamp */}
              {analysis.lastAnalyzed && (
                <div className="mt-4 text-center text-xs text-slate-400">
                  Last analyzed:{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    hour: "2-digit",
                    minute: "2-digit"
                  }).format(analysis.lastAnalyzed)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
