"use client"

import { useState } from "react"
import { ShieldAlert } from "lucide-react"
import LoginModal from "@/src/components/features/auth/LoginModal"

export function LoginRequired() {
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  return (
    <>
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <ShieldAlert className="h-16 w-16 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-800">Anmeldung erforderlich</h2>
        <p className="text-slate-500">Bitte melde dich an, um den Checkout fortzusetzen.</p>
        <button
          onClick={() => setLoginModalOpen(true)}
          className="mt-2 rounded-lg bg-teal-600 px-8 py-3 font-medium text-white transition-colors hover:bg-teal-700"
        >
          Jetzt anmelden
        </button>
      </div>
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  )
}
