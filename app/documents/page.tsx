"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getDocumentsByUserIdAction } from "@/actions/db/documents-actions"
import ThreePanelLayout from "./_components/three-panel-layout"
import DocumentsBanner from "./_components/documents-banner"
import { Skeleton } from "@/components/ui/skeleton"

/*
<ai_context>
Main document editor page for the Med Writer application.
Implements the three-panel layout with document list, editor, and grammar suggestions.
</ai_context>
*/

export default async function DocumentsPage() {
  console.log("📄 Loading documents page...")

  return (
    <div className="h-full">
      <Suspense fallback={<DocumentsPageSkeleton />}>
        <DocumentsPageContent />
      </Suspense>
    </div>
  )
}

async function DocumentsPageContent() {
  const { userId } = await auth()

  if (!userId) {
    console.log("❌ User not authenticated, redirecting to login")
    redirect("/login")
  }

  console.log("📄 Fetching documents for user:", userId)

  // Fetch user's documents
  const documentsResult = await getDocumentsByUserIdAction(userId)

  if (!documentsResult.isSuccess) {
    console.error("❌ Failed to fetch documents:", documentsResult.message)
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-slate-700">
            Unable to load documents
          </h2>
          <p className="text-slate-500">{documentsResult.message}</p>
        </div>
      </div>
    )
  }

  console.log("✅ Documents loaded successfully:", {
    count: documentsResult.data.length
  })

  return (
    <div className="flex h-full flex-col">
      {/* Top Banner */}
      <DocumentsBanner />

      {/* Three Panel Layout - takes remaining height */}
      <div className="min-h-0 flex-1">
        <ThreePanelLayout
          initialDocuments={documentsResult.data}
          userId={userId}
        />
      </div>
    </div>
  )
}

function DocumentsPageSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Banner skeleton */}
      <div className="flex h-14 w-full items-center border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>

      {/* Three panel layout skeleton */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar skeleton */}
        <div className="w-80 border-r border-slate-200 bg-white p-4">
          <Skeleton className="mb-4 h-8 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Center editor skeleton */}
        <div className="flex-1 p-6">
          <Skeleton className="mb-6 h-8 w-64" />
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>

        {/* Right sidebar skeleton */}
        <div className="w-80 border-l border-slate-200 bg-white p-4">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
