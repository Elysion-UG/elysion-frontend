"use client"

import type React from "react"
import { useState } from "react"
import { Leaf, Settings, User } from "lucide-react"
import LoginModal from "./LoginModal"

interface PageLayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    e.preventDefault()
    window.location.href = `/${section}`
  }

  const handleSignInClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsLoginModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <Leaf className="w-8 h-8 text-teal-600" />
              <h1 className="text-2xl font-bold text-slate-800">Elysion</h1>
            </a>
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = "/"
                }}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Home
              </a>
              <a
                href="/about"
                onClick={(e) => handleNavClick(e, "about")}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                About
              </a>
              <a
                href="/contact"
                onClick={(e) => handleNavClick(e, "contact")}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Contact
              </a>

              <a
                href="/praeferenzen"
                onClick={(e) => handleNavClick(e, "praeferenzen")}
                className="flex items-center gap-1.5 text-teal-700 hover:text-teal-900 transition-colors font-medium"
              >
                <Settings className="w-4 h-4" />
                Präferenzen
              </a>
              <a
                href="/profil"
                onClick={(e) => handleNavClick(e, "profil")}
                className="flex items-center gap-1.5 text-teal-700 hover:text-teal-900 transition-colors font-medium"
              >
                <User className="w-4 h-4" />
                Profil
              </a>

              <a
                href="#"
                onClick={handleSignInClick}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Anmelden
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}
