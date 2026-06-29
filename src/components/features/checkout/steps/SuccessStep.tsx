"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

interface SuccessStepProps {
  orderNumber: string | undefined
}

export function SuccessStep({ orderNumber }: SuccessStepProps) {
  return (
    <div className="mx-auto max-w-lg animate-fade-up py-16 text-center">
      <CheckCircle2 className="mx-auto mb-6 h-20 w-20 animate-bounce-subtle text-green-500" />
      <h1 className="mb-2 text-3xl font-bold text-slate-800">Bestellung aufgegeben!</h1>
      <p className="mb-1 text-slate-500">Bestellnummer</p>
      <p className="mb-8 text-2xl font-bold text-teal-700">#{orderNumber}</p>
      <p className="mb-8 text-slate-500">Du erhältst eine Bestätigung per E-Mail.</p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/orders"
          className="rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700"
        >
          Meine Bestellungen
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Weiter einkaufen
        </Link>
      </div>
    </div>
  )
}
