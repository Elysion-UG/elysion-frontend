export const metadata = {
  title: "Widerrufsbelehrung — Elysion",
}

export default function WiderrufPage() {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <h1 className="mb-8 text-3xl font-bold text-stone-900">Widerrufsbelehrung</h1>

      <section className="mb-8 rounded-xl border border-sage-200 bg-sage-50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-stone-800">Widerrufsrecht</h2>
        <p className="text-stone-700">
          Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
          widerrufen.
        </p>
        <p className="mt-3 text-stone-700">
          Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen
          benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw.
          hat.
        </p>
        <p className="mt-3 text-stone-700">
          Um Ihr Widerrufsrecht auszuüben, müssen Sie den jeweiligen Verkäufer (Ihre/n
          Vertragspartner/in — dessen Kontaktdaten befinden sich in der Bestellbestätigung und in
          Ihrem Kundenkonto unter „Meine Bestellungen") mittels einer eindeutigen Erklärung (z. B.
          ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag
          zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular
          verwenden, das jedoch nicht vorgeschrieben ist.
        </p>
        <p className="mt-3 text-stone-700">
          Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung
          des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-stone-800">Folgen des Widerrufs</h2>
        <p className="text-stone-700">
          Wenn Sie diesen Vertrag widerrufen, hat Ihnen der Verkäufer alle Zahlungen, die er von
          Ihnen erhalten hat, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten,
          die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns
          angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens
          binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf
          dieses Vertrags beim Verkäufer eingegangen ist.
        </p>
        <p className="mt-3 text-stone-700">
          Für diese Rückzahlung verwendet der Verkäufer dasselbe Zahlungsmittel, das Sie bei der
          ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich
          etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte
          berechnet.
        </p>
        <p className="mt-3 text-stone-700">
          Der Verkäufer kann die Rückzahlung verweigern, bis er die Waren wieder zurückerhalten hat
          oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je
          nachdem, welches der frühere Zeitpunkt ist.
        </p>
        <p className="mt-3 text-stone-700">
          Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem
          Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an den Verkäufer
          zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der
          Frist von vierzehn Tagen absenden.
        </p>
        <p className="mt-3 text-stone-700">
          Sie tragen die unmittelbaren Kosten der Rücksendung der Waren, sofern der Verkäufer nicht
          ausdrücklich etwas anderes anbietet.
        </p>
        <p className="mt-3 text-stone-700">
          Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust
          auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht
          notwendigen Umgang mit ihnen zurückzuführen ist.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-stone-800">Ausnahmen vom Widerrufsrecht</h2>
        <p className="text-stone-700">
          Das Widerrufsrecht gilt nicht für Verträge zur Lieferung von Waren, die nach
          Kundenspezifikation angefertigt wurden oder eindeutig auf persönliche Bedürfnisse
          zugeschnitten sind (§ 312g Abs. 2 Nr. 1 BGB) sowie für versiegelte Waren, die aus Gründen
          des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind und deren
          Versiegelung nach der Lieferung entfernt wurde.
        </p>
      </section>

      <section className="mb-8 rounded-xl border border-stone-200 bg-stone-50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-stone-800">Muster-Widerrufsformular</h2>
        <p className="mb-4 text-sm text-stone-500">
          (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und
          senden Sie es zurück.)
        </p>

        <div className="space-y-4 text-stone-700">
          <p>An: [PLATZHALTER: Name und Adresse des Verkäufers aus der Bestellbestätigung]</p>

          <p>
            Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den
            Kauf der folgenden Waren (*) / die Erbringung der folgenden Dienstleistung (*)
          </p>

          <p>Bestellt am (*) / erhalten am (*): ___________________________</p>

          <p>Name des/der Verbraucher(s): ___________________________</p>

          <p>Anschrift des/der Verbraucher(s): ___________________________</p>

          <p>
            Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):
            ___________________________
          </p>

          <p>Datum: ___________________________</p>

          <p className="text-sm text-stone-400">(*) Unzutreffendes streichen.</p>
        </div>
      </section>

      <p className="mt-4 text-sm text-stone-500">
        <strong>Hinweis:</strong> Auf unserem Marktplatz sind die jeweiligen Verkäufer Ihre
        Vertragspartner. Die Kontaktdaten des Verkäufers finden Sie in der
        Bestellbestätigungs-E-Mail sowie unter „Meine Bestellungen" in Ihrem Konto.
      </p>

      <p className="mt-10 border-t border-stone-200 pt-6 text-xs text-stone-400">
        ⚠️ Diese Widerrufsbelehrung enthält Platzhalter (<code>[PLATZHALTER: ...]</code>). Vor dem
        Launch durch echte Angaben ersetzen und rechtlich prüfen lassen.
      </p>
    </div>
  )
}
