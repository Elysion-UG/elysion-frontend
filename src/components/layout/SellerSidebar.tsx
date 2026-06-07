"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Package, TrendingUp, Award, DollarSign, User, Leaf, LogOut, X, Menu } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"

type Tab = "products" | "orders" | "certificates" | "settlements" | "profile"

const NAV_ITEMS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "products", label: "Produkte", icon: Package },
  { key: "orders", label: "Bestellungen", icon: TrendingUp },
  { key: "certificates", label: "Zertifikate", icon: Award },
  { key: "settlements", label: "Auszahlungen", icon: DollarSign },
  { key: "profile", label: "Profil", icon: User },
]

interface SellerSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

function SidebarContent({
  activeTab,
  onLogout,
  onNavClick,
}: {
  activeTab: Tab
  onLogout: () => void
  onNavClick?: () => void
}) {
  const { user } = useAuth()
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?"

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600">
          <Leaf className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-semibold text-white">Elysion</span>
          <p className="text-xs text-slate-400">Verkäufer-Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </p>
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key
          return (
            <Link
              key={key}
              href={`/seller-dashboard?tab=${key}`}
              onClick={onNavClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal-700 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Abmelden"
            className="shrink-0 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SellerSidebar({ mobileOpen, onMobileClose }: SellerSidebarProps) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as Tab) ?? "products"
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login/seller"
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent activeTab={activeTab} onLogout={handleLogout} />
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            <div className="relative h-full">
              <button
                onClick={onMobileClose}
                className="absolute right-3 top-4 z-10 rounded-md p-1 text-slate-400 hover:text-white"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent
                activeTab={activeTab}
                onLogout={handleLogout}
                onNavClick={onMobileClose}
              />
            </div>
          </aside>
        </>
      )}
    </>
  )
}

export function SellerMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      aria-label="Menü öffnen"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
