"use client"

/*
<ai_context>
Loading skeleton component for Med Writer dashboard showing three-panel layout structure.
</ai_context>
*/

import { Skeleton } from "@/components/ui/skeleton"

export default function MedWriterSkeleton() {
  console.log("Rendering Med Writer skeleton...")

  return (
    <div className="grid h-[800px] grid-cols-12 gap-6">
      {/* Left Sidebar Skeleton - Document List */}
      <div className="col-span-3 rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4">
          <Skeleton className="mb-4 h-10 w-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor Skeleton */}
      <div className="col-span-6 rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4">
          <Skeleton className="mb-4 h-8 w-1/2" />
          <Skeleton className="mb-4 h-6 w-1/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      {/* Right Sidebar Skeleton - Suggestions */}
      <div className="col-span-3 rounded-lg bg-white p-6 shadow-lg">
        <Skeleton className="mb-4 h-6 w-3/4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3">
              <Skeleton className="mb-2 h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
