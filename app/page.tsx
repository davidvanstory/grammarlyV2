"use server"

import { auth } from "@clerk/nextjs/server"
import Link from "next/link"

export default async function HomePage() {
  const { userId } = await auth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Med Writer</h1>
          <p className="mb-8 text-gray-600">
            AI-Powered Writing Assistant for Medical Students
          </p>
        </div>

        <div className="space-y-4">
          {userId ? (
            <>
              <div className="mb-4 text-center text-green-600">
                ✅ You are signed in!
              </div>
              <Link
                href="/todo"
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Go to Todo App
              </Link>
              <Link
                href="/documents"
                className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Go to Document Editor
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
