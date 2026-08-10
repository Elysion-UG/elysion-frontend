import type { CertificateType, CertificateStatus } from "./certificate"
import type { ProductStatus } from "./product"
import type { ValuesProfileType } from "./user"

// ── Öffentliches Verkäuferprofil (Produzenten-Seite, Backend #104) ───
/**
 * Zertifikat im öffentlichen Profil. Eigener Typ statt `PublicCertificate`:
 * der Endpoint liefert `certificateId` (nicht `id`) und zeigt ausschließlich
 * **verifizierte** Nachweise — geprüfte Belege, keine Behauptungen.
 */
export interface PublicSellerCertificate {
  certificateId: string
  certificateType?: CertificateType | string
  title: string
  issuerName?: string
  certificateNumber?: string
  issueDate?: string
  expiryDate?: string
  status: CertificateStatus
}

export interface PublicSellerProfile {
  /** Seller-UUID — exakt der Wert für `GET /api/v1/products?sellerId=<id>`. */
  id: string
  /** Stabiler öffentlicher Identifikator; folgt einer Umbenennung der Firma nicht. */
  slug: string
  companyName: string
  description?: string
  location?: string
  foundedYear?: number
  /** Redaktionell gepflegter Wert 0–100. */
  sustainabilityScore?: number
  certifications: PublicSellerCertificate[]
}

// ── Seller Value Profile ────────────────────────────────────────────
export type SellerValueProfileLevel = "STANDARD" | "LEVEL_2" | "LEVEL_3"

export interface SellerValueProfile {
  sellerProfileId: string
  level: SellerValueProfileLevel
  payload?: unknown
  score?: number
}

// ── Seller Product List Item ─────────────────────────────────────────
/**
 * Ein Eintrag aus `GET /api/v1/seller/products` — der Produktverwaltung des
 * Verkäuferportals (#227).
 *
 * Eigenes DTO, **nicht** das des öffentlichen Katalogs: das Feld heißt `name`
 * (kein `title`), es gibt kein `seller`-Objekt und keine `shortDescription`,
 * und `primaryImage` ist eine einzelne URL statt eines `images[]`.
 */
export interface SellerProductListItem {
  id: string
  slug: string
  name: string
  /** Interner Status — anders als der Katalog ist diese Liste nicht auf `ACTIVE` gefiltert. */
  status: ProductStatus
  /** Basispreis in Euro; die Cent-Beträge der DB rechnet das Backend um. */
  price: number
  currency: string
  /** URL des Primärbilds, oder `null` solange das Produkt keins hat. */
  primaryImage: string | null
  createdAt: string
}

// ── Buyer Value Profile ──────────────────────────────────────────────
export interface BuyerValueProfile {
  id: string
  userId: string
  activeProfileType: ValuesProfileType
  simpleProfile: Record<string, number> | null
  extendedProfile: Record<string, Record<string, number>> | null
  updatedAt: string
}

export interface BuyerValueProfileUpsertDTO {
  activeProfileType: ValuesProfileType
  simpleProfile?: Record<string, number> | null
  extendedProfile?: Record<string, Record<string, number>> | null
}
