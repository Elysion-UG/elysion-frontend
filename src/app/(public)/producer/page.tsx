import { Suspense } from "react"
import type { Metadata } from "next"
import ProducerPage from "@/src/components/features/products/ProducerPage"
import { ProductService } from "@/src/services/product.service"
import { truncate } from "@/src/lib/seo"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}): Promise<Metadata> {
  const { id } = await searchParams
  if (!id) return { title: "Produzent" }

  try {
    // No public seller-profile endpoint yet — derive the company name from the
    // seller's public product listing (same source as the page itself).
    const page = await ProductService.list({ sellerId: id, size: 10 })
    const companyName = page.items.find((p) => p.seller?.companyName)?.seller?.companyName
    if (!companyName) return { title: "Produzent" }

    const description = truncate(
      `Nachhaltig zertifizierte Produkte von ${companyName} auf Elysion.`
    )

    return {
      title: companyName,
      description,
      openGraph: {
        type: "profile",
        title: companyName,
        description,
      },
    }
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
