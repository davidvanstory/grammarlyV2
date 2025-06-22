"use client"

import HeyDocIcon from "@/components/heydoc-icon"

/*
<ai_context>
Documents page banner component for the HeyDoc application.
Displays the HeyDoc icon and app name in a clean, compact banner that sits above the three-panel layout.
Uses the medical color scheme matching the HeyDoc icon branding.
</ai_context>
*/

export default function DocumentsBanner() {
  console.log("🏥 Rendering documents banner with HeyDoc branding")

  return (
    <div className="flex h-14 w-full items-center border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 shadow-sm">
      {/* Left side - HeyDoc icon and app name */}
      <div className="flex items-center gap-3">
        <HeyDocIcon size="sm" className="shrink-0" />
        <h1 className="text-xl font-semibold text-slate-800">HeyDoc</h1>
      </div>

      {/* Rest of banner stays clean and empty */}
      <div className="flex-1" />
    </div>
  )
}
