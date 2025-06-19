"use server"

/*
<ai_context>
Main Med Writer application page - AI-powered writing assistant for medical students.
Features three-panel layout: document list, text editor, and suggestions panel.
</ai_context>
*/

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getDocumentsAction } from "@/actions/db/documents-actions"
import MedWriterDashboard from "./_components/med-writer-dashboard"
import MedWriterSkeleton from "./_components/med-writer-skeleton"

export default async function MedWriterPage() {
  console.log("Loading Med Writer page...")

  const { userId } = await auth()
  if (!userId) {
    console.log("User not authenticated, redirecting to login")
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">Med Writer</h1>
        <p className="text-lg text-gray-600">
          AI-Powered Writing Assistant for Medical Students
        </p>
      </div>

      <Suspense fallback={<MedWriterSkeleton />}>
        <MedWriterDashboardFetcher userId={userId} />
      </Suspense>
    </div>
  )
}

async function MedWriterDashboardFetcher({ userId }: { userId: string }) {
  console.log("Fetching documents for Med Writer dashboard...")
  const { data: documents, isSuccess } = await getDocumentsAction(userId)

  if (!isSuccess) {
    console.error("Failed to fetch documents for user:", userId)
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">
          Failed to load documents. Please try again.
        </p>
      </div>
    )
  }

  console.log("Successfully loaded documents count:", documents?.length || 0)
  return (
    <MedWriterDashboard initialDocuments={documents || []} userId={userId} />
  )
}
