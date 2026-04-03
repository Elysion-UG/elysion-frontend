"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  Award,
  Activity,
  ShieldCheck,
  LogOut,
  X,
  Menu,
} from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { AuthService } from "@/src/services/auth.service"

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
  { href: "/admin/orders", label: "Bestellungen", icon: ShoppingCart },
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
    <div className="flex h-full flex-col bg-slate-950 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-800/60 px-5 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyber-600 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-mono text-sm font-semibold tracking-wider text-white">Elysion</span>
          <p className="font-mono text-[10px] tracking-widest text-cyber-500">ADMIN-PORTAL</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Navigation
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/admin" ? activePath === "/admin" : activePath.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-cyber-900/60 text-cyber-300 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.2)]"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive ? "text-cyber-400" : "text-slate-500"}`}
              />
              {label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyber-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800/60 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyber-900 font-mono text-xs font-semibold text-cyber-300 ring-1 ring-cyber-700/50">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs font-medium text-slate-200">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Abmelden"
            className="shrink-0 rounded-md p-1.5 text-slate-600 transition-colors hover:bg-slate-800 hover:text-slate-300"
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
  const router = useRouter()

  const handleLogout = async () => {
    await AuthService.logout()
    router.push("/login/admin")
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
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            <div className="relative h-full">
              <button
                onClick={onMobileClose}
                className="absolute right-3 top-4 z-10 rounded-md p-1 text-slate-500 hover:text-slate-300"
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
      className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden"
      aria-label="Menü öffnen"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
