import type { MetadataRoute } from "next"
import { buyerUrl } from "@/src/lib/seller-url"
import { ProductService } from "@/src/services/product.service"

// Rendered on demand, not prerendered at build: the product fetch hits a live
// API whose free-tier host can cold-start ~60–90s, which would blow the static
// export timeout. Crawlers request the sitemap rarely, so per-request is fine.
export const dynamic = "force-dynamic"

type SitemapEntry = MetadataRoute.Sitemap[number]

/** Public storefront pages that always exist. */
const STATIC_PATHS = ["/", "/about", "/contact", "/impressum", "/datenschutz", "/widerruf", "/agb"]

const SITEMAP_PAGE_SIZE = 100
// Safety cap so a large catalogue can't produce an unbounded sitemap fetch loop.
const MAX_SITEMAP_PAGES = 50
// Overall budget for collecting product slugs; on a cold backend we return
// whatever was gathered so far rather than hanging the request.
const SITEMAP_FETCH_TIMEOUT_MS = 10_000

/** Collects all product slugs, paging through the public product list. */
async function fetchProductSlugs(): Promise<string[]> {
  const slugs: string[] = []

  const collect = (async () => {
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
      // (e.g. backend unreachable).
    }
  })()

  let timer: ReturnType<typeof setTimeout> | undefined
  const budget = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, SITEMAP_FETCH_TIMEOUT_MS)
  })

  await Promise.race([collect, budget])
  if (timer) clearTimeout(timer)
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
