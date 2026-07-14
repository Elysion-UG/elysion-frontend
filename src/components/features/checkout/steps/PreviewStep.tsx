"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CreditCard, FileText, Loader2, MapPin, ShoppingBag } from "lucide-react"
import type { CheckoutStartResponse } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import {
  getProductDisplayCache,
  saveProductDisplay,
  type ProductDisplayEntry,
} from "@/src/lib/product-display-cache"
import { ProductService } from "@/src/services/product.service"

interface PreviewStepProps {
  preview: CheckoutStartResponse
  onBack: () => void
  onComplete: () => void
  isLoading: boolean
}

export function PreviewStep({ preview, onBack, onComplete, isLoading }: PreviewStepProps) {
  const [agbAccepted, setAgbAccepted] = useState(false)
  const [displayMap, setDisplayMap] =
    useState<Record<string, ProductDisplayEntry>>(getProductDisplayCache)

  useEffect(() => {
    if (!preview?.items?.length) return

    const missing = (preview.items ?? [])
      .map((i) => i.product?.id)
      .filter((id): id is string => !!id && !displayMap[id])

    if (missing.length === 0) return

    ProductService.list({ size: 200 })
      .then(async (page) => {
        const found = page.items.filter((p) => missing.includes(p.id))
        if (found.length === 0) return

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
  }, [preview, displayMap])

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <h1 className="mb-8 flex items-center gap-3 text-3xl font-normal text-foreground">
        <CreditCard className="h-8 w-8 text-green-600" />
        Bestellung bestätigen
      </h1>

      <div className="mb-6 rounded-xl border border-border bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <ShoppingBag className="h-4 w-4 text-green-600" />
          Deine Artikel
        </h2>
        <div className="space-y-3">
          {(preview.items ?? []).map((item, idx) => {
            const display = item.product?.id ? displayMap[item.product.id] : null
            return (
              <div key={idx} className="flex items-center gap-3 text-sm">
                {display?.imageUrl ? (
                  <Image
                    src={display.imageUrl}
                    alt={display.name ?? "Produkt"}
                    width={48}
                    height={48}
                    className="flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <span className="flex-1 text-foreground">
                  {item.quantity}× {display?.name ?? "Artikel"}
                </span>
                <span className="font-medium text-foreground">{formatEuro(item.lineTotal)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {preview.shippingAddress && (
        <div className="mb-6 rounded-xl border border-border bg-white p-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-green-600" />
            Lieferadresse
          </h2>
          <address className="text-sm not-italic leading-relaxed text-foreground">
            {preview.shippingAddress.firstName} {preview.shippingAddress.lastName}
            <br />
            {preview.shippingAddress.street} {preview.shippingAddress.houseNumber}
            <br />
            {preview.shippingAddress.postalCode} {preview.shippingAddress.city}
          </address>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-border bg-white p-6">
        <div className="space-y-2 text-sm text-foreground">
          <div className="flex justify-between">
            <span>Zwischensumme (netto)</span>
            <span>{formatEuro((preview.subtotal ?? 0) - (preview.tax ?? 0))}</span>
          </div>
          {(preview.tax ?? 0) > 0 && (
            <div className="flex justify-between">
              <span>Enthaltene MwSt.</span>
              <span>{formatEuro(preview.tax ?? 0)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Versand</span>
            <span>
              {(preview.shippingCost ?? 0) > 0
                ? formatEuro(preview.shippingCost ?? 0)
                : "Kostenlos"}
            </span>
          </div>
        </div>
        <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold text-foreground">
          <span>Gesamt (inkl. MwSt.)</span>
          <span>{formatEuro(preview.subtotal ?? 0)}</span>
        </div>
      </div>

      {/* AGB + Widerruf Checkbox — § 312j BGB */}
      <div className="mb-6 rounded-xl border border-border bg-secondary p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agbAccepted}
            onChange={(e) => setAgbAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-green-500"
          />
          <span className="text-sm text-foreground">
            Ich habe die{" "}
            <Link
              href="/agb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 underline underline-offset-2 hover:text-green-600"
            >
              AGB
            </Link>{" "}
            und die{" "}
            <Link
              href="/widerruf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 underline underline-offset-2 hover:text-green-600"
            >
              Widerrufsbelehrung
            </Link>{" "}
            gelesen und akzeptiere diese. *
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-border py-3 font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Zurück
        </button>
        <button
          onClick={onComplete}
          disabled={isLoading || !agbAccepted}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 py-3 font-medium text-ink-900 transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Zahlungspflichtig bestellen
            </>
          )}
        </button>
      </div>
    </div>
  )
}
