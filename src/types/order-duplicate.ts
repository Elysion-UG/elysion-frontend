import type { OrderStatus } from "./order"

/**
 * Duplicate-Order-Review (Backend-Modul „Duplicate Order Review", #146/#234;
 * MANAGEMENT_DECISIONS.md §1.8, Mechanismus 5).
 *
 * Ein täglicher Backend-Scan flaggt Bestellpaare mit gleicher E-Mail, gleicher
 * Lieferadresse und gleichen Positionen, die weniger als 30 Minuten auseinander
 * liegen. Der Flag ist eine **Beobachtung**, keine Entscheidung — er verlässt
 * `OPEN` ausschließlich durch die manuelle Admin-Entscheidung.
 */
export type OrderDuplicateFlagStatus = "OPEN" | "RESOLVED"

/**
 * Die protokollierte Entscheidung.
 *
 * `RELEASED` — beide Bestellungen sind echt und bleiben bestehen.
 * `CANCELLED_REFUNDED` — der Verdacht hat sich bestätigt, die spätere Bestellung
 * wurde storniert und erstattet.
 *
 * ⚠️ Beides ist reine **Protokollierung**: der Resolve-Endpoint storniert nichts
 * und erstattet nichts (siehe `docs/api-integration.md`).
 */
export type OrderDuplicateResolution = "RELEASED" | "CANCELLED_REFUNDED"

/**
 * Kompakter Bestellkontext an einem Flag. Alle Felder außer `id` können `null`
 * sein — das Backend liefert einen reinen Id-Stub, wenn die Bestellung zum
 * Flag nicht (mehr) geladen werden kann.
 */
export interface OrderDuplicateOrderRef {
  id: string
  orderNumber: string | null
  userId: string | null
  guestEmail: string | null
  status: OrderStatus | null
  paymentStatus: string | null
  /** Bruttosumme als Dezimalwert (Cent sind ein Speicherdetail des Backends). */
  total: number | null
  currency: string | null
}

export interface OrderDuplicateFlag {
  id: string
  status: OrderDuplicateFlagStatus
  /** SHA-256 über E-Mail, Lieferadresse und Positionen — auf beiden Bestellungen identisch. */
  matchSignature: string
  /** Abstand der beiden Bestellungen in Sekunden. */
  secondsApart: number
  detectedAt: string
  /** `null` genau solange `status === "OPEN"`. */
  resolution: OrderDuplicateResolution | null
  /**
   * Begründung des Reviewers. Auch bei einem entschiedenen Flag `null`, wenn
   * keine angegeben wurde — **kein** Indikator für „offen".
   */
  resolutionNote: string | null
  /**
   * Entscheidender Admin. Auch bei einem entschiedenen Flag `null`, wenn dieses
   * Konto zwischenzeitlich gelöscht wurde — **kein** Indikator für „offen".
   */
  resolvedBy: string | null
  /** `null` genau solange `status === "OPEN"`. */
  resolvedAt: string | null
  /** Die **spätere** Bestellung — das mutmaßliche Duplikat. */
  order: OrderDuplicateOrderRef
  /** Die **frühere** Bestellung, die sie duplizieren könnte. */
  duplicateOf: OrderDuplicateOrderRef
}

/** Zählerstände für die Kacheln über der Review-Liste. */
export interface OrderDuplicateStats {
  total: number
  open: number
  resolved: number
}

/** Antwort von `POST /api/v1/admin/orders/duplicates/{id}/resolve`. */
export interface OrderDuplicateResolveResult {
  id: string
  orderId: string
  duplicateOfOrderId: string
  status: OrderDuplicateFlagStatus
  resolution: OrderDuplicateResolution
  resolutionNote: string | null
  resolvedBy: string | null
  resolvedAt: string
}

export interface OrderDuplicateResolveDTO {
  resolution: OrderDuplicateResolution
  /** Optional, max. 500 Zeichen; leer wird backend-seitig als `null` gespeichert. */
  note?: string
}

export interface OrderDuplicateListParams {
  /** 0-basierter Seitenindex. */
  page?: number
  size?: number
  status?: OrderDuplicateFlagStatus
}
