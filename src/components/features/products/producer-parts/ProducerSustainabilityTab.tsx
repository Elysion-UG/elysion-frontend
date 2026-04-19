"use client"

import {
  getSustainabilityLabel,
  MOCK_SUSTAINABILITY_BREAKDOWN,
  type Producer,
} from "./producer-mock"

interface ProducerSustainabilityTabProps {
  producer: Producer
}

export function ProducerSustainabilityTab({ producer }: ProducerSustainabilityTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Nachhaltigkeitsversprechen</h2>
        <p className="mb-6 text-slate-700">
          {producer.name} setzt sich für nachhaltige und ethische Praktiken in allen
          Geschäftsbereichen ein. Hier sind die Nachhaltigkeitsattribute, die wir erfüllen:
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {producer.sustainabilityAttributes.map((attribute) => (
          <div key={attribute} className="rounded-lg bg-slate-100 p-6">
            <div className="mb-3 flex items-center gap-4">
              <h3 className="text-lg font-semibold text-slate-800">
                {getSustainabilityLabel(attribute)}
              </h3>
            </div>
            <p className="text-slate-700">
              {producer.name} erfüllt strenge Standards für {getSustainabilityLabel(attribute)}, um
              sicherzustellen, dass unsere Produkte und Praktiken zu einer nachhaltigeren Zukunft
              beitragen.
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          Nachhaltigkeits-Score Aufschlüsselung
        </h3>
        <div className="space-y-4">
          {MOCK_SUSTAINABILITY_BREAKDOWN.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-700">{item.label}</span>
                <span className="font-medium text-slate-800">{item.score}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all"
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
