/*
<ai_context>
The root server layout for the app.
</ai_context>
*/

import {
  createProfileAction,
  getProfileByUserIdAction
} from "@/actions/db/profiles-actions"
import { Toaster } from "@/components/ui/toaster"
import { PostHogPageview } from "@/components/utilities/posthog/posthog-pageview"
import { PostHogUserIdentify } from "@/components/utilities/posthog/posthog-user-identity"
import { Providers } from "@/components/utilities/providers"
import { TailwindIndicator } from "@/components/utilities/tailwind-indicator"
import { cn } from "@/lib/utils"
import { ClerkProvider } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { Montserrat, Instrument_Serif } from "next/font/google"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat"
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-instrument-serif"
})

export const metadata: Metadata = {
  title: "HeyDoc - Making messaging your doctor easy",
  description:
    "A professional writing assistant that helps patients communicate with healthcare providers."
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  console.log("🔧 Root layout loading")

  const { userId } = await auth()
  console.log("🔐 User ID from auth:", userId)

  // Create or get user profile for authenticated users
  if (userId) {
    console.log("🔍 Fetching user profile for user:", userId)
    const profileResult = await getProfileByUserIdAction(userId)

    if (!profileResult.isSuccess || !profileResult.data) {
      console.log("📝 Creating new profile for user:", userId)
      await createProfileAction({
        userId
      })
    } else {
      console.log("✅ Profile found for user:", profileResult.data.userId)
    }
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <PostHogPageview />
        </head>
        <body
          className={cn(
            montserrat.variable,
            instrumentSerif.variable,
            "bg-background min-h-screen font-sans antialiased"
          )}
        >
          <Providers>
            {children}
            <Toaster />
            <TailwindIndicator />
            <PostHogUserIdentify />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
