import Link from "next/link"
import { AlertTriangle } from "lucide-react"

/**
 * Macht die Vertragsgrenze sichtbar, statt sie hinter einem Button zu
 * verstecken: `POST …/duplicates/{id}/resolve` **protokolliert** die
 * Entscheidung nur. Ein Admin-Storno-Endpoint existiert nicht (Backend-Issue
 * #220), die Erstattung läuft über den Finanzbereich. Ohne diesen Hinweis
 * würde „Storniert & erstattet" so aussehen, als hätte die Oberfläche beides
 * ausgeführt.
 */
export default function DuplicateScopeNotice() {
  return (
    <div className="mb-6 flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <div className="space-y-1 text-sm text-sand-page/80">
        <p className="font-medium text-warning">Diese Ansicht protokolliert nur.</p>
        <p>
          Eine Entscheidung setzt den Fall auf <em>entschieden</em> und schreibt sie ins Audit-Log —
          sie storniert nichts und erstattet nichts. Die Erstattung lösen Sie weiterhin unter{" "}
          <Link
            href="/admin/finance"
            className="font-medium text-green-500 underline underline-offset-2 hover:text-green-600"
          >
            Finanzen → Erstattungen
          </Link>{" "}
          aus. Ein Endpoint zum Stornieren einer Bestellung fehlt derzeit noch (Backend-Issue #220);
          bis dahin bleibt der Storno ein manueller Schritt außerhalb dieses Portals.
        </p>
      </div>
    </div>
  )
}
