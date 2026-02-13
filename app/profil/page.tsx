import Profil from "@/src/components/Profil"
import { Leaf, Settings, User } from "lucide-react"

export default function ProfilPage() {
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
              <a href="/" className="text-slate-600 hover:text-slate-900">
                Home
              </a>
              <a href="/about" className="text-slate-600 hover:text-slate-900">
                About
              </a>
              <a href="/contact" className="text-slate-600 hover:text-slate-900">
                Contact
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <a
                href="/praeferenzen"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Präferenzen
              </a>
              <a
                href="/profil"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-teal-600 rounded-lg"
              >
                <User className="w-4 h-4" />
                Profil
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Profil />
      </div>
    </div>
  )
}
