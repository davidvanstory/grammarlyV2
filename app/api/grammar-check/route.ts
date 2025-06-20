/*
<ai_context>
Grammar checking API endpoint for the Med Writer application.
Handles POST requests for AI-powered grammar checking.
</ai_context>
*/

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { checkGrammarAction } from "@/actions/ai/grammar-actions"
import { GrammarCheckRequest } from "@/types/grammar-types"

export async function POST(request: NextRequest) {
  console.log("🔍 Grammar check API endpoint called")

  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.log("❌ Unauthorized grammar check request")
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

    if (requestBody.text.length > 10000) {
      console.log("❌ Text too long:", requestBody.text.length)
      return NextResponse.json(
        { error: "Text is too long (max 10,000 characters)" },
        { status: 400 }
      )
    }

    // Create grammar check request
    const grammarRequest: GrammarCheckRequest = {
      text: requestBody.text,
      previousErrors: requestBody.previousErrors || [],
      forceRecheck: requestBody.forceRecheck || false
    }

    console.log("🤖 Calling grammar check action...")
    console.log("🔄 Force recheck:", grammarRequest.forceRecheck)

    // Call grammar check action
    const result = await checkGrammarAction(grammarRequest)

    if (result.isSuccess) {
      console.log("✅ Grammar check successful")
      console.log("📊 Found", result.data.errors.length, "errors")
      console.log("⏱️ Processing time:", result.data.processingTime, "ms")

      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data
      })
    } else {
      console.error("❌ Grammar check failed:", result.message)
      return NextResponse.json(
        {
          error: result.message,
          success: false
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("❌ Grammar check API error:", error)
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
  console.log("❌ GET request to grammar check endpoint")
  return NextResponse.json(
    { error: "Method not allowed. Use POST to check grammar." },
    { status: 405 }
  )
}

export async function PUT() {
  console.log("❌ PUT request to grammar check endpoint")
  return NextResponse.json(
    { error: "Method not allowed. Use POST to check grammar." },
    { status: 405 }
  )
}

export async function DELETE() {
  console.log("❌ DELETE request to grammar check endpoint")
  return NextResponse.json(
    { error: "Method not allowed. Use POST to check grammar." },
    { status: 405 }
  )
}
