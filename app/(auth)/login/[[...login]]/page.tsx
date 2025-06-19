/*
<ai_context>
This client page provides the login form from Clerk.
</ai_context>
*/

"use client"

import { SignIn } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import { useEffect } from "react"

export default function LoginPage() {
  const { theme } = useTheme()

  useEffect(() => {
    console.log("🔐 Login page loaded")
    console.log("🔐 Current theme:", theme)
  }, [theme])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to Med Writer
          </h1>
          <p className="text-gray-600">Please sign in to your account</p>
        </div>

        <SignIn
          forceRedirectUrl="/documents"
          appearance={{
            baseTheme: theme === "dark" ? dark : undefined,
            elements: {
              formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
              card: "shadow-lg"
            }
          }}
        />
      </div>
    </div>
  )
}
