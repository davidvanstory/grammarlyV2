"use client"

import { useAuth } from "@clerk/nextjs"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("🏠 Home page loaded")
    console.log("🏠 User ID:", userId ? "AUTHENTICATED" : "NOT AUTHENTICATED")
    console.log("🏠 Auth loaded:", isLoaded)

    // Once auth is loaded, redirect based on authentication status
    if (isLoaded) {
      if (userId) {
        console.log("🏠 User authenticated, redirecting to documents")
        router.push("/documents")
      } else {
        console.log("🏠 User not authenticated, redirecting to login")
        router.push("/login")
      }
    }
  }, [userId, isLoaded, router])

  // Show loading state while auth is being determined or redirecting
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">HeyDoc</h1>
          <p className="mb-8 text-gray-600">
            Be confident your doctor's getting the full picture
          </p>
        </div>
        <div className="text-center text-gray-500">🔄 Loading...</div>
      </div>
    </div>
  )
}
