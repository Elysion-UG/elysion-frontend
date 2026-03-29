"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle2,
  Loader2,
  MapPin,
  ShoppingBag,
  CreditCard,
  ChevronRight,
  ShieldAlert,
} from "lucide-react"
import { AddressService } from "@/src/services/address.service"
import { CheckoutService } from "@/src/services/checkout.service"
import { ProductService } from "@/src/services/product.service"
import { useCart } from "@/src/context/CartContext"
import { useAuth } from "@/src/context/AuthContext"
import LoginModal from "@/src/components/LoginModal"
import type { Address, CheckoutStartResponse, CheckoutCompleteResponse } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import {
  getProductDisplayCache,
  saveProductDisplay,
  type ProductDisplayEntry,
} from "@/src/lib/product-display-cache"
import { toast } from "sonner"

type Step = "address" | "preview" | "success"

export default function Checkout() {
  const { refetch } = useCart()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [step, setStep] = useState<Step>("address")
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [preview, setPreview] = useState<CheckoutStartResponse | null>(null)
  const [result, setResult] = useState<CheckoutCompleteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Product display data (name + image) for checkout items.
  // Seed from localStorage cache (populated by addItem). When items are missing
  // from the cache (e.g. cart loaded from backend in a previous session before
  // this feature existed), fetch from the API as a fallback.
  const [displayMap, setDisplayMap] =
    useState<Record<string, ProductDisplayEntry>>(getProductDisplayCache)

  useEffect(() => {
    if (!preview?.items?.length) return

    const missing = (preview.items ?? [])
      .map((i) => i.productId)
      .filter((id): id is string => !!id && !displayMap[id])

    if (missing.length === 0) return

    // 1. Fetch the full product list to get slug + title per productId.
    //    The public list endpoint returns {id, slug, title} — no images.
    ProductService.list({ size: 200 })
      .then(async (page) => {
        const found = page.content.filter((p) => missing.includes(p.id))
        if (found.length === 0) return

        // 2. For each found product, fetch the public detail to get images.
        const entries = await Promise.all(
          found.map(async (p) => {
            let imageUrl: string | undefined
            if (p.slug) {
              try {
                const detail = await ProductService.getBySlug(p.slug)
                imageUrl = detail.images?.[0]?.url ?? detail.imageUrls?.[0]
              } catch {
                // image fetch failed — show without image
              }
            }
            const entry: ProductDisplayEntry = {
              name: (p as unknown as { title?: string }).title ?? p.name ?? p.id,
              imageUrl,
              slug: p.slug,
            }
            saveProductDisplay(p.id, entry)
            return [p.id, entry] as const
          })
        )

        setDisplayMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      })
      .catch(() => {
        // Silently ignore — placeholder remains
      })
  }, [preview])

  useEffect(() => {
    if (!isAuthenticated) return
    AddressService.getAll()
      .then((list) => {
        setAddresses(list)
        const def = list.find((a) => a.isDefault) ?? list[0]
        if (def) setSelectedAddressId(def.id)
      })
      .catch(() => toast.error("Adressen konnten nicht geladen werden."))
  }, [isAuthenticated])

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
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

  const handlePreview = async () => {
    if (!selectedAddressId) {
      toast.error("Bitte wähle eine Lieferadresse.")
      return
    }
    setIsLoading(true)
    try {
      const data = await CheckoutService.preview({
        shippingAddressId: selectedAddressId,
        paymentMethod: "MOCK",
      })
      setPreview(data)
      setStep("preview")
    } catch {
      toast.error("Bestellung konnte nicht vorgeprüft werden.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!selectedAddressId) return
    setIsLoading(true)
    try {
      const data = await CheckoutService.complete({
        shippingAddressId: selectedAddressId,
        paymentMethod: "MOCK",
      })
      setResult(data)
      setStep("success")
      await refetch()
      toast.success("Bestellung aufgegeben!")
    } catch {
      toast.error("Bestellung konnte nicht abgeschlossen werden.")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "success" && result) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CheckCircle2 className="mx-auto mb-6 h-20 w-20 text-green-500" />
        <h1 className="mb-2 text-3xl font-bold text-slate-800">Bestellung aufgegeben!</h1>
        <p className="mb-1 text-slate-500">Bestellnummer</p>
        <p className="mb-8 text-2xl font-bold text-teal-700">#{result.orderNumber}</p>
        <p className="mb-8 text-slate-500">Du erhältst eine Bestätigung per E-Mail.</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="/orders"
            className="rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700"
          >
            Meine Bestellungen
          </a>
          <a
            href="/"
            className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Weiter einkaufen
          </a>
        </div>
      </div>
    )
  }

  if (step === "preview" && preview) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 flex items-center gap-3 text-3xl font-bold text-slate-800">
          <CreditCard className="h-8 w-8 text-teal-600" />
          Bestellung bestätigen
        </h1>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-700">
            <ShoppingBag className="h-4 w-4 text-teal-600" />
            Deine Artikel
          </h2>
          <div className="space-y-3">
            {(preview.items ?? []).map((item, idx) => {
              const display = item.productId ? displayMap[item.productId] : null
              return (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  {display?.imageUrl ? (
                    <img
                      src={display.imageUrl}
                      alt={display.name}
                      className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <ShoppingBag className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <span className="flex-1 text-slate-700">
                    {item.quantity}× {display?.name ?? "Artikel"}
                  </span>
                  <span className="font-medium text-slate-800">{formatEuro(item.lineTotal)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {preview.shippingAddress && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
              <MapPin className="h-4 w-4 text-teal-600" />
              Lieferadresse
            </h2>
            <address className="text-sm not-italic leading-relaxed text-slate-600">
              {preview.shippingAddress.firstName} {preview.shippingAddress.lastName}
              <br />
              {preview.shippingAddress.street} {preview.shippingAddress.houseNumber}
              <br />
              {preview.shippingAddress.postalCode} {preview.shippingAddress.city}
            </address>
          </div>
        )}

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Zwischensumme</span>
              <span>{formatEuro(preview.subtotal ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Versand</span>
              <span>Kostenlos</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-800">
            <span>Gesamt</span>
            <span>{formatEuro(preview.subtotal ?? 0)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep("address")}
            className="flex-1 rounded-lg border border-slate-300 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Zurück
          </button>
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Jetzt bestellen <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 flex items-center gap-3 text-3xl font-bold text-slate-800">
        <MapPin className="h-8 w-8 text-teal-600" />
        Lieferadresse
      </h1>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="mb-4 text-yellow-800">Du hast noch keine gespeicherte Adresse.</p>
          <a href="/profil" className="font-medium text-teal-700 underline underline-offset-2">
            Adresse in Profil hinzufügen
          </a>
        </div>
      ) : (
        <div className="mb-8 space-y-3">
          {addresses.map((addr) => (
            <label
              key={addr.id}
              className={`block cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                selectedAddressId === addr.id
                  ? "border-teal-500 bg-teal-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mt-1 accent-teal-600"
                />
                <div className="text-sm leading-relaxed text-slate-700">
                  <p className="font-medium">
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p>
                    {addr.street} {addr.houseNumber}
                  </p>
                  <p>
                    {addr.postalCode} {addr.city}
                  </p>
                  {addr.isDefault && (
                    <span className="text-xs font-medium text-teal-600">Standardadresse</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      <button
        onClick={handlePreview}
        disabled={isLoading || !selectedAddressId}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Weiter zur Übersicht <ChevronRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  )
}
