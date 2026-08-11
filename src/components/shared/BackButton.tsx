"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

interface BackButtonProps {
  label?: string
  className?: string
}

export function BackButton({ label = "Zurück", className }: BackButtonProps) {
  const router = useRouter()

  return (
    <Button
      variant="link"
      onClick={() => router.back()}
      className={cn("h-auto px-0 text-sm text-muted-foreground", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
