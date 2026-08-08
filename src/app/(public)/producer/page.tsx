import { Suspense } from "react"
import type { Metadata } from "next"
import ProducerPage from "@/src/components/features/products/ProducerPage"
import { ProductService } from "@/src/services/product.service"
import { SellerService } from "@/src/services/seller.service"
import { truncate } from "@/src/lib/seo"

/** Shared shape for both lookup paths — only the name is strictly required. */
function buildMetadata(companyName: string, description: string): Metadata {
  return {
    title: companyName,
    description,
    openGraph: { type: "profile", title: companyName, description },
  }
}

/**
 * Both routing parameters must be handled, and `?slug=` is the *common* case:
 * `producerHref()` emits it for every APPROVED seller and only falls back to
 * `?id=` for sellers whose profile would 404 (Elysion-UG/elysion-marketplace-backend#104).
 * Reading `id` alone would strip title, description and OpenGraph from exactly
 * the links that work — a shared link would preview as a bare "Produzent".
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; id?: string }>
}): Promise<Metadata> {
  const { slug, id } = await searchParams

  if (slug) {
    try {
      // The public profile is the richer source: it carries the seller's own
      // description instead of a name-only sentence.
      const profile = await SellerService.getPublicProfile(slug)
      const description = truncate(
        profile.description?.trim() ||
          `Nachhaltig zertifizierte Produkte von ${profile.companyName} auf Elysion.`
      )
      return buildMetadata(profile.companyName, description)
    } catch {
      // Unknown slug or a seller that is not APPROVED — both answer 404.
      return { title: "Produzent" }
    }
  }

  if (!id) return { title: "Produzent" }

  try {
    // Id fallback: there is no read by seller id, so the company name comes from
    // the seller's public product listing (same source as the page itself).
    const page = await ProductService.list({ sellerId: id, size: 10 })
    const companyName = page.items.find((p) => p.seller?.companyName)?.seller?.companyName
    if (!companyName) return { title: "Produzent" }

    return buildMetadata(
      companyName,
      truncate(`Nachhaltig zertifizierte Produkte von ${companyName} auf Elysion.`)
    )
  } catch {
    return { title: "Produzent" }
  }
}

export default function ProducerPageRoute() {
  return (
    <Suspense>
      <ProducerPage />
    </Suspense>
  )
}
