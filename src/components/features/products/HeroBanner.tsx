"use client"

import type React from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

interface HeroBannerProps {
  onScrollToShop: () => void
}

export default function HeroBanner({ onScrollToShop }: HeroBannerProps) {
  return (
    <div className="relative mb-8 animate-fade-up overflow-hidden rounded-2xl border border-border bg-secondary px-8 py-10 sm:py-14">
      {/* Decorative background circles */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-green-50/50" />
      <div className="pointer-events-none absolute -bottom-10 right-24 h-40 w-40 rounded-full bg-sand-page/40" />

      <div className="relative max-w-lg">
        <span className="mb-3 inline-block font-eyebrow text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Nachhaltiger Marktplatz
        </span>
        <h1 className="animate-fade-up-1 mb-4 text-4xl font-normal leading-tight text-foreground sm:text-5xl">
          Einkaufen mit
          <br />
          gutem Gewissen
        </h1>
        <p className="animate-fade-up-2 mb-6 max-w-sm text-base leading-relaxed text-muted-foreground">
          Produkte, die fair hergestellt, zertifiziert und für die Zukunft gedacht sind.
        </p>
        <div className="animate-fade-up-3 flex flex-wrap gap-3">
          <Button onClick={onScrollToShop} className="px-5">
            Jetzt entdecken
          </Button>
          <Link href="/about" className={cn(buttonVariants({ variant: "outline" }), "px-5")}>
            Mehr erfahren
          </Link>
        </div>
      </div>
    </div>
  )
}
