"use client"

import { SignOutButton, useAuth, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

export function AuthDebug() {
  const { isSignedIn, userId, isLoaded } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🔄 Loading Auth...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>🔐 Auth Debug Panel</CardTitle>
        <CardDescription>Current authentication status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Status:</span>
            <span className={isSignedIn ? "text-green-600" : "text-red-600"}>
              {isSignedIn ? "✅ Signed In" : "❌ Signed Out"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">User ID:</span>
            <span className="font-mono text-sm">
              {userId ? userId.slice(0, 8) + "..." : "null"}
            </span>
          </div>

          {user && (
            <>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span className="text-sm">
                  {user.primaryEmailAddress?.emailAddress || "No email"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span className="text-sm">{user.fullName || "No name"}</span>
              </div>
            </>
          )}
        </div>

        {isSignedIn && (
          <div className="border-t pt-4">
            <SignOutButton>
              <Button variant="outline" className="w-full">
                🚪 Sign Out
              </Button>
            </SignOutButton>
          </div>
        )}

        <div className="border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.clear()
              sessionStorage.clear()
              console.log("🧹 Cleared browser storage")
            }}
            className="w-full"
          >
            🧹 Clear Browser Storage
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
