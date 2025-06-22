/*
<ai_context>
Medical summary API endpoint for the Med Writer application.
Handles POST requests for AI-powered medical summary generation for doctor communications.
"Summarize for Dr." feature implementation.
</ai_context>
*/

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { generateMedicalSummaryAction } from "@/actions/ai/medical-actions"
import { MedicalSummaryRequest } from "@/types/medical-types"

export async function POST(request: NextRequest) {
  console.log("🏥 Medical summary API endpoint called")

  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.log("❌ Unauthorized medical summary request")
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    console.log("✅ Authenticated user:", userId)

    // Parse request body
    let requestBody: any
    try {
      requestBody = await request.json()
      console.log("📝 Request body parsed successfully")
      console.log("📊 Text length:", requestBody.text?.length || 0)
      console.log("🔍 Has medical analysis:", !!requestBody.medicalAnalysis)
    } catch (error) {
      console.error("❌ Failed to parse request body:", error)
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    // Validate request structure
    if (!requestBody.text || typeof requestBody.text !== "string") {
      console.log("❌ Invalid or missing text in request")
      return NextResponse.json(
        { error: "Text field is required and must be a string" },
        { status: 400 }
      )
    }

    if (requestBody.text.length === 0) {
      console.log("❌ Empty text provided")
      return NextResponse.json(
        { error: "Text cannot be empty" },
        { status: 400 }
      )
    }

    if (requestBody.text.length > 5000) {
      console.log("❌ Text too long:", requestBody.text.length)
      return NextResponse.json(
        { error: "Text is too long (max 5,000 characters)" },
        { status: 400 }
      )
    }

    // Create medical summary request
    const summaryRequest: MedicalSummaryRequest = {
      text: requestBody.text,
      medicalAnalysis: requestBody.medicalAnalysis || undefined,
      documentId: requestBody.documentId || undefined
    }

    console.log("🤖 Calling medical summary action...")
    console.log("📊 Request details:", {
      textLength: summaryRequest.text.length,
      hasMedicalAnalysis: !!summaryRequest.medicalAnalysis,
      documentId: summaryRequest.documentId || "none"
    })

    // Call medical summary action
    const result = await generateMedicalSummaryAction(summaryRequest)

    if (result.isSuccess) {
      console.log("✅ Medical summary generation successful")
      console.log("📊 Summary word count:", result.data.wordCount)
      console.log("⏱️ Processing time:", result.data.processingTime, "ms")
      console.log(
        "📝 Summary preview:",
        result.data.summary.substring(0, 100) + "..."
      )

      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data
      })
    } else {
      console.error("❌ Medical summary generation failed:", result.message)
      return NextResponse.json(
        {
          error: result.message,
          success: false
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("❌ Medical summary API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        success: false
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  console.log("❌ GET request to medical summary endpoint")
  return NextResponse.json(
    { error: "Method not allowed. Use POST to generate medical summary." },
    { status: 405 }
  )
}

export async function PUT() {
  console.log("❌ PUT request to medical summary endpoint")
  return NextResponse.json(
    { error: "Method not allowed. Use POST to generate medical summary." },
    { status: 405 }
  )
}

export async function DELETE() {
  console.log("❌ DELETE request to medical summary endpoint")
  return NextResponse.json(
    { error: "Method not allowed. Use POST to generate medical summary." },
    { status: 405 }
  )
}
