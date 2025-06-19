"use server"

/*
<ai_context>
Layout for the Med Writer application with medical-themed styling and proper navigation.
</ai_context>
*/

import Header from "@/components/header"

export default async function MedWriterLayout({
  children
}: {
  children: React.ReactNode
}) {
  console.log("Loading Med Writer layout...")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <main className="pt-16">{children}</main>
    </div>
  )
}
