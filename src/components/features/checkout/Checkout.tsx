"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, MapPin, ShoppingBag, CreditCard, ChevronRight } from "lucide-react"
import { AddressService } from "@/src/services/address.service"
import { CheckoutService } from "@/src/services/checkout.service"
import { useCart } from "@/src/context/CartContext"
import type { Address, CheckoutStartResponse, CheckoutCompleteResponse } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"

type Step = "address" | "preview" | "success"

export default function Checkout() {
  const { refetch } = useCart()
  const [step, setStep] = useState<Step>("address")
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [preview, setPreview] = useState<CheckoutStartResponse | null>(null)
  const [result, setResult] = useState<CheckoutCompleteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    AddressService.getAll()
      .then((list) => {
        setAddresses(list)
        const def = list.find((a) => a.isDefault) ?? list[0]
        if (def) setSelectedAddressId(def.id)
      })
      .catch(() => toast.error("Adressen konnten nicht geladen werden."))
  }, [])

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
            {(preview.items ?? []).map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  {item.quantity}× {item.productName}
                </span>
                <span className="font-medium text-slate-800">{formatEuro(item.totalPrice)}</span>
              </div>
            ))}
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
              <span>{formatEuro(preview.shippingCost ?? 0)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-800">
            <span>Gesamt</span>
            <span>{formatEuro(preview.total ?? 0)}</span>
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
