/**
 * Welche Statuswechsel ein **Verkäufer** an seinem eigenen Produkt selbst
 * auslösen darf (#227).
 *
 * Quelle ist die State Machine des Backends
 * (`../../elysion-marketplace-backend/docs/domain/product-lifecycle.md`,
 * durchgesetzt in `ProductCommandService.validateTransition`):
 *
 *   DRAFT → REVIEW · REVIEW → ACTIVE · REVIEW → REJECTED · ACTIVE ⇄ INACTIVE
 *
 * Davon bietet die Oberfläche bewusst nicht alles an:
 *
 * - `REVIEW → REJECTED` ist **Admin-only** — das Backend verlangt dafür die
 *   Admin-Rolle und weist einen Verkäufer ab.
 * - `REVIEW → ACTIVE` verlangt `verifiedCertificateCount >= 1`. Dieser Zähler
 *   wird ausschließlich beim **Verifizieren** eines Zertifikats hochgezählt —
 *   und genau dabei hebt das Backend verknüpfte `REVIEW`-Produkte bereits
 *   selbsttätig auf `ACTIVE`. Ein Knopf dafür wäre also entweder überflüssig
 *   (die Freigabe ist schon passiert) oder ein garantierter `400`. Deshalb ist
 *   `REVIEW` in der Oberfläche ein reiner Wartezustand.
 * - Aus `REJECTED` führt im Backend überhaupt kein Übergang heraus.
 *
 * Die Bedingungen für `DRAFT → REVIEW` (Beschreibung, Kategorie, mindestens ein
 * Bild …) prüft weiterhin nur der Server; scheitert es, trägt die Fehlermeldung
 * des `400` den Grund.
 */
import type { ProductStatus } from "@/src/types"

export interface SellerProductTransition {
  /** Zielstatus für `PATCH /api/v1/seller/products/{id}/status`. */
  target: ProductStatus
  /** Beschriftung der Schaltfläche. */
  label: string
}

const TRANSITIONS: Readonly<Record<ProductStatus, readonly SellerProductTransition[]>> = {
  DRAFT: [{ target: "REVIEW", label: "Zur Prüfung einreichen" }],
  REVIEW: [],
  ACTIVE: [{ target: "INACTIVE", label: "Deaktivieren" }],
  INACTIVE: [{ target: "ACTIVE", label: "Aktivieren" }],
  REJECTED: [],
}

/**
 * Die vom Verkäufer selbst auslösbaren Übergänge eines Produkts. Unbekannte
 * oder fehlende Status liefern eine leere Liste — lieber keine Aktion als eine,
 * die der Server ablehnt.
 */
export function sellerProductTransitions(
  status: ProductStatus | string | null | undefined
): readonly SellerProductTransition[] {
  // `hasOwnProperty`, nicht `in`: sonst liefert der Prototyp Treffer wie
  // "toString" und die Oberfläche bekäme eine Funktion statt einer Liste.
  if (!status || !Object.prototype.hasOwnProperty.call(TRANSITIONS, status)) return []
  return TRANSITIONS[status as ProductStatus]
}

/** Ob der Verkäufer `from → to` selbst auslösen darf. */
export function canSellerTransition(
  from: ProductStatus | string | null | undefined,
  to: ProductStatus
): boolean {
  return sellerProductTransitions(from).some((transition) => transition.target === to)
}
