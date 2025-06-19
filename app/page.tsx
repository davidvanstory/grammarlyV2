"use server"

/*
<ai_context>
Landing page that redirects users to the Med Writer application.
This serves as the entry point for the application.
</ai_context>
*/

import { redirect } from "next/navigation"

export default async function HomePage() {
  console.log("Landing page accessed, redirecting to Med Writer...")
  redirect("/med-writer")
}
