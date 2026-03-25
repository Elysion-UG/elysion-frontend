"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Lock, User, Package, Tag, Award, ShoppingCart,
  ClipboardList, CreditCard, FileUp, Shield, BarChart3, AlertTriangle
} from "lucide-react"

const domains = [
  {
    href: "/dev/auth",
    icon: Lock,
    title: "Authentication",
    description: "Register, Login, Logout, Token-Refresh, Email-Verification, Password-Reset",
    count: 9,
    auth: "PUBLIC / AUTH",
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    href: "/dev/user",
    icon: User,
    title: "User & Profile",
    description: "User-Info, Werteprofil, Adressen, Seller-Profil, Seller-Value-Profil",
    count: 15,
    auth: "AUTH",
    color: "bg-teal-50 border-teal-200",
    iconColor: "text-teal-600",
  },
  {
    href: "/dev/products",
    icon: Package,
    title: "Products",
    description: "Produkt-CRUD, Status, Bilder, Varianten, öffentliche Zertifikate",
    count: 13,
    auth: "PUBLIC / SELLER",
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
  },
  {
    href: "/dev/categories",
    icon: Tag,
    title: "Categories",
    description: "Kategorie-Liste, Baum, Admin-CRUD, Aktivierung/Deaktivierung",
    count: 6,
    auth: "PUBLIC / ADMIN",
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
  },
  {
    href: "/dev/certificates",
    icon: Award,
    title: "Certificates",
    description: "Seller-Zertifikate erstellen, auflisten, mit Produkten verknüpfen",
    count: 5,
    auth: "SELLER",
    color: "bg-yellow-50 border-yellow-200",
    iconColor: "text-yellow-600",
  },
  {
    href: "/dev/cart",
    icon: ShoppingCart,
    title: "Cart & Checkout",
    description: "Warenkorb (Gast & Auth), Artikel hinzufügen/ändern/löschen, Checkout",
    count: 6,
    auth: "PUBLIC / BUYER",
    color: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-600",
  },
  {
    href: "/dev/orders",
    icon: ClipboardList,
    title: "Orders",
    description: "Käufer-Bestellungen, Seller-OrderGroups, Versand, Auszahlungen",
    count: 8,
    auth: "BUYER / SELLER",
    color: "bg-indigo-50 border-indigo-200",
    iconColor: "text-indigo-600",
  },
  {
    href: "/dev/payments",
    icon: CreditCard,
    title: "Payments",
    description: "Payment-Intent erstellen, Status abfragen, Webhook simulieren",
    count: 3,
    auth: "BUYER / PUBLIC",
    color: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
  },
  {
    href: "/dev/files",
    icon: FileUp,
    title: "Files & Recommendations",
    description: "Dateien hochladen, verknüpfen, verwalten; personalisierte Empfehlungen",
    count: 8,
    auth: "AUTH / PUBLIC",
    color: "bg-pink-50 border-pink-200",
    iconColor: "text-pink-600",
  },
  {
    href: "/dev/admin/users",
    icon: Shield,
    title: "Admin: Users & Sellers",
    description: "Dashboard, Benutzer- und Verkäufer-Moderation, Genehmigungen",
    count: 14,
    auth: "ADMIN",
    color: "bg-red-50 border-red-200",
    iconColor: "text-red-600",
  },
  {
    href: "/dev/admin/finance",
    icon: BarChart3,
    title: "Admin: Finance & Maintenance",
    description: "Produkte, Zertifikate, Bestellungen, Zahlungen, Wartungs-Jobs",
    count: 15,
    auth: "ADMIN",
    color: "bg-slate-50 border-slate-200",
    iconColor: "text-slate-600",
  },
]

export default function DevIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">🛠 API Test Playground</h1>
          <p className="text-lg text-slate-500">Direkter Test aller Backend-Endpunkte</p>
          <p className="text-sm text-slate-400 mt-1">
            Backend:{" "}
            <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">
              {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1
            </code>
          </p>
        </div>

        {/* Warning */}
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-8 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Nur für Entwicklung</strong> — Diese Seiten verbinden direkt gegen das Backend.
            Für Production-Backend: <code className="bg-amber-100 px-1 rounded">npm run dev:stage</code>
          </span>
        </div>

        {/* Domain Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {domains.map((d) => {
            const Icon = d.icon
            return (
              <Link key={d.href} href={d.href}>
                <Card className={`border ${d.color} hover:shadow-md transition-shadow cursor-pointer h-full`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-3 text-base">
                      <div className={`p-2 rounded-lg bg-white border ${d.color}`}>
                        <Icon className={`w-5 h-5 ${d.iconColor}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{d.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs font-normal">{d.count} Endpunkte</Badge>
                          <span className="text-xs text-slate-400">{d.auth}</span>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs text-slate-500">{d.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-10">
          Marketplace Platform · API v1 · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
