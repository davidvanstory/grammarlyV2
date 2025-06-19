"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

/*
<ai_context>
Layout for the document editor section of the Med Writer application.
Provides authentication protection and consistent styling for the document editor interface.
</ai_context>
*/

export default async function DocumentsLayout({
  children
}: {
  children: React.ReactNode
}) {
  console.log("📄 Loading documents layout...")

  // Ensure user is authenticated
  const { userId } = await auth()

  if (!userId) {
    console.log("❌ User not authenticated, redirecting to login")
    redirect("/login")
  }

  console.log("✅ User authenticated for documents:", userId)

  return (
    <div className="h-screen bg-slate-50 text-slate-900">
      {/* Medical-themed background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100 opacity-50" />

      {/* Main content */}
      <div className="relative h-full">{children}</div>
    </div>
  )
}
