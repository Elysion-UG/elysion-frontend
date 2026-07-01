import { Suspense } from "react"
import type { Metadata } from "next"
import ProductDetail from "@/src/components/features/products/ProductDetail"
import { ProductService } from "@/src/services/product.service"
import { truncate } from "@/src/lib/seo"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; id?: string }>
}): Promise<Metadata> {
  const { slug } = await searchParams
  // Rich metadata needs the public slug endpoint; id-only links (rare fallback)
  // hit an authenticated endpoint, so degrade to the generic title there.
  if (!slug) return { title: "Produkt" }

  try {
    const product = await ProductService.getBySlug(slug)
    const title = product.name ?? product.title ?? "Produkt"
    const description = truncate(
      product.shortDesc ?? product.description ?? `${title} — nachhaltig zertifiziert auf Elysion.`
    )
    const image = product.images?.[0]?.url

    return {
      title,
      description,
      openGraph: {
        type: "website",
        title,
        description,
        images: image ? [{ url: image, alt: title }] : undefined,
      },
    }
  } catch {
    return { title: "Produkt" }
  }
}

export default function ProductPage() {
  return (
    <Suspense>
      <ProductDetail />
    </Suspense>
  )
}
