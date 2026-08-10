"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  FolderTree,
  ShoppingCart,
  CopyCheck,
  DollarSign,
  Award,
  Activity,
  LogOut,
  X,
  Menu,
} from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { BrandLogo } from "@/src/components/shared/BrandLogo"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Benutzer", icon: Users },
  { href: "/admin/sellers", label: "Verkäufer", icon: Store },
  { href: "/admin/products", label: "Produkte", icon: Package },
  { href: "/admin/categories", label: "Kategorien", icon: FolderTree },
  { href: "/admin/orders", label: "Bestellungen", icon: ShoppingCart },
  { href: "/admin/order-duplicates", label: "Duplikat-Prüfung", icon: CopyCheck },
  { href: "/admin/finance", label: "Finanzen", icon: DollarSign },
  { href: "/admin/certificates", label: "Zertifikate", icon: Award },
  { href: "/admin/monitoring", label: "Monitoring", icon: Activity },
]

interface AdminSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

function SidebarContent({
  activePath,
  onLogout,
  onNavClick,
}: {
  activePath: string
  onLogout: () => void
  onNavClick?: () => void
}) {
  const { user } = useAuth()
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?"

  return (
    <div className="flex h-full flex-col bg-ink-900 text-sand-page">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <BrandLogo variant="mark" inverted markSize={26} />
        <div>
          <span className="font-heading text-sm font-semibold tracking-[0.18em] text-sand-page">
            ELYSION
          </span>
          <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-widest text-green-500">
            Admin-Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-2 font-eyebrow text-[10px] font-semibold uppercase tracking-widest text-sand-page/40">
          Navigation
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin" ? activePath === "/admin" : activePath.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-green-500/15 text-green-500 shadow-[inset_0_0_0_1px_rgba(88,178,74,0.25)]"
                  : "text-sand-page/60 hover:bg-white/5 hover:text-sand-page"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive ? "text-green-500" : "text-sand-page/40"}`}
              />
              {label}
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/15 font-mono text-xs font-semibold text-green-500 ring-1 ring-green-600/40">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs font-medium text-sand-page/90">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-sand-page/50">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Abmelden"
            className="shrink-0 rounded-md p-1.5 text-sand-page/50 transition-colors hover:bg-white/5 hover:text-sand-page"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login/admin"
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent activePath={pathname} onLogout={handleLogout} />
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink-900/70 lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            <div className="relative h-full">
              <button
                onClick={onMobileClose}
                className="absolute right-3 top-4 z-10 rounded-md p-1 text-sand-page/60 hover:text-sand-page"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent
                activePath={pathname}
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

export function AdminMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md p-2 text-sand-page/60 hover:bg-white/5 hover:text-sand-page lg:hidden"
      aria-label="Menü öffnen"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
