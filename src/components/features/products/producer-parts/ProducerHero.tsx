"use client"

import Image from "next/image"
import { ArrowLeft } from "lucide-react"

interface ProducerHeroProps {
  image: string
  alt: string
  onBack: () => void
}

export function ProducerHero({ image, alt, onBack }: ProducerHeroProps) {
  return (
    <div className="relative h-64 md:h-80">
      <Image
        src={image || "/placeholder.svg"}
        alt={alt}
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <button
        onClick={onBack}
        className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-white transition-colors hover:bg-black/50"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </button>
    </div>
  )
}
