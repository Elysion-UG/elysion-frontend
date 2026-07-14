"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/src/lib/utils"

interface BackButtonProps {
  label?: string
  className?: string
}

export function BackButton({ label = "Zurück", className }: BackButtonProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground hover:text-muted-foreground",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  )
}
