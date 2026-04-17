"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type ConsentStatus = "pending" | "accepted" | "declined"

interface CookieConsentContextValue {
  /** Whether the user has accepted functional cookies (localStorage etc.) */
  functionalAccepted: boolean
  status: ConsentStatus
  /** False during SSR / first render — banner must not show until true */
  isHydrated: boolean
  accept: () => void
  decline: () => void
}

const STORAGE_KEY = "elysion_cookie_consent"

const CookieConsentContext = createContext<CookieConsentContextValue>({
  functionalAccepted: false,
  status: "pending",
  isHydrated: false,
  accept: () => {},
  decline: () => {},
})

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConsentStatus>("pending")
  const [isHydrated, setIsHydrated] = useState(false)

  // Read persisted decision on mount — use sessionStorage for this flag
  // (it is a technical necessity to remember the answer within a session)
  useEffect(() => {
    // SSR-safe hydration from sessionStorage — must run after mount.
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored === "accepted" || stored === "declined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus(stored)
    }
    setIsHydrated(true)
  }, [])

  const accept = () => {
    sessionStorage.setItem(STORAGE_KEY, "accepted")
    setStatus("accepted")
  }

  const decline = () => {
    sessionStorage.setItem(STORAGE_KEY, "declined")
    setStatus("declined")
  }

  return (
    <CookieConsentContext.Provider
      value={{ functionalAccepted: status === "accepted", status, isHydrated, accept, decline }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent(): CookieConsentContextValue {
  return useContext(CookieConsentContext)
}
