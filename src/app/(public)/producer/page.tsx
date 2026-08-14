import { Suspense } from "react"
import type { Metadata } from "next"
import ProducerPage from "@/src/components/features/products/ProducerPage"

/**
 * Produzentenseite — statisch vorgerendert (#37).
 *
 * Gleiche Ausgangslage wie `/product` (dort steht die ausführliche Herleitung):
 * `generateMetadata()` las `searchParams` (`?slug=`, ersatzweise `?id=`) und
 * zog daraus Firmenname und Beschreibung. Der `searchParams`-Zugriff nahm der
 * Route das Static Rendering — geliefert hat er nichts, weil `api-client`
 * server-seitig gegen eine relative URL fetcht (`API_BASE` ist im
 * Same-Origin-Proxy-Modus leer, siehe `src/lib/api-base.ts`) und der Aufruf mit
 * `TypeError: Failed to parse URL` im `catch` landete.
 *
 * Auf Staging verifiziert (warmes Backend): `GET /producer?slug=…` liefert
 * `<title>Produzent · Elysion</title>`, also exakt das, was die statische
 * `metadata` unten erzeugt.
 *
 * Der `?id=`-Pfad ist zusätzlich ein Beleg dafür, dass „statisch mit echten
 * Metadaten" auf dieser URL-Form nicht zu haben ist: `producerHref()` fällt für
 * Verkäufer ohne Profil-Slug auf `?id=<uuid>` zurück
 * (Elysion-UG/elysion-marketplace-backend#104) — eine UUID im Query-String ist
 * kein vorrenderbarer Pfadparameter. Echte Produzenten-Metadaten brauchen
 * pfadbasierte URLs plus eine server-taugliche API-Base; siehe #245.
 */
export const metadata: Metadata = {
  title: "Produzent",
}

export default function ProducerPageRoute() {
  return (
    <Suspense>
      <ProducerPage />
    </Suspense>
  )
}
