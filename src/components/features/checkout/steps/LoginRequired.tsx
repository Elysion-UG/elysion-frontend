"use client"

import { useState } from "react"
import { ShieldAlert } from "lucide-react"
import LoginModal from "@/src/components/features/auth/LoginModal"
import { Button } from "@/src/components/ui/button"

export function LoginRequired() {
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  return (
    <>
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <ShieldAlert className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Anmeldung erforderlich</h2>
        <p className="text-muted-foreground">Bitte melde dich an, um den Checkout fortzusetzen.</p>
        <Button size="lg" onClick={() => setLoginModalOpen(true)} className="mt-2">
          Jetzt anmelden
        </Button>
      </div>
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  )
}
