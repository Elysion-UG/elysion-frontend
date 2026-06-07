export const metadata = {
  title: "Allgemeine Geschäftsbedingungen — Elysion",
}

export default function AgbPage() {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <h1 className="mb-2 text-3xl font-bold text-stone-900">
        Allgemeine Geschäftsbedingungen (AGB)
      </h1>
      <p className="mb-8 text-sm text-stone-400">Stand: [PLATZHALTER: Datum]</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">§ 1 Geltungsbereich</h2>
        <p className="text-stone-700">
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Nutzungsverhältnisse zwischen
          der Elysion GmbH, [PLATZHALTER: Adresse] (nachfolgend „Elysion") und den Nutzern der
          Plattform unter [PLATZHALTER: www.elysion.de].
        </p>
        <p className="mt-2 text-stone-700">
          Elysion betreibt einen Marktplatz, auf dem Dritte (Verkäufer) Waren an Verbraucher
          (Käufer) verkaufen.{" "}
          <strong>
            Vertragspartner des Käufers beim Kauf ist der jeweilige Verkäufer, nicht Elysion.
          </strong>{" "}
          Elysion ist lediglich Betreiber der technischen Plattform und vermittelt den
          Vertragsschluss.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">§ 2 Registrierung und Konto</h2>
        <p className="text-stone-700">
          Die Nutzung des Marktplatzes als Käufer setzt eine Registrierung voraus. Mit der
          Registrierung bestätigt der Nutzer, dass er mindestens 18 Jahre alt ist und die AGB
          akzeptiert. Jede natürliche Person darf nur ein Käuferkonto anlegen.
        </p>
        <p className="mt-2 text-stone-700">
          Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und Elysion unverzüglich
          zu benachrichtigen, wenn er Kenntnis von einer missbräuchlichen Nutzung seines Kontos
          erlangt.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">§ 3 Vertragsschluss</h2>
        <p className="text-stone-700">
          Die Darstellung von Produkten auf der Plattform stellt kein bindendes Angebot dar. Durch
          Klicken auf „Zahlungspflichtig bestellen" gibt der Käufer ein verbindliches Angebot zum
          Kauf ab. Der Kaufvertrag kommt durch die Annahme des Verkäufers zustande, die in der Regel
          durch die Versandbestätigung per E-Mail erklärt wird.
        </p>
        <p className="mt-2 text-stone-700">
          Elysion sendet unmittelbar nach Bestelleingang eine automatische Bestellbestätigung. Diese
          stellt noch keine Annahme des Angebots dar, sondern bestätigt lediglich den Eingang der
          Bestellung.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">§ 4 Preise und Zahlung</h2>
        <p className="text-stone-700">
          Alle Preise sind Bruttopreise in Euro und enthalten die gesetzliche Mehrwertsteuer.
          Versandkosten werden gesondert ausgewiesen und sind vom Käufer zu tragen, sofern nicht
          ausdrücklich „versandkostenfrei" angegeben.
        </p>
        <p className="mt-2 text-stone-700">
          Die verfügbaren Zahlungsmethoden werden dem Käufer beim Checkout angezeigt.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">§ 5 Lieferung</h2>
        <p className="text-stone-700">
          Die Lieferbedingungen (Lieferzeit, Liefergebiet, Versandkosten) werden jeweils auf der
          Produktseite angegeben und sind Bestandteil des Kaufvertrags zwischen Käufer und
          Verkäufer. Elysion übernimmt keine Haftung für Lieferverzögerungen durch den Verkäufer
          oder den Versanddienstleister.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">
          § 6 Widerrufsrecht für Verbraucher
        </h2>
        <p className="text-stone-700">
          Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Die vollständige Widerrufsbelehrung
          sowie das Muster-Widerrufsformular finden Sie auf unserer{" "}
          <a href="/widerruf" className="text-sage-600 underline hover:text-sage-800">
            Widerrufsbelehrungsseite
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">§ 7 Gewährleistung</h2>
        <p className="text-stone-700">
          Es gelten die gesetzlichen Gewährleistungsrechte. Der Käufer hat gegenüber dem jeweiligen
          Verkäufer im Fall eines Mangels Anspruch auf Nacherfüllung (Nachbesserung oder
          Ersatzlieferung). Die Verjährungsfrist für Mängelansprüche beträgt bei neuen Waren 2 Jahre
          ab Lieferung (§ 438 Abs. 1 Nr. 3 BGB).
        </p>
        <p className="mt-2 text-stone-700">
          Elysion haftet nicht für Mängelansprüche aus dem Kaufvertrag zwischen Käufer und
          Verkäufer, da Elysion nicht Vertragspartei ist.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">§ 8 Haftung von Elysion</h2>
        <p className="text-stone-700">
          Elysion haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder
          der Gesundheit sowie für vorsätzliche oder grob fahrlässige Pflichtverletzungen von
          Elysion oder seinen Erfüllungsgehilfen.
        </p>
        <p className="mt-2 text-stone-700">
          Für leicht fahrlässige Verletzungen wesentlicher Vertragspflichten haftet Elysion der Höhe
          nach begrenzt auf den vertragstypischen, vorhersehbaren Schaden. Im Übrigen ist die
          Haftung von Elysion für leicht fahrlässiges Verhalten ausgeschlossen.
        </p>
        <p className="mt-2 text-stone-700">
          Elysion ist kein Vertragspartner des Kaufvertrags und übernimmt keine Haftung für die
          Qualität, Sicherheit oder Rechtmäßigkeit der durch Verkäufer angebotenen Produkte.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">§ 9 Nutzungsregeln</h2>
        <p className="text-stone-700">
          Die Nutzung der Plattform für rechtswidrige Zwecke ist untersagt. Elysion behält sich vor,
          Konten bei Verstößen gegen diese AGB oder geltendes Recht zu sperren.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">§ 10 Streitbeilegung</h2>
        <p className="text-stone-700">
          Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage-600 underline hover:text-sage-800"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          . Elysion nimmt nicht freiwillig an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teil.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">
          § 11 Anwendbares Recht und Gerichtsstand
        </h2>
        <p className="text-stone-700">
          Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Für Verbraucher gilt diese
          Rechtswahl nur, soweit der Verbraucher dadurch nicht den Schutz zwingender
          Verbraucherschutzvorschriften seines gewöhnlichen Aufenthaltsstaates verliert.
        </p>
        <p className="mt-2 text-stone-700">
          Gerichtsstand für Kaufleute und juristische Personen des öffentlichen Rechts ist
          [PLATZHALTER: Sitz von Elysion].
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-stone-800">§ 12 Änderungen der AGB</h2>
        <p className="text-stone-700">
          Elysion behält sich vor, diese AGB zu ändern. Änderungen werden dem Nutzer per E-Mail
          mitgeteilt. Widerspricht der Nutzer der Änderung nicht innerhalb von 6 Wochen nach Zugang
          der Mitteilung, gelten die geänderten AGB als akzeptiert. Auf dieses Widerspruchs- und
          Zustimmungsfiktion-Recht wird in der Änderungsmitteilung hingewiesen.
        </p>
      </section>

      <p className="mt-10 border-t border-stone-200 pt-6 text-xs text-stone-400">
        ⚠️ Diese AGB enthalten Platzhalter (<code>[PLATZHALTER: ...]</code>), die vor dem Launch
        durch echte Angaben ersetzt werden müssen. Empfehlung: Rechtliche Prüfung durch einen
        deutschen Rechtsanwalt oder einen spezialisierten Dienst (z. B. IT-Recht Kanzlei,
        Händlerbund, Trusted Shops).
      </p>
    </div>
  )
}
