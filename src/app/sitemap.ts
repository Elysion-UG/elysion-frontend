import type { MetadataRoute } from "next"
import { buyerUrl } from "@/src/lib/seller-url"
import { ProductService } from "@/src/services/product.service"

type SitemapEntry = MetadataRoute.Sitemap[number]

/** Public storefront pages that always exist. */
const STATIC_PATHS = ["/", "/about", "/contact", "/impressum", "/datenschutz", "/widerruf", "/agb"]

const SITEMAP_PAGE_SIZE = 100
// Safety cap so a large catalogue can't produce an unbounded sitemap fetch loop.
const MAX_SITEMAP_PAGES = 50

/** Collects all product slugs, paging through the public product list. */
async function fetchProductSlugs(): Promise<string[]> {
  const slugs: string[] = []
  try {
    let page = 0
    let totalPages = 1
    do {
      const res = await ProductService.list({ page, size: SITEMAP_PAGE_SIZE })
      for (const product of res.items) {
        if (product.slug) slugs.push(product.slug)
      }
      totalPages = res.totalPages
      page += 1
    } while (page < totalPages && page < MAX_SITEMAP_PAGES)
  } catch {
    // Degrade to a static-only sitemap rather than failing the whole route
    // (e.g. backend unreachable at build time).
  }
  return slugs
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: SitemapEntry[] = STATIC_PATHS.map((path) => ({
    url: buyerUrl(path),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.5,
  }))

  const productEntries: SitemapEntry[] = (await fetchProductSlugs()).map((slug) => ({
    url: buyerUrl(`/product?slug=${encodeURIComponent(slug)}`),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticEntries, ...productEntries]
}
