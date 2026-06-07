"use client"

import type React from "react"
import Link from "next/link"

interface HeroBannerProps {
  onScrollToShop: () => void
}

export default function HeroBanner({ onScrollToShop }: HeroBannerProps) {
  return (
    <div className="relative mb-8 animate-fade-up overflow-hidden rounded-2xl border border-sage-100 bg-gradient-to-br from-sage-50 via-white to-bark-50 px-8 py-10 sm:py-14">
      {/* Decorative background circles */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sage-100/40" />
      <div className="pointer-events-none absolute -bottom-10 right-24 h-40 w-40 rounded-full bg-bark-100/30" />

      <div className="relative max-w-lg">
        <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-sage-600">
          Nachhaltiger Marktplatz
        </span>
        <h1 className="animate-fade-up-1 mb-4 text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">
          Einkaufen mit
          <br />
          gutem Gewissen
        </h1>
        <p className="animate-fade-up-2 mb-6 max-w-sm text-base leading-relaxed text-stone-500">
          Produkte, die fair hergestellt, zertifiziert und für die Zukunft gedacht sind.
        </p>
        <div className="animate-fade-up-3 flex flex-wrap gap-3">
          <button
            onClick={onScrollToShop}
            className="rounded-xl bg-sage-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sage-700"
          >
            Jetzt entdecken
          </button>
          <Link
            href="/about"
            className="rounded-xl border border-bark-300 px-5 py-2.5 text-sm font-semibold text-bark-700 transition-colors hover:bg-bark-50"
          >
            Mehr erfahren
          </Link>
        </div>
      </div>
    </div>
  )
}
