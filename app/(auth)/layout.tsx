/*
<ai_context>
This server layout provides the structure for HeyDoc authentication pages.
Allows full-screen layouts for the new hero design.
</ai_context>
*/

"use server"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  console.log("🔐 Loading HeyDoc auth layout...")

  return <div className="min-h-screen">{children}</div>
}
