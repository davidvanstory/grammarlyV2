/*
<ai_context>
HeyDoc login page with full-screen hero background, artful content placement,
and compact login form. Features woman smiling while texting design.
</ai_context>
*/

"use client"

import { SignIn } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import { useEffect } from "react"
import HeyDocIcon from "@/components/heydoc-icon"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LoginPage() {
  const { theme } = useTheme()

  useEffect(() => {
    console.log("🔐 HeyDoc login page loaded with new design")
    console.log("🔐 Current theme:", theme)
    console.log("🎨 Full-screen hero layout initialized")
  }, [theme])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Full-Screen Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/woman-texting-hero.jpg')"
        }}
      />

      {/* Professional Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-emerald-900/60" />
      <div className="absolute inset-0 bg-black/20" />

      {/* Content Layer */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between p-8 lg:p-12">
        {/* Top Section - Logo and Main Tagline */}
        <div className="flex items-start justify-between">
          <div className="max-w-md">
            {/* HeyDoc Logo */}
            <div className="mb-6 flex items-center">
              <HeyDocIcon size="lg" />
              <h1 className="font-instrument-serif ml-3 text-3xl font-bold text-white">
                HeyDoc
              </h1>
            </div>

            {/* Main Tagline */}
            <h2 className="font-instrument-serif text-4xl font-bold leading-tight text-white lg:text-5xl">
              Better conversations start with better messages
            </h2>
          </div>
        </div>

        {/* Middle Section - Key Story */}
        <div className="flex flex-1 items-start pt-16">
          <div className="max-w-2xl">
            <div className="rounded-2xl bg-white/10 p-7 backdrop-blur-[6px]">
              <p className="font-montserrat text-lg leading-relaxed text-white/95 lg:text-xl">
                For patients messaging their doctor,
              </p>
              <p className="font-montserrat text-lg leading-relaxed text-white/95 lg:text-xl">
                <span className="font-semibold text-emerald-300">HeyDoc</span>{" "}
                is the writing tool
              </p>
              <p className="font-montserrat text-lg leading-relaxed text-white/95 lg:text-xl">
                that enables better conversations using AI.
              </p>
            </div>
          </div>
        </div>

        {/* Clerk SignIn Component - Top Right */}
        <div className="absolute right-8 top-8 z-20">
          <SignIn
            forceRedirectUrl="/documents"
            appearance={{
              baseTheme: theme === "dark" ? dark : undefined,
              elements: {
                formButtonPrimary:
                  "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-montserrat font-medium transition-all duration-200 shadow-lg text-sm py-2 px-4",
                card: "bg-white shadow-xl border border-white/20 rounded-xl p-4 max-w-xs",
                headerTitle:
                  "text-lg font-semibold text-slate-800 font-montserrat mb-2",
                headerSubtitle: "text-sm text-slate-600 font-montserrat mb-4",
                socialButtonsBlockButton:
                  "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-montserrat text-sm py-2 px-3",
                formFieldInput:
                  "border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 font-montserrat text-sm py-2 px-3",
                footerActionLink:
                  "text-emerald-600 hover:text-emerald-700 font-montserrat font-medium text-sm",
                formFieldLabel: "font-montserrat text-slate-700 text-sm mb-1",
                dividerLine: "bg-slate-200 my-3",
                dividerText: "text-slate-500 font-montserrat text-sm",
                formFieldRow: "mb-3",
                socialButtonsBlockButtonText: "text-sm",
                formButtonReset: "text-sm"
              }
            }}
          />
        </div>

        {/* Unified Value Proposition */}
        <div className="absolute left-1/2 top-[75%] -translate-x-1/2 -translate-y-1/2">
          <div className="rounded-lg bg-emerald-500/20 px-4 py-2 backdrop-blur-sm">
            <p className="font-montserrat text-sm font-medium text-white">
              feel heard, save time, and know you doctor's getting the full
              picture
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
