export const metadata = {
  title: "Datenschutzerklärung — Elysion",
}

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <h1 className="mb-2 text-3xl font-normal text-foreground">Datenschutzerklärung</h1>
      <p className="mb-8 text-sm text-muted-foreground">Stand: [PLATZHALTER: Datum]</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-foreground">1. Verantwortlicher</h2>
        <p className="text-foreground">
          Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
        </p>
        <p className="mt-2 text-foreground">
          Elysion GmbH
          <br />
          [PLATZHALTER: Adresse]
          <br />
          [PLATZHALTER: E-Mail: datenschutz@elysion.de]
          <br />
          [PLATZHALTER: Telefon]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-foreground">
          2. Ihre Rechte als betroffene Person
        </h2>
        <p className="mb-2 text-foreground">Sie haben jederzeit das Recht auf:</p>
        <ul className="ml-5 list-disc space-y-1 text-foreground">
          <li>
            <strong>Auskunft</strong> über die zu Ihrer Person gespeicherten Daten (Art. 15 DSGVO)
          </li>
          <li>
            <strong>Berichtigung</strong> unrichtiger Daten (Art. 16 DSGVO)
          </li>
          <li>
            <strong>Löschung</strong> Ihrer Daten, soweit keine Aufbewahrungspflichten bestehen
            (Art. 17 DSGVO)
          </li>
          <li>
            <strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)
          </li>
          <li>
            <strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO) — Anforderung per E-Mail möglich
          </li>
          <li>
            <strong>Widerspruch</strong> gegen die Verarbeitung (Art. 21 DSGVO)
          </li>
          <li>
            <strong>Widerruf</strong> einer erteilten Einwilligung mit Wirkung für die Zukunft (Art.
            7 Abs. 3 DSGVO)
          </li>
        </ul>
        <p className="mt-3 text-foreground">
          Zur Ausübung Ihrer Rechte wenden Sie sich an:{" "}
          <a
            href="mailto:datenschutz@elysion.de"
            className="text-green-600 underline hover:text-green-600"
          >
            [PLATZHALTER: datenschutz@elysion.de]
          </a>
        </p>
        <p className="mt-2 text-foreground">
          Sie haben außerdem das Recht, sich bei der zuständigen Datenschutz-Aufsichtsbehörde zu
          beschweren. Die für uns zuständige Behörde ist: [PLATZHALTER: Name und Adresse der
          Landesbehörde].
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-foreground">
          3. Erhebung und Verarbeitung personenbezogener Daten
        </h2>

        <h3 className="mb-2 text-base font-semibold text-foreground">3.1 Besuch der Website</h3>
        <p className="mb-4 text-foreground">
          Beim Besuch unserer Website werden vom Browser automatisch technische Daten übermittelt
          (Server-Logfiles): IP-Adresse, Datum und Uhrzeit, aufgerufene URL, Browser und
          Betriebssystem. Diese Daten werden ausschließlich zur Sicherstellung des Betriebs
          verwendet (Art. 6 Abs. 1 lit. f DSGVO) und nach spätestens 7 Tagen gelöscht.
        </p>

        <h3 className="mb-2 text-base font-semibold text-foreground">
          3.2 Registrierung und Konto
        </h3>
        <p className="mb-4 text-foreground">
          Bei der Registrierung erheben wir: Vor- und Nachname, E-Mail-Adresse, Passwort (gehashed).
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Speicherdauer: bis zur
          Kontolöschung, danach gesetzliche Aufbewahrungsfristen (bis zu 10 Jahre für
          steuerrelevante Daten).
        </p>

        <h3 className="mb-2 text-base font-semibold text-foreground">3.3 Bestellungen</h3>
        <p className="mb-4 text-foreground">
          Zur Abwicklung von Bestellungen verarbeiten wir: Lieferadresse, Bestellinhalte,
          Zahlungsdaten. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Weitergabe an: Verkäufer
          (Vertragspartner des Käufers), Zahlungsdienstleister. Speicherdauer: 10 Jahre gemäß
          steuerrechtlicher Aufbewahrungspflicht (§ 147 AO).
        </p>

        <h3 className="mb-2 text-base font-semibold text-foreground">
          3.4 Nachhaltigkeitspräferenzen
        </h3>
        <p className="mb-4 text-foreground">
          Beim Onboarding erfassen wir optional Ihre Nachhaltigkeitspräferenzen (z. B.
          Einkaufsfrequenz, Budget, bevorzugte Zertifizierungen). Diese Daten werden verwendet, um
          personalisierte Produktempfehlungen zu erstellen. Rechtsgrundlage: Art. 6 Abs. 1 lit. a
          DSGVO (Einwilligung). Sie können Ihre Präferenzen jederzeit unter „Meine Präferenzen"
          ändern oder löschen.
        </p>

        <h3 className="mb-2 text-base font-semibold text-foreground">3.5 Newsletter</h3>
        <p className="mb-4 text-foreground">
          Für den Newsletter nutzen wir das Double-Opt-In-Verfahren. Rechtsgrundlage: Art. 6 Abs. 1
          lit. a DSGVO. Sie können den Newsletter jederzeit abbestellen. Abmeldelink ist in jeder
          E-Mail enthalten.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-foreground">
          4. Cookies und lokale Speicherung
        </h2>

        <h3 className="mb-2 text-base font-semibold text-foreground">
          4.1 Technisch notwendige Speicherung
        </h3>
        <p className="mb-4 text-foreground">
          Zur Sitzungsverwaltung (Login-Status) nutzen wir <code>sessionStorage</code> und
          HttpOnly-Cookies. Diese sind für den Betrieb des Dienstes zwingend erforderlich und
          bedürfen keiner Einwilligung (§ 25 Abs. 2 TTDSG).
        </p>

        <h3 className="mb-2 text-base font-semibold text-foreground">
          4.2 Funktionale Speicherung
        </h3>
        <p className="mb-4 text-foreground">
          Mit Ihrer Einwilligung nutzen wir <code>localStorage</code> für: Warenkorb-Daten für nicht
          angemeldete Besucher, Produktanzeige-Cache (für schnellere Ladezeiten im Checkout).
          Rechtsgrundlage: § 25 Abs. 1 TTDSG i. V. m. Art. 6 Abs. 1 lit. a DSGVO. Sie können Ihre
          Einwilligung jederzeit über den Cookie-Banner widerrufen.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-foreground">5. Weitergabe an Dritte</h2>
        <p className="text-foreground">
          Wir geben Ihre Daten nicht ohne Ihre Einwilligung an Dritte weiter, außer:
        </p>
        <ul className="ml-5 mt-2 list-disc space-y-1 text-foreground">
          <li>
            An Verkäufer auf unserer Plattform, soweit dies zur Vertragserfüllung erforderlich ist
          </li>
          <li>An Zahlungsdienstleister zur Zahlungsabwicklung</li>
          <li>An Versanddienstleister zur Zustellung</li>
          <li>An Behörden, wenn wir gesetzlich dazu verpflichtet sind</li>
        </ul>
        <p className="mt-2 text-foreground">
          Alle Datenverarbeitungen außerhalb der EU/EWR erfolgen nur auf Basis von
          Standardvertragsklauseln (Art. 46 DSGVO) oder Angemessenheitsbeschlüssen.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-foreground">6. Hosting</h2>
        <p className="text-foreground">
          Diese Website wird gehostet bei: [PLATZHALTER: Hosting-Anbieter, Adresse]. Mit dem
          Anbieter besteht ein Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-foreground">7. Datenschutzbeauftragter</h2>
        <p className="text-foreground">
          [PLATZHALTER: Falls gesetzlich erforderlich (§ 38 BDSG): Name und Kontakt des
          Datenschutzbeauftragten eintragen. Andernfalls diesen Abschnitt entfernen.]
        </p>
      </section>

      <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
        Diese Datenschutzerklärung enthält Platzhalter (<code>[PLATZHALTER: ...]</code>), die vor
        dem Launch durch echte Angaben ersetzt werden müssen. Bitte durch einen Datenschutzexperten
        oder Rechtsanwalt prüfen lassen.
      </p>
    </div>
  )
}
