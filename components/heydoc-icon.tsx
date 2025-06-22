/*
<ai_context>
HeyDoc brand icon component with HD initials and subtle stethoscope integration.
Features a circular design with medical color scheme.
</ai_context>
*/

"use client"

import { cn } from "@/lib/utils"

interface HeyDocIconProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export default function HeyDocIcon({
  size = "md",
  className
}: HeyDocIconProps) {
  console.log("🏥 Rendering HeyDoc icon with size:", size)

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-2xl"
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg",
        sizeClasses[size],
        className
      )}
    >
      {/* HD Text */}
      <div className={cn("font-bold text-white", textSizeClasses[size])}>
        HD
      </div>

      {/* Subtle stethoscope accent - top right */}
      <div className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-blue-500 opacity-70" />

      {/* Additional medical accent - bottom left */}
      <div className="absolute -bottom-0.5 -left-0.5 size-1.5 rounded-full bg-blue-400 opacity-50" />
    </div>
  )
}
