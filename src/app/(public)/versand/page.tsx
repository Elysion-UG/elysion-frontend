import Link from "next/link"

export const metadata = {
  title: "Versand & Preise — Elysion",
  description:
    "Informationen zu Versandkosten, Lieferzeiten und Preisangaben (inkl. MwSt.) bei Elysion.",
}

export default function VersandPage() {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <h1 className="mb-8 text-3xl font-normal text-foreground">Versand &amp; Preise</h1>

      <section className="mb-8 rounded-xl border border-green-600 bg-green-50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Preisangaben</h2>
        <p className="text-foreground">
          Alle auf Elysion angegebenen Preise sind{" "}
          <strong>Endpreise inklusive der gesetzlichen Mehrwertsteuer</strong> und verstehen sich
          zuzüglich der unten beschriebenen Versandkosten (§ 1 PAngV).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Versandkosten</h2>
        <p className="text-foreground">
          Ab einem Bestellwert von <strong>50 €</strong> liefern wir versandkostenfrei. Unterhalb
          dieser Grenze fallen Versandkosten an, die vom jeweiligen Verkäufer festgelegt werden.
        </p>
        <p className="mt-3 text-foreground">
          Elysion ist ein Marktplatz: Ihre Bestellung kann Artikel mehrerer Verkäufer enthalten, für
          die jeweils eigene Versandkosten gelten können. Die{" "}
          <strong>
            konkreten Versandkosten für Ihre Bestellung werden Ihnen vor Abschluss transparent im
            Warenkorb und im Bestellabschluss (Checkout) ausgewiesen
          </strong>{" "}
          — es entstehen keine versteckten Kosten.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Lieferung</h2>
        <p className="text-foreground">
          Der Versand erfolgt durch den jeweiligen Verkäufer. Die Verkäufer versenden Ihre Ware
          zeitnah nach Zahlungseingang; die voraussichtliche Lieferzeit hängt vom gewählten
          Versanddienstleister ab. Sobald Ihre Sendung unterwegs ist, finden Sie den Sendungsstatus
          in Ihrem Kundenkonto unter „Meine Bestellungen".
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Widerruf &amp; Rücksendung</h2>
        <p className="text-foreground">
          Ihr gesetzliches Widerrufsrecht sowie die Regelungen zu Rücksendekosten finden Sie in der{" "}
          <Link href="/widerruf" className="underline hover:text-foreground">
            Widerrufsbelehrung
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
