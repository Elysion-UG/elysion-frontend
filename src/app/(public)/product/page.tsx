import { Suspense } from "react"
import type { Metadata } from "next"
import ProductDetail from "@/src/components/features/products/ProductDetail"

/**
 * Produktdetailseite — statisch vorgerendert (#37).
 *
 * ## Warum hier `metadata` steht und kein `generateMetadata`
 *
 * Bis zu diesem Commit las `generateMetadata()` die `searchParams` (`?slug=`)
 * und holte darüber Titel, Description und OG-Bild des Produkts. Das hatte zwei
 * Effekte — einen gewollten und einen tatsächlichen:
 *
 *   • **Gewollt:** pro Produkt eigene Metadaten für Suche und Link-Previews.
 *   • **Tatsächlich:** jeder Zugriff auf `searchParams` nimmt der Route das
 *     Static Rendering. `/product` war deshalb als einzige Shop-Route neben
 *     `/producer` weiterhin `ƒ` — Per-Request-SSR ohne CDN-Cache.
 *
 * Der gewollte Effekt trat nie ein. Die Services laufen über `api-client`,
 * dessen `API_BASE` bewusst leer ist (Same-Origin-Proxy-Modus, siehe
 * `src/lib/api-base.ts` sowie #148/#153) — server-seitig wird daraus
 * `fetch("/api/v1/…")`, und eine relative URL kann Node nicht auflösen
 * (`TypeError: Failed to parse URL`). Das `catch` unten hat den Fehler
 * verschluckt und immer den generischen Titel geliefert.
 *
 * Auf Staging verifiziert (warmes Backend, ~110 ms Antwortzeit, also kein
 * Kaltstart-Timeout): `GET /product?slug=fair-trade-pullover` liefert
 * `<title>Produkt · Elysion</title>` und keine produktspezifischen OG-Tags.
 *
 * Die statische `metadata` unten erzeugt exakt dieselbe Ausgabe wie der
 * `catch`-Zweig vorher. Der Umbau kostet also keine einzige Meta-Angabe — er
 * entfernt nur den Per-Request-Render, der keine erzeugt hat.
 *
 * ## Wie echte Produkt-Metadaten zurückkommen
 *
 * Nicht durch Wiedereinführen von `generateMetadata({ searchParams })` — das
 * macht die Route wieder `ƒ` und bleibt auf einer Query-Param-URL wirkungslos,
 * weil Next nur nach Pfad vorrendert. Nötig sind zwei Dinge zusammen:
 * pfadbasierte URLs (`/product/[slug]`) mit ISR und eine server-taugliche
 * API-Base (`API_URL`) für den Metadaten-Fetch. Beides ändert öffentliche URLs
 * und ist deshalb als #245 herausgelöst. Der Drift-Guard in `page.test.ts`
 * hält die Route so lange statisch.
 */
export const metadata: Metadata = {
  title: "Produkt",
}

export default function ProductPage() {
  return (
    <Suspense>
      <ProductDetail />
    </Suspense>
  )
}
