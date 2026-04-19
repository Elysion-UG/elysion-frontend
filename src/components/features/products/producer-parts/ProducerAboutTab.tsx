"use client"

import { ExternalLink, Globe, Mail } from "lucide-react"
import type { Producer } from "./producer-mock"

interface ProducerAboutTabProps {
  producer: Producer
}

export function ProducerAboutTab({ producer }: ProducerAboutTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Über {producer.name}</h2>
        <div className="prose max-w-none whitespace-pre-line text-slate-700">
          {producer.longDescription}
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Kontaktinformationen</h3>
        <div className="space-y-3">
          <a
            href={`mailto:${producer.email}`}
            className="flex items-center gap-3 text-slate-700 transition-colors hover:text-teal-600"
          >
            <Mail className="h-5 w-5" />
            {producer.email}
          </a>
          <a
            href={`https://${producer.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-slate-700 transition-colors hover:text-teal-600"
          >
            <Globe className="h-5 w-5" />
            {producer.website}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
