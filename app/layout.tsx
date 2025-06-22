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
import { Montserrat } from "next/font/google"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap"
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
  let userId: string | null = null

  try {
    const authResult = await auth()
    userId = authResult.userId
  } catch (error) {
    console.error("Auth error in root layout:", error)
    // Continue without auth - let individual pages handle auth as needed
  }

  if (userId) {
    try {
      const profileRes = await getProfileByUserIdAction(userId)
      if (!profileRes.isSuccess) {
        await createProfileAction({ userId })
      }
    } catch (error) {
      console.error("Profile creation error:", error)
      // Continue even if profile creation fails
    }
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "bg-background mx-auto min-h-screen w-full scroll-smooth antialiased",
            montserrat.className
          )}
        >
          <Providers
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <PostHogUserIdentify />
            <PostHogPageview />

            {children}

            <TailwindIndicator />

            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
