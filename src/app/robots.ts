import type { MetadataRoute } from "next"
import { buyerUrl } from "@/src/lib/seller-url"

/**
 * /robots.txt — the public storefront lives on the buyer domain. Authenticated
 * buyer areas, the seller/admin portals and the API proxy must stay out of the
 * search index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/cart",
        "/checkout",
        "/orders",
        "/profil",
        "/praeferenzen",
        "/onboarding",
        "/admin",
        "/seller-dashboard",
        "/reset-password",
        "/verify-email",
      ],
    },
    sitemap: buyerUrl("/sitemap.xml"),
  }
}
