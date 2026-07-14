"use client"

import { useState, useEffect, useCallback } from "react"
import { useEffectEvent } from "@/src/hooks/use-effect-event"
import Link from "next/link"
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  Award,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  DollarSign,
  Activity,
} from "lucide-react"
import type { AdminDashboardData } from "@/src/types"
import { AdminService } from "@/src/services/admin.service"
import { toast } from "sonner"

type AccentColor = "cyber" | "emerald" | "amber" | "indigo"

const ACCENT_COLORS: Record<AccentColor, { icon: string; glow: string; ring: string }> = {
  cyber: {
    icon: "text-green-500",
    glow: "",
    ring: "ring-green-500/30",
  },
  emerald: {
    icon: "text-green-500",
    glow: "",
    ring: "ring-green-500/30",
  },
  amber: {
    icon: "text-warning",
    glow: "",
    ring: "ring-warning/30",
  },
  indigo: {
    icon: "text-info",
    glow: "",
    ring: "ring-info/30",
  },
}

interface KpiCardProps {
  icon: React.ElementType
  title: string
  value: number
  subtitle: string
  accentColor?: AccentColor
}

function KpiCard({ icon: Icon, title, value, subtitle, accentColor = "cyber" }: KpiCardProps) {
  const colors = ACCENT_COLORS[accentColor]

  return (
    <div
      className={`rounded-xl border border-border/60 bg-ink-900/80 p-5 ring-1 ${colors.ring} ${colors.glow} transition-shadow hover:shadow-lg`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900/80">
          <Icon className={`h-4.5 w-4.5 ${colors.icon}`} />
        </div>
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      </div>
      <p className="text-2xl font-bold tabular-nums text-white">{value.toLocaleString("de-DE")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border/60 bg-ink-900/80 p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-ink-900" />
        <div className="h-3 w-20 rounded bg-ink-900" />
      </div>
      <div className="h-7 w-16 rounded bg-ink-900" />
      <div className="mt-2 h-3 w-28 rounded bg-ink-900" />
    </div>
  )
}

const QUICK_LINKS = [
  { href: "/admin/users", label: "Benutzer", icon: Users },
  { href: "/admin/sellers", label: "Verkäufer", icon: Store },
  { href: "/admin/products", label: "Produkte", icon: Package },
  { href: "/admin/orders", label: "Bestellungen", icon: ShoppingCart },
  { href: "/admin/finance", label: "Finanzen", icon: DollarSign },
  { href: "/admin/certificates", label: "Zertifikate", icon: Award },
  { href: "/admin/monitoring", label: "Monitoring", icon: Activity },
]

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await AdminService.getDashboard()
      setData(result)
    } catch {
      const msg = "Dashboard konnte nicht geladen werden."
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const runEffect = useEffectEvent(() => {
    loadDashboard()
  })
  useEffect(() => {
    runEffect()
  }, [loadDashboard])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-danger" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={loadDashboard}
          className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-green-500"
        >
          <RefreshCw className="h-4 w-4" />
          Erneut versuchen
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mono text-lg font-semibold tracking-wide text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Operativer Gesamtüberblick</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <KpiCard
            icon={Users}
            title="Benutzer"
            value={data.users.total}
            subtitle={`${data.users.buyers} Käufer, ${data.users.sellers} Verkäufer, ${data.users.admins} Admins`}
            accentColor="cyber"
          />
          <KpiCard
            icon={Store}
            title="Verkäufer"
            value={data.users.sellers}
            subtitle={`Von ${data.users.total} Benutzern gesamt`}
            accentColor="indigo"
          />
          <KpiCard
            icon={Package}
            title="Produkte"
            value={data.products.total}
            subtitle={`${data.products.active} aktiv, ${data.products.review} in Prüfung`}
            accentColor="emerald"
          />
          <KpiCard
            icon={Package}
            title="Aktive Produkte"
            value={data.products.active}
            subtitle={`Von ${data.products.total} Produkten gesamt`}
            accentColor="emerald"
          />
          <KpiCard
            icon={ShoppingCart}
            title="Bestellungen"
            value={data.orders.total}
            subtitle={`${data.orders.pending} ausstehend, ${data.orders.processing} in Bearbeitung`}
            accentColor="amber"
          />
          <KpiCard
            icon={ShoppingCart}
            title="Versandte Bestellungen"
            value={data.orders.shipped}
            subtitle={`Von ${data.orders.total} Bestellungen gesamt`}
            accentColor="amber"
          />
          <KpiCard
            icon={Award}
            title="Zertifikate"
            value={data.certificates.total}
            subtitle={`${data.certificates.verified} verifiziert, ${data.certificates.rejected} abgelehnt`}
            accentColor="cyber"
          />
          <KpiCard
            icon={Award}
            title="Offene Zertifikate"
            value={data.certificates.pending}
            subtitle={`Von ${data.certificates.total} Zertifikaten gesamt`}
            accentColor="amber"
          />
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-foreground">
          Schnellzugriff
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-ink-900/60 px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-green-600/40 hover:bg-ink-900/60 hover:text-muted-foreground"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              {label}
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
