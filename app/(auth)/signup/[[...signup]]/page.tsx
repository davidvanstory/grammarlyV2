/*
<ai_context>
This client page provides the signup form from Clerk.
</ai_context>
*/

"use client"

import { SignUp } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import { useEffect } from "react"

export default function SignUpPage() {
  const { theme } = useTheme()

  useEffect(() => {
    console.log("📝 Signup page loaded")
    console.log("📝 Current theme:", theme)
  }, [theme])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Join Med Writer</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        <SignUp
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
