"use client"

import { AuthDebug } from "@/components/auth-debug"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            🔧 Auth Debug Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Test and debug authentication flows
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🔐 Authentication Status</h2>
            <AuthDebug />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🧪 Test Navigation</h2>
            <div className="space-y-2">
              <Link href="/" className="block">
                <Button variant="outline" className="w-full justify-start">
                  🏠 Home Page
                </Button>
              </Link>

              <Link href="/login" className="block">
                <Button variant="outline" className="w-full justify-start">
                  🔐 Login Page
                </Button>
              </Link>

              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full justify-start">
                  📝 Signup Page
                </Button>
              </Link>

              <Link href="/todo" className="block">
                <Button variant="outline" className="w-full justify-start">
                  ✅ Todo (Protected)
                </Button>
              </Link>

              <Link href="/documents" className="block">
                <Button variant="outline" className="w-full justify-start">
                  📄 Documents (Protected)
                </Button>
              </Link>

              <Link href="/logout" className="block">
                <Button variant="destructive" className="w-full justify-start">
                  🚪 Force Logout & Clear Data
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">
            📋 Testing Instructions
          </h2>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-blue-50 p-3">
              <h3 className="font-medium text-blue-900">
                ✅ Normal Flow (Expected)
              </h3>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-blue-800">
                <li>Visit home page → See "❌ You are not signed in"</li>
                <li>
                  Click "Sign In" → Redirected to login page with Clerk form
                </li>
                <li>
                  Enter credentials → Redirected to /todo after successful login
                </li>
                <li>Visit home page → See "✅ You are signed in!"</li>
              </ol>
            </div>

            <div className="rounded-lg bg-orange-50 p-3">
              <h3 className="font-medium text-orange-900">🧹 Clear Session</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-orange-800">
                <li>Use "🚪 Sign Out" button above</li>
                <li>Or use "🧹 Clear Browser Storage" button</li>
                <li>Or open incognito/private window</li>
                <li>Or clear cookies manually in browser</li>
              </ul>
            </div>

            <div className="rounded-lg bg-green-50 p-3">
              <h3 className="font-medium text-green-900">
                🔒 Protected Routes
              </h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-green-800">
                <li>/todo and /documents require authentication</li>
                <li>Will redirect to /login if not signed in</li>
                <li>Will redirect to intended page after login</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
