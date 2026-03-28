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
      <div className="max-w-lg mx-auto text-center py-16">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Bestellung aufgegeben!</h1>
        <p className="text-slate-500 mb-1">Bestellnummer</p>
        <p className="text-2xl font-bold text-teal-700 mb-8">#{result.orderNumber}</p>
        <p className="text-slate-500 mb-8">Du erhältst eine Bestätigung per E-Mail.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/orders" className="bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors">
            Meine Bestellungen
          </a>
          <a href="/" className="border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors">
            Weiter einkaufen
          </a>
        </div>
      </div>
    )
  }

  if (step === "preview" && preview) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-teal-600" />
          Bestellung bestätigen
        </h1>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-teal-600" />
            Deine Artikel
          </h2>
          <div className="space-y-3">
            {preview.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-slate-700">{item.quantity}× {item.productName}</span>
                <span className="font-medium text-slate-800">{formatEuro(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </div>

        {preview.shippingAddress && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              Lieferadresse
            </h2>
            <address className="not-italic text-sm text-slate-600 leading-relaxed">
              {preview.shippingAddress.firstName} {preview.shippingAddress.lastName}<br />
              {preview.shippingAddress.street} {preview.shippingAddress.houseNumber}<br />
              {preview.shippingAddress.postalCode} {preview.shippingAddress.city}
            </address>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Zwischensumme</span>
              <span>{formatEuro(preview.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Versand</span>
              <span>{formatEuro(preview.shippingCost)}</span>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between font-bold text-slate-800">
            <span>Gesamt</span>
            <span>{formatEuro(preview.total)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep("address")}
            className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Zurück
          </button>
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Jetzt bestellen <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
        <MapPin className="w-8 h-8 text-teal-600" />
        Lieferadresse
      </h1>

      {addresses.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 mb-4">Du hast noch keine gespeicherte Adresse.</p>
          <a href="/profil" className="text-teal-700 font-medium underline underline-offset-2">
            Adresse in Profil hinzufügen
          </a>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
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
                <div className="text-sm text-slate-700 leading-relaxed">
                  <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                  <p>{addr.street} {addr.houseNumber}</p>
                  <p>{addr.postalCode} {addr.city}</p>
                  {addr.isDefault && (
                    <span className="text-xs text-teal-600 font-medium">Standardadresse</span>
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
        className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Weiter zur Übersicht <ChevronRight className="w-4 h-4" /></>}
      </button>
    </div>
  )
}
