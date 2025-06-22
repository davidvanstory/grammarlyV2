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

        {/* Middle Section - Key Story and Value Props */}
        <div className="flex flex-1 items-center">
          <div className="grid max-w-4xl grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Left Column - Key Story */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
                <p className="font-montserrat text-lg leading-relaxed text-white/95 lg:text-xl">
                  For patients messaging their doctor,{" "}
                  <span className="font-semibold text-emerald-300">HeyDoc</span>{" "}
                  is the writing tool that enables better conversations using
                  AI.
                </p>
              </div>
            </div>

            {/* Right Column - Value Propositions */}
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-500/20 p-6 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <p className="font-montserrat text-lg font-medium text-white">
                    Make sure your doctor sees what matters
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-blue-500/20 p-6 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="size-2 rounded-full bg-blue-400" />
                  <p className="font-montserrat text-lg font-medium text-white">
                    Feel heard, even in writing
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-teal-500/20 p-6 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="size-2 rounded-full bg-teal-400" />
                  <p className="font-montserrat text-lg font-medium text-white">
                    Save time and reduce stress
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-cyan-500/20 p-6 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="size-2 rounded-full bg-cyan-400" />
                  <p className="font-montserrat text-lg font-medium text-white">
                    Know you've given all the information needed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Compact Login Form */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
              {/* Login Header */}
              <div className="mb-6 text-center">
                <h3 className="font-instrument-serif text-xl font-semibold text-slate-800">
                  Welcome back
                </h3>
                <p className="font-montserrat text-sm text-slate-600">
                  Sign in to continue
                </p>
              </div>

              {/* Clerk SignIn Component */}
              <SignIn
                forceRedirectUrl="/documents"
                appearance={{
                  baseTheme: theme === "dark" ? dark : undefined,
                  elements: {
                    formButtonPrimary:
                      "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-montserrat font-medium transition-all duration-200 shadow-lg",
                    card: "bg-transparent shadow-none border-0 p-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton:
                      "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-montserrat",
                    formFieldInput:
                      "border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 font-montserrat",
                    footerActionLink:
                      "text-emerald-600 hover:text-emerald-700 font-montserrat font-medium",
                    formFieldLabel: "font-montserrat text-slate-700",
                    dividerLine: "bg-slate-200",
                    dividerText: "text-slate-500 font-montserrat"
                  }
                }}
              />

              {/* Sign Up CTA */}
              <div className="mt-6 border-t border-slate-200 pt-4 text-center">
                <p className="font-montserrat text-sm text-slate-600">
                  New to HeyDoc?
                </p>
                <Link href="/signup" className="mt-2 block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-montserrat border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="absolute bottom-4 left-8 text-center">
          <p className="font-montserrat text-xs text-white/60">
            Professional healthcare communication assistance
          </p>
        </div>
      </div>
    </div>
  )
}
