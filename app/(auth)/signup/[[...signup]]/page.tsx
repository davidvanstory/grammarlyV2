/*
<ai_context>
HeyDoc signup page with professional medical design matching the login page.
Features consistent branding, medical color palette, and Montserrat typography.
</ai_context>
*/

"use client"

import { SignUp } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import { useEffect } from "react"
import HeyDocIcon from "@/components/heydoc-icon"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpPage() {
  const { theme } = useTheme()

  useEffect(() => {
    console.log("📝 HeyDoc signup page loaded")
    console.log("📝 Current theme:", theme)
  }, [theme])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-emerald-50 to-teal-50 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          {/* HD Icon */}
          <div className="mb-6 flex justify-center">
            <HeyDocIcon size="xl" />
          </div>

          {/* Title */}
          <h1 className="mb-3 text-4xl font-bold text-slate-800">HeyDoc</h1>

          {/* Tagline */}
          <p className="mb-8 text-lg text-slate-600">
            Making messaging your doctor easy
          </p>
        </div>

        {/* Signup Form Container */}
        <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-xl font-semibold text-slate-800">
              Get started today
            </h2>
            <p className="text-sm text-slate-600">
              Create your account to start communicating better with your
              healthcare providers
            </p>
          </div>

          <SignUp
            forceRedirectUrl="/documents"
            appearance={{
              baseTheme: theme === "dark" ? dark : undefined,
              elements: {
                formButtonPrimary:
                  "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium transition-all duration-200",
                card: "bg-transparent shadow-none border-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors",
                formFieldInput:
                  "border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20",
                footerActionLink:
                  "text-emerald-600 hover:text-emerald-700 font-medium"
              }
            }}
          />

          {/* Additional CTA */}
          <div className="mt-6 border-t border-slate-200 pt-6 text-center">
            <p className="mb-3 text-sm text-slate-600">
              Already have an account?
            </p>
            <Link href="/login">
              <Button
                variant="outline"
                className="w-full border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Professional healthcare communication assistance
          </p>
        </div>
      </div>
    </div>
  )
}
