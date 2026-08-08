"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Award, CalendarDays, Leaf, MapPin, PackageOpen, Store } from "lucide-react"
import { useSellerProducts } from "@/src/hooks/useSellerProducts"
import { usePublicSellerProfile, isSellerNotFound } from "@/src/hooks/usePublicSellerProfile"
import type { PublicSellerCertificate } from "@/src/types"
import ProductCard from "./ProductCard"

/**
 * Produzenten-Seite.
 *
 * `?slug=` lädt das öffentliche Profil (`GET /api/v1/sellers/{slug}`, #104) mit
 * Beschreibung, Standort, Gründungsjahr, Nachhaltigkeits-Score und verifizierten
 * Zertifikaten. `?id=<uuid>` bleibt als Fallback für bereits geteilte Links
 * funktionsfähig — dafür gibt es keinen Profil-Lookup, die Seite zeigt dann nur
 * den aus der Produktliste abgeleiteten Namen.
 *
 * Die Produkte hängen nie am Profil: sie kommen über
 * `GET /api/v1/products?sellerId=<id>`.
 */
export default function ProducerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = searchParams.get("slug")
  const legacySellerId = searchParams.get("id")

  const profileQuery = usePublicSellerProfile(slug)
  const profile = profileQuery.data

  // Mit Slug wartet die Produktliste auf die Id aus dem Profil; ohne Slug zählt
  // die Id aus dem Altlink.
  const sellerId = slug ? (profile?.id ?? null) : legacySellerId
  const productsQuery = useSellerProducts(sellerId)

  const notFound = (!slug && !legacySellerId) || isSellerNotFound(profileQuery.error)
  const failed =
    Boolean(productsQuery.error) ||
    (Boolean(profileQuery.error) && !isSellerNotFound(profileQuery.error))

  const products = productsQuery.data?.products ?? []
  const companyName = profile?.companyName ?? productsQuery.data?.companyName ?? "Verkäufer"
  const logoInitial = companyName.charAt(0).toUpperCase() || "?"
  const productCount = productsQuery.data?.totalElements ?? 0
  const isLoading = profileQuery.isLoading || productsQuery.isLoading
  const certificates = profile?.certifications ?? []

  // Not-found / error: render only the error state — no placeholder header card
  // with fabricated "Verkäufer / 0 Produkte" data (mirrors the product detail page).
  if (notFound || failed) {
    return (
      <div className="min-h-screen bg-secondary">
        <BackBanner onBack={() => router.back()} />
        <div className="container mx-auto px-4">
          {notFound ? (
            <EmptyState
              title="Verkäufer nicht gefunden"
              message="Diese Produzenten-Seite gibt es nicht (mehr)."
            />
          ) : (
            <EmptyState
              title="Produzent konnte nicht geladen werden"
              message="Bitte versuche es später erneut."
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary">
      <BackBanner onBack={() => router.back()} />

      <div className="container mx-auto px-4">
        {/* Header card */}
        <div className="relative -mt-12 mb-8 rounded-xl bg-white p-6 shadow-lg md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="-mt-16 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border-4 border-white bg-green-500 shadow-lg sm:mt-0 md:h-24 md:w-24">
              <span className="text-3xl font-bold text-ink-900 md:text-4xl">{logoInitial}</span>
            </div>
            <div>
              <h1 className="text-2xl font-normal text-foreground md:text-3xl">{companyName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {!isLoading && (
                  <span className="flex items-center gap-1.5">
                    <Store className="h-4 w-4" />
                    {productCount} {productCount === 1 ? "Produkt" : "Produkte"}
                  </span>
                )}
                {profile?.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile?.foundedYear != null && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    gegründet {profile.foundedYear}
                  </span>
                )}
              </div>
            </div>
            {profile?.sustainabilityScore != null && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 sm:ml-auto">
                <Leaf className="h-5 w-5 text-green-600" />
                <div className="leading-tight">
                  <p className="text-lg font-semibold text-green-700">
                    {profile.sustainabilityScore}
                    <span className="text-sm font-normal text-green-600">/100</span>
                  </p>
                  <p className="text-xs text-green-600">Nachhaltigkeit</p>
                </div>
              </div>
            )}
          </div>

          {profile?.description && (
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-foreground">
              {profile.description}
            </p>
          )}

          {certificates.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Verifizierte Zertifikate
              </h2>
              <ul className="flex flex-wrap gap-2">
                {certificates.map((cert) => (
                  <li
                    key={cert.certificateId}
                    className="flex items-start gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                  >
                    <Award className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span>
                      <span className="font-medium text-foreground">{cert.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {certificateMeta(cert)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Content states */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 pb-12 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-xl border border-border bg-white"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="Keine Produkte"
            message="Dieser Verkäufer hat aktuell keine aktiven Produkte."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-12 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                productHref={
                  product.slug ? `/product?slug=${product.slug}` : `/product?id=${product.id}`
                }
                sellerHref={null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Aussteller und Gültigkeit — nur das, was der Endpoint tatsächlich liefert. */
function certificateMeta(cert: PublicSellerCertificate): string {
  const parts: string[] = []
  if (cert.issuerName) parts.push(cert.issuerName)
  if (cert.expiryDate) {
    parts.push(`gültig bis ${new Date(cert.expiryDate).toLocaleDateString("de-DE")}`)
  }
  return parts.join(" · ")
}

interface BackBannerProps {
  onBack: () => void
}

/** Neutral banner with a back button — no fabricated hero imagery. */
function BackBanner({ onBack }: BackBannerProps) {
  return (
    <div className="relative h-40 bg-ink-900 md:h-52">
      <button
        onClick={onBack}
        className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-sand-page transition-colors hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </button>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  message: string
}

function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <PackageOpen className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
