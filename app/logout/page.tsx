"use client"

import { SignOutButton, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LogoutPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const [isClearing, setIsClearing] = useState(false)

  const clearAllData = () => {
    setIsClearing(true)
    console.log("🧹 Clearing all authentication data...")

    // Clear all localStorage
    localStorage.clear()

    // Clear all sessionStorage
    sessionStorage.clear()

    // Clear all cookies by setting them to expire
    document.cookie.split(";").forEach(c => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.substr(0, eqPos) : c
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      document.cookie =
        name +
        "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." +
        window.location.hostname
    })

    console.log("✅ All data cleared")

    setTimeout(() => {
      setIsClearing(false)
      router.push("/")
    }, 2000)
  }

  useEffect(() => {
    console.log("🚪 Logout page loaded")
    console.log("🚪 Is signed in:", isSignedIn)
  }, [isSignedIn])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>🔄 Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🚪 Sign Out & Clear Data</CardTitle>
            <CardDescription>
              Remove all authentication data and sign out completely
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSignedIn ? (
              <>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-sm text-green-800">
                    ✅ Currently signed in - Ready to sign out
                  </p>
                </div>

                <div className="space-y-3">
                  <SignOutButton>
                    <Button className="w-full" variant="destructive">
                      🚪 Sign Out (Clerk)
                    </Button>
                  </SignOutButton>

                  <Button
                    onClick={clearAllData}
                    disabled={isClearing}
                    variant="outline"
                    className="w-full"
                  >
                    {isClearing
                      ? "🧹 Clearing..."
                      : "🧹 Clear All Data & Redirect"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-sm text-blue-800">✅ Already signed out</p>
                </div>

                <Button
                  onClick={clearAllData}
                  disabled={isClearing}
                  variant="outline"
                  className="w-full"
                >
                  {isClearing
                    ? "🧹 Clearing..."
                    : "🧹 Clear All Data & Go Home"}
                </Button>
              </>
            )}

            <div className="border-t pt-4">
              <h3 className="mb-2 font-medium">Manual Steps:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Open browser DevTools (F12)</li>
                <li>• Go to Application/Storage tab</li>
                <li>• Clear all cookies and localStorage</li>
                <li>• Or use incognito/private window</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
