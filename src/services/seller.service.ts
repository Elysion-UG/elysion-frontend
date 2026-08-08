/**
 * SellerService — öffentliche Verkäufer-Reads der Storefront (Backend #104).
 *
 * `GET /api/v1/sellers/{slug}` liefert das Profil der Produzenten-Seite samt
 * verifizierter Zertifikate. Sichtbar sind ausschließlich `APPROVED`-Verkäufer;
 * jeder andere Status antwortet wie ein unbekannter Slug mit `404`.
 *
 * Der Slug ist der stabile öffentliche Identifikator — er wird einmalig aus dem
 * Firmennamen abgeleitet und folgt einer Umbenennung nicht, damit geteilte Links
 * gültig bleiben. Die Produkte hängen **nicht** am Profil: sie werden separat
 * über `GET /api/v1/products?sellerId=<profile.id>` geladen.
 */
import { z } from "zod"
import { apiRequest } from "@/src/lib/api-client"
import { parseApiResponse } from "@/src/lib/api-schemas"
import type { PublicSellerProfile } from "@/src/types"

const publicSellerCertificateSchema = z.object({
  certificateId: z.string(),
  certificateType: z.string().nullish(),
  title: z.string(),
  issuerName: z.string().nullish(),
  certificateNumber: z.string().nullish(),
  issueDate: z.string().nullish(),
  expiryDate: z.string().nullish(),
  status: z.enum(["PENDING", "VERIFIED", "REJECTED", "EXPIRED"]),
})

const publicSellerProfileSchema = z.object({
  id: z.string(),
  slug: z.string(),
  companyName: z.string(),
  description: z.string().nullish(),
  location: z.string().nullish(),
  foundedYear: z.number().nullish(),
  sustainabilityScore: z.number().nullish(),
  certifications: z.array(publicSellerCertificateSchema).nullish(),
})

type ApiPublicSellerProfile = z.infer<typeof publicSellerProfileSchema>

// Der Endpoint liefert die optionalen Felder als `null`; im Frontend sind sie
// `undefined` (Typen sind `?:`), damit `??`-Fallbacks überall gleich greifen.
function normalizeProfile(raw: ApiPublicSellerProfile): PublicSellerProfile {
  return {
    id: raw.id,
    slug: raw.slug,
    companyName: raw.companyName,
    description: raw.description ?? undefined,
    location: raw.location ?? undefined,
    foundedYear: raw.foundedYear ?? undefined,
    sustainabilityScore: raw.sustainabilityScore ?? undefined,
    certifications: (raw.certifications ?? []).map((cert) => ({
      certificateId: cert.certificateId,
      certificateType: cert.certificateType ?? undefined,
      title: cert.title,
      issuerName: cert.issuerName ?? undefined,
      certificateNumber: cert.certificateNumber ?? undefined,
      issueDate: cert.issueDate ?? undefined,
      expiryDate: cert.expiryDate ?? undefined,
      status: cert.status,
    })),
  }
}

export const SellerService = {
  async getPublicProfile(slug: string): Promise<PublicSellerProfile> {
    const raw = await apiRequest<unknown>(`/api/v1/sellers/${encodeURIComponent(slug)}`)
    return normalizeProfile(
      parseApiResponse(publicSellerProfileSchema, raw, "seller.publicProfile")
    )
  },
}
