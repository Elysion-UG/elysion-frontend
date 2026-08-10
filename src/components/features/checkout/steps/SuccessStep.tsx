"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { buttonVariants } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

interface SuccessStepProps {
  orderNumber: string | undefined
}

export function SuccessStep({ orderNumber }: SuccessStepProps) {
  return (
    <div className="mx-auto max-w-lg animate-fade-up py-16 text-center">
      <CheckCircle2 className="mx-auto mb-6 h-20 w-20 animate-bounce-subtle text-green-500" />
      <h1 className="mb-2 text-3xl font-normal text-foreground">Bestellung aufgegeben!</h1>
      <p className="mb-1 text-muted-foreground">Bestellnummer</p>
      <p className="mb-8 text-2xl font-bold text-green-600">#{orderNumber}</p>
      <p className="mb-8 text-muted-foreground">Du erhältst eine Bestätigung per E-Mail.</p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/orders" className={cn(buttonVariants({ size: "lg" }), "px-6")}>
          Meine Bestellungen
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-6")}>
          Weiter einkaufen
        </Link>
      </div>
    </div>
  )
}
