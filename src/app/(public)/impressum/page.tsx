export const metadata = {
  title: "Impressum — Elysion",
}

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <h1 className="mb-8 text-3xl font-bold text-stone-900">Impressum</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">Angaben gemäß § 5 TMG</h2>
        <p className="text-stone-700">
          Elysion GmbH
          <br />
          [PLATZHALTER: Straße und Hausnummer]
          <br />
          [PLATZHALTER: PLZ] [PLATZHALTER: Stadt]
          <br />
          Deutschland
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">Vertreten durch</h2>
        <p className="text-stone-700">
          [PLATZHALTER: Vor- und Nachname der/des Geschäftsführer/in]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">Kontakt</h2>
        <p className="text-stone-700">
          Telefon: [PLATZHALTER: +49 ...]
          <br />
          E-Mail: [PLATZHALTER: kontakt@elysion.de]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">Registereintrag</h2>
        <p className="text-stone-700">
          Eingetragen im Handelsregister.
          <br />
          Registergericht: [PLATZHALTER: Amtsgericht ...]
          <br />
          Registernummer: [PLATZHALTER: HRB ...]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">Umsatzsteuer-ID</h2>
        <p className="text-stone-700">
          Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:
          <br />
          [PLATZHALTER: DE...]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p className="text-stone-700">
          [PLATZHALTER: Vor- und Nachname]
          <br />
          [PLATZHALTER: Adresse wie oben]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">Online-Streitbeilegung (OS)</h2>
        <p className="text-stone-700">
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage-600 underline hover:text-sage-800"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          <br />
          Unsere E-Mail-Adresse finden Sie oben im Impressum.
        </p>
        <p className="mt-2 text-stone-700">
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">Haftung für Inhalte</h2>
        <p className="text-stone-700">
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
          nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
          Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
          Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
          Tätigkeit hinweisen.
        </p>
        <p className="mt-2 text-stone-700">
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
          allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
          erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
          Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
          entfernen.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">Haftung für Links</h2>
        <p className="text-stone-700">
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
          Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
          Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
          Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf
          mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der
          Verlinkung nicht erkennbar.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">Urheberrecht</h2>
        <p className="text-stone-700">
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
          dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
          der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
          Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind
          nur für den privaten, nicht kommerziellen Gebrauch gestattet.
        </p>
      </section>

      <p className="mt-10 border-t border-stone-200 pt-6 text-xs text-stone-400">
        ⚠️ Dieses Impressum enthält Platzhalter (<code>[PLATZHALTER: ...]</code>), die vor dem
        Launch durch echte Unternehmensdaten ersetzt werden müssen.
      </p>
    </div>
  )
}
