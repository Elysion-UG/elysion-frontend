/**
 * SellerProductService — die Produktverwaltung des Verkäuferportals (#227).
 *
 * `GET /api/v1/seller/products` ist die **einzige** Quelle, aus der ein Verkäufer
 * seine eigenen Produkte vollständig sieht. Der öffentliche Katalog
 * (`ProductService.list`) ist backendseitig hart auf `ACTIVE` gefiltert,
 * `POST /api/v1/seller/products` legt aber in `DRAFT` an — über den Katalog
 * gelesen bleibt jedes frisch angelegte Produkt deshalb unsichtbar.
 *
 * Der Verkäufer kommt ausschließlich aus dem Token: der Endpoint kennt **keinen**
 * `sellerId`-Parameter, und dieser Service reicht auch keinen durch.
 *
 * Antwort-Shape: eigenes DTO, nicht das des Katalogs. Die Abweichungen, die beim
 * Abschreiben regelmäßig danebengehen:
 *   - das Feld heißt `name`, nicht `title`
 *   - `primaryImage` ist ein einzelner String (oder `null`), kein `images[]`
 *   - es gibt weder ein `seller`-Objekt noch eine `shortDescription`
 *   - `status` deckt alle fünf internen Status ab, nicht nur `ACTIVE`
 *
 * Die Schreibrouten liegen weiterhin in `ProductService` (create/update/status/
 * Bilder/Varianten) — dieser Service ist bewusst nur der Lesepfad.
 */
import { z } from "zod"
import { apiRequest, buildQuery } from "@/src/lib/api-client"
import { parseApiResponse, productStatusSchema } from "@/src/lib/api-schemas"
import { normalizePage } from "@/src/lib/normalize-page"
import type { Page, ProductStatus, SellerProductListItem } from "@/src/types"

export interface SellerProductListParams {
  /** Optionaler Statusfilter; ohne ihn kommen alle fünf internen Status. */
  status?: ProductStatus
  /** 0-basierter Seitenindex, wie im Backend. */
  page?: number
  /**
   * Seitengröße, Default 20. Das Backend klemmt jeden Wert über **100**
   * stillschweigend ab — wer „alles" über `size=100` holen will, verliert ab dem
   * 101. Produkt Einträge, ohne dass es jemand merkt. Deshalb paginiert die
   * Produktverwaltung echt, statt sich auf eine große Seite zu verlassen.
   */
  size?: number
}

// ── Raw API schemas ───────────────────────────────────────────────────────────
// Gegen `SellerProductListItemResponse` des Backends geschrieben und am Rand
// validiert (parseApiResponse), damit ein umbenanntes Feld laut scheitert statt
// als leere Tabellenzelle durchzurutschen (#38).

const apiSellerProductListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  status: productStatusSchema,
  price: z.number(),
  currency: z.string(),
  primaryImage: z.string().nullable(),
  createdAt: z.string(),
})

const apiSellerProductPageSchema = z.object({
  items: z.array(apiSellerProductListItemSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
})

type ApiSellerProductListItem = z.infer<typeof apiSellerProductListItemSchema>

function normalizeListItem(raw: ApiSellerProductListItem): SellerProductListItem {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    status: raw.status,
    price: raw.price,
    currency: raw.currency,
    primaryImage: raw.primaryImage,
    createdAt: raw.createdAt,
  }
}

async function listSellerProducts(
  params: SellerProductListParams = {}
): Promise<Page<SellerProductListItem>> {
  const raw = await apiRequest<unknown>(
    `/api/v1/seller/products${buildQuery({
      status: params.status,
      page: params.page,
      size: params.size,
    })}`
  )
  const page = parseApiResponse(apiSellerProductPageSchema, raw, "seller-product.list")
  return normalizePage(page, normalizeListItem)
}

export const SellerProductService = {
  /**
   * Eine Seite der eigenen Produkte, neueste zuerst (`createdAt desc, id desc`).
   * Ohne `status` sind alle internen Status enthalten.
   */
  list: listSellerProducts,

  /**
   * Exakte Anzahl der eigenen Produkte je Status — die Zahlen der KPI-Kacheln.
   *
   * Es gibt keinen Aggregat-Endpoint, deshalb je Status eine Anfrage mit
   * `size=1`: interessant ist nur `totalItems`, die Einträge selbst werden
   * verworfen. Über die aktuelle Seite zu zählen wäre falsch, sobald ein
   * Verkäufer mehr Produkte hat als auf eine Seite passen.
   */
  async countByStatus<S extends ProductStatus>(statuses: readonly S[]): Promise<Record<S, number>> {
    const totals = await Promise.all(
      statuses.map((status) => listSellerProducts({ status, size: 1 }).then((p) => p.totalItems))
    )
    return statuses.reduce(
      (acc, status, index) => {
        acc[status] = totals[index]
        return acc
      },
      {} as Record<S, number>
    )
  },
}
