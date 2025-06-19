"use server"

/*
<ai_context>
Basic pricing page to avoid 404 errors. 
This page is referenced from the todo page when users have free membership.
</ai_context>
*/

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

export default async function PricingPage() {
  console.log("Loading pricing page...")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600">
          Access premium features with our Pro plan
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        {/* Free Plan */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="text-3xl font-bold">
              $0<span className="text-lg font-normal">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="mb-6 space-y-3">
              <li className="flex items-center gap-2">
                <Check className="size-5 text-green-500" />
                <span>Access to Med Writer</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-green-500" />
                <span>Basic document management</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-green-500" />
                <span>Readability scoring</span>
              </li>
            </ul>
            <Link href="/med-writer">
              <Button variant="outline" className="w-full">
                Continue with Free
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-2 border-blue-500">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-blue-500 px-4 py-1 text-sm font-medium text-white">
              Most Popular
            </span>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Pro</CardTitle>
            <CardDescription>For advanced features</CardDescription>
            <div className="text-3xl font-bold">
              $9<span className="text-lg font-normal">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="mb-6 space-y-3">
              <li className="flex items-center gap-2">
                <Check className="size-5 text-green-500" />
                <span>Everything in Free</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-green-500" />
                <span>Access to Todo features</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-green-500" />
                <span>Advanced grammar checking</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-green-500" />
                <span>Priority support</span>
              </li>
            </ul>
            <Button className="w-full bg-blue-500 hover:bg-blue-600">
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Link href="/med-writer">
          <Button variant="ghost">← Back to Med Writer</Button>
        </Link>
      </div>
    </div>
  )
}
