# Management Decisions & Open Questions

## Elysion Sustainable Marketplace

**Erstellt:** 2026-03-31
**Scope:** Frontend (elysion-frontend) + Backend (elysion-marketplace-backend)
**Stand:** Phase 1 (MVP) abgeschlossen; Phase 2 in Planung

---

## Legende

- **OFFEN** — Entscheidung steht aus, blockiert ggf. Weiterentwicklung
- **ENTSCHIEDEN** — Bereits im Code/Architektur umgesetzt; Management kann überschreiben
- **BLOCKER** — Muss vor Go-Live oder vor bestimmtem Feature entschieden werden

---

## I. Zahlungen & Umsatzmodell

### 1.1 Plattformgebühr / Seller-Commission

**Status:** ENTSCHIEDEN (2026-06-01) · **Fee-Modell aktualisiert 2026-06-10** (s. Änderungshinweis) — Frontend umgesetzt, Backend offen

**Entscheidungen:**

- **Höhe:** Default **15 %** Take Rate für neue Seller.
- **Struktur:** **Pro Seller individuell**, vom Admin anpassbar (kein globaler Flat-Satz, keine automatische Volumen-Staffelung).
- **Bezugsgröße:** Provision auf den **Warenwert pro OrderGroup, exkl. Versand**. Versandkosten bleiben provisionsfrei beim Seller.
- **Stripe-Transaktionsgebühr:** trägt der **Seller** und wird **pro Transaktion separat** in der Seller-Abrechnung ausgewiesen (ca. 1,5 % + 0,25 €, **nicht** in die Take Rate eingepreist). Datenquelle ist das **Stripe-Charge-Objekt**. _(geändert 2026-06-10 — zuvor: trägt die Plattform.)_
- **Refund-Gebühren:** Bei Retoure erstattet Stripe die ursprüngliche Transaktionsgebühr **nicht** — diese nicht erstattete Stripe-Fee wird dem Seller von der **nächsten Auszahlung** abgezogen. Die **Elysion-Kommission wird bei Retoure erstattet** (kein Plattform-Verdienst bei Retoure).
- **Chargeback-Kosten:** **15 € Stripe-Fee pro Chargeback + Streitbetrag** werden dem **verursachenden Seller** zugeordnet und von der Auszahlung abgezogen. Elysion kann den Chargeback bei Stripe anfechten; bei Erfolg wird dem Seller rückerstattet.
- **Pilot-Konditionen:** keine Monatsgebühren, keine Startgebühren für Pilot-Seller — Kosten entstehen **nur bei Verkauf** (15 % Take Rate + Stripe-Fees).
- **Seller-Einblick:** Seller sieht im Dashboard pro Bestellung **Brutto, Elysion-Kommission (€) und Stripe-Fee (€)** sowie etwaige **Refund-/Chargeback-Abzüge** und die **Netto-Auszahlung** — **nicht** den Prozentsatz (da Sätze pro Seller variieren).

**Frontend umgesetzt (2026-06-01):**

- Admin-Provisions-Editor pro Seller (`AdminSellerDetail.tsx`, `AdminService.updateSellerCommission`)
- `AdminSellerDetail.commissionRate` (Prozent) im Typmodell
- Seller-Settlements-Tab zeigt Beträge ohne %-Satz (bereits konform)

**Backend offen (Issue):**

- Feld `commissionRate` auf `SellerProfile` (Default 15) + Nutzung in Settlement-Berechnung
- Endpoint `PATCH /api/v1/admin/sellers/{id}/commission`
- `AdminSellerDetail`-Response um `commissionRate` erweitern

**Bereits entschieden (überschreibbar):**

- Beträge werden als Integer (Cent) gespeichert, niemals als Float
- Settlement-Line-Items pro OrderGroup: **Bruttoumsatz → Elysion-Kommission → Stripe-Fee → Refund-Fee-Abzug → Chargeback-Abzug → Netto-Auszahlung**

**Änderungshinweis (2026-06-10):**

Auf Basis beantworteter IT-/Management-Fragen wurde das Fee-Modell präzisiert: Die **Stripe-Transaktionsgebühr trägt nun der Seller** (separat ausgewiesen) statt der Plattform; zusätzlich neu geregelt sind **Refund-Fee-Abzug** und **Chargeback-Abzug** (15 € + Streitbetrag). Technische Grundlage: Stripe Connect, **Destination-Charge-Modell** (Elysion = Platform-Account, Seller = Connected Accounts); das Abrechnungsmodul führt separate Line Items. Umsetzung: Elysion-UG/elysion-marketplace-backend#140 (Backend) · Elysion-UG/elysion-frontend#53 (Frontend-Anzeige).

---

### 1.2 Auszahlungs-Workflow (Seller Payouts)

**Status:** ENTSCHIEDEN (2026-06-01) · **Timing aktualisiert 2026-06-10** (s. Änderungshinweis) — Frontend umgesetzt, Backend offen

**Entscheidungen:**

- **Auslöser:** **Manuelle Admin-Freigabe** an einem **festen Mittwoch-Rhythmus** (keine Selbstauslösung durch Seller). _Festlegung 2026-06-10 (logisch, überschreibbar): für den Pilot **manuell** statt Cron — geringe Stückzahl, manueller Review schützt vor Fehl-/Betrugs-Payouts; **Cron-Automatisierung als spätere Option**._
- **Ausführungsweg:** **Echte Stripe-Auszahlung über Stripe Connect (Express-Accounts)**. Stripe übernimmt KYC/Compliance und IBAN-Verwaltung (→ entschärft §2.1-KYC); die Plattform behält Provisions-Kontrolle (`application_fee`) und Branding.
- **Intervall:** **Wöchentlich** — Auszahlungstag ist **Mittwoch**; ausgezahlt werden alle Settlements, deren 7-Tage-Haltefrist bis dahin abgelaufen ist. _(geändert 2026-06-10 — zuvor: monatlich.)_
- **Haltefrist:** **7 Kalendertage** ab Erfüllung des Auslösers, bevor ein Settlement auszahlbar wird (Schutz im Retouren-/Storno-Fenster). _Festlegung 2026-06-10 (logisch): Kalendertage statt Werktage — vorhersehbar bei fixem Mittwochs-Payout; Stripe-Dispute-/Payout-Fenster sind kalenderbasiert._
- **Mindestbetrag:** **keiner** (zeitbasiert statt betragsbasiert) → kein Vortrag/keine Sperre nötig.
- **Settlement-Auslöser:** ab Order-Status **`DELIVERED`** (unverändert) **+ 7-Tage-Haltefrist**; Auszahlung am darauffolgenden Mittwoch.
- **Benachrichtigung:** **eigene gebrandete Plattform-E-Mail** bei Auszahlung (zusätzlich zu Stripes eigener Benachrichtigung).

> ⚠️ **Scope-Hinweis:** „Echte Stripe-Auszahlung" ist KEIN no-code-MVP-Punkt mehr, sondern ein echtes Backend-Feature (Connect-Onboarding, Webhooks, `createPayout()` ersetzt das bestehende `ConflictException`-Stub). Verschiebt den Funktions-Launch entsprechend.

**Frontend umgesetzt (2026-06-01):**

- Seller-Onboarding-Karte „Auszahlungskonto verbinden" (`SellerPayoutAccountCard.tsx`, `SellerPayoutService`)
- Admin-Tab „Fällige Auszahlungen" mit per-Seller-Freigabe (`AdminFinance.tsx`, `AdminService.listDuePayouts` / `runPayout`)

**Backend offen (Issue):**

- Stripe Connect Express: Account-Erstellung, Onboarding-Link, Status-Webhook
- `GET /seller/payout-account`, `POST /seller/payout-account/onboarding-link`
- `GET /admin/payouts/due`, `POST /admin/payouts/run` (löst Stripe-Transfer/Payout aus)
- `createPayout()` implementieren (ersetzt `ConflictException`)
- Gebrandetes Payout-E-Mail-Template

**Bereits entschieden (überschreibbar):**

- Settlement-Berechtigung: Zahlung erfolgreich UND OrderGroup delivered
- Pro OrderGroup eine eigene Settlement-Zeile

**Änderungshinweis (2026-06-10):**

Auszahlungs-Timing präzisiert (beantwortete IT-Frage): Intervall **monatlich → wöchentlich**, fester **Auszahlungstag Mittwoch**, **7-Tage-Haltefrist** vor Auszahlbarkeit. Der **Auslöser bleibt `DELIVERED`** (kein Wechsel auf reine Stripe-Bestätigung) — schützt vor Auszahlung im Retouren-Fenster. **Logisch festgelegt (2026-06-10):** Haltefrist = **7 Kalendertage**; Freigabe **manuell** an festem Mittwoch (Cron später). Umsetzung: Elysion-UG/elysion-marketplace-backend#111 (Scope auf wöchentlich/Mittwoch/Haltefrist aktualisiert).

---

### 1.3 Stripe-Integration aktivieren

**Status:** OFFEN — BLOCKER (vor Live-Transaktionen)

Das Backend ist production-ready (Stripe API v2026-03-23). Das Frontend nutzt noch einen Mock-Flow.

**Update (2026-05):** Frontend und Backend sind inzwischen voll integriert (Stripe Elements in
`PaymentStep.tsx`). Es fehlt nur noch die **Konfiguration** der Live-Keys — kein Code mehr offen.

**Offene Fragen:**

- Wer hält die Stripe-API-Keys (DevOps, Management) und setzt sie in Prod?
- Wie werden bestehende Test-/Mock-Bestellungen aus der Entwicklung behandelt?

**Bereits entschieden / umgesetzt:**

- Backend: `StripeHttpApiClient` vollständig implementiert (Intent, idempotenter Webhook, Settlement)
- Frontend: Stripe Elements in `PaymentStep.tsx` verdrahtet — benötigt `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Live-Schaltung = Setzen von `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (FE) + `APP_STRIPE_SECRET_KEY`/`APP_STRIPE_WEBHOOK_SECRET` (BE), siehe `docs/LAUNCH_READINESS.md` B1–B3

**Zahlungsarten zum Launch (entschieden 2026-06-10):**

Stripe `PaymentElement` (in `PaymentStep.tsx`) rendert die im Stripe-Dashboard aktivierten Methoden — die Auswahl ist daher primär **Konfiguration + Kommunikation**, kein Checkout-Umbau.

- **Zum Launch:** Kreditkarte (Visa/MC, **3DS2/SCA-Pflicht**), **PayPal** (~2,49 % + 0,35 €), **Apple Pay & Google Pay** (~1,5 %, nur unterstützte Geräte, **Domain-Registrierung** nötig), **Klarna** (2,99 % + 0,35 €, Kauf auf Rechnung — Stripe stellt das Geld direkt bereit).
- **Fast-Follow (nicht Launch):** **SEPA-Lastschrift** — wegen Mandat-Handling zunächst zurückgestellt.
- Gebühren je Methode trägt der **Seller**, separat ausgewiesen (s. §1.1).

Umsetzung: Elysion-UG/elysion-marketplace-backend#141 (Stripe-Methoden/SCA/async-Webhooks) · Elysion-UG/elysion-frontend#55 (Zahlarten-Kommunikation, Apple/Google-Pay-Domain).

---

### 1.4 Rückgaben & Erstattungen

**Status:** ENTSCHIEDEN — Refund-Berechtigungen (2026-06-10); Buyer-Rückgabe-Flow (2026-08-07)

Backend unterstützt vollständige und teilweise Rückerstattungen. Keine Self-Service-UI für Käufer vorhanden.

**Refund-Berechtigungen (entschieden 2026-06-10):**

| Rolle               | Refund auslösen                         | Umfang                                                                                        |
| ------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Seller**          | **Eigenständig, ohne Elysion-Freigabe** | Full + Partial — Marktstandard; Seller kennt den Sachverhalt (Retoure, Defekt, Teillieferung) |
| **Elysion (Admin)** | **Als Eskalation**                      | Full + Partial — wenn Seller nicht reagiert, bei Disputes, bei Betrug                         |
| **Buyer**           | **Nie direkt**                          | Kann nur eine **Rückgabe beantragen** (Antrag, kein Refund)                                   |

- **Settlement-Wirkung:** Bei Refund wird die Elysion-Kommission erstattet, die nicht erstattete Stripe-Fee dem Seller abgezogen (s. §1.1 / Backend #140); Auswirkung auf die Auszahlung über die Haltefrist (§1.2).
- **Buyer-Rückgabe-Flow** (Antrag → Genehmigung → Refund) ist im **Miro-BPMN „Retoure"** spezifiziert und wird als **eigenes Thema** umgesetzt (noch nicht in den unten verlinkten Issues).

**Festlegung (2026-06-10, logisch — Rechtsstandard):**

- **Zeitfenster:** **14 Tage gesetzliches Widerrufsrecht** als Standard (Kulanz darüber hinaus möglich) — konsistent mit dem bereits im Shop ausgewiesenen „14 Tage Widerrufsrecht".
- **Keine Restocking-Gebühr** — beim gesetzlichen Widerruf grundsätzlich unzulässig und passt zur kundenfreundlichen/nachhaltigen Positionierung.

**Festlegung (2026-08-07) — Buyer-Rückgabe-Flow als MVP:**

Der oben als „eigenes Thema" markierte Antragsflow wird als schlanker MVP umgesetzt: **Antrag → Seller-Entscheidung → bestehender Refund-Flow.** Kein Rücksendelabel, keine Sendungsverfolgung, kein Wareneingang — das bleibt einem späteren RMA-Modul vorbehalten.

**Entscheidend dabei: zwei Fälle, unterschieden nach der Widerrufsfrist.**

| Fall                        | Zeitpunkt                         | Seller-Handlung                                                                             |
| --------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------- |
| **Widerruf**                | innerhalb 14 Tagen ab Warenerhalt | **bestätigen**; Ablehnung nur bei gesetzlichen Ausnahmetatbeständen, mit Begründungspflicht |
| **Gewährleistung / Kulanz** | nach Fristablauf                  | freie Entscheidung des Sellers                                                              |

Ein fristgerechter Widerruf ist **nicht ablehnbar** — der Seller bestätigt dort, er entscheidet nicht. Ein Flow, der an dieser Stelle ein wertungsfreies „Ablehnen" anbietet, provoziert genau die Chargeback-Eskalation, die er verhindern soll (`docs/PRE_MORTEM.md` Szenario 4; die Kosten trägt laut §1.1 der Seller).

Der Fall wird **zum Antragszeitpunkt eingefroren** und nicht zur Anzeigezeit neu berechnet.

**Noch offen:**

- Detaillierter Eskalations-/Dispute-Prozess (über die Rollenzuordnung hinaus) — folgt mit dem Miro-BPMN „Retoure".

**Bereits entschieden (überschreibbar):**

- ~~Nur Admins können Erstattungen auslösen (API)~~ → **überholt (2026-06-10):** Seller lösen Full/Partial eigenständig aus, Admin nur als Eskalation
- Käufer-seitiger Rückgabe-Flow: als **Antrag** vorgesehen (kein direkter Refund) — Umsetzung als eigenes Thema (Miro-BPMN)

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#142 (Seller-/Admin-Refund-Berechtigungen) · Elysion-UG/elysion-frontend#56 (Seller-Refund-UI) · Elysion-UG/elysion-frontend#207 (Buyer-Rückgabeantrag) · Elysion-UG/elysion-marketplace-backend#223 (Return-Domain + Antrags-Endpoints).

---

### 1.5 Zahlungsabgleich (Reconciliation)

**Status:** OFFEN

Kein automatischer Abgleich mit Stripe vorhanden.

**Offene Fragen:**

- Wie oft soll ein Abgleich mit Stripe stattfinden (täglich, wöchentlich)?
- Wie werden fehlende Webhooks erkannt und behandelt?
- Wer ist zuständig bei Zahlungsdifferenzen?

---

### 1.6 Payment-Robustheit / Edge-Cases

**Status:** ENTSCHIEDEN (2026-06-10)

Beantwortete IT-Fragen zu Zahlungs-Sonderfällen. Ausgangslage im Code: Stripe captured **sofort** (`automatic_payment_methods`, kein `capture_method=manual`); `OrderExpiryService` storniert abgelaufene Pending-Orders bereits.

**Szenario 1 — Stripe-Autorisierung läuft ab (vor Versandfähigkeit):**

- **Lösung:** **Immediate Capture** (bereits aktiv) + **48h-Versand-SLA** für Seller — Ware muss binnen **48 h** nach Capture versandfähig/versendet sein.
- **Offen (aufgenommen 2026-08-07):** Die Frist rechnet in **Kalenderstunden** (`OrderLifecycleProperties.shippingSlaDuration = Duration.ofHours(48)`). Eine Bestellung, die Freitag 16:00 bezahlt wird, reißt die SLA Sonntag 16:00 — ohne dass der Seller einen Werktag hatte. Zu entscheiden: Frist über Wochenenden pausieren (Werktagsrechnung, dann Feiertagsbehandlung und Länderbezug DE/AT/CH klären), oder stattdessen auf 72 h verlängern, damit ein Wochenende hineinpasst. Spannung zur Brand-Vorgabe „Versand 1–2 Werktage" aus §4.4 beachten. → backend#224

**Szenario 2 — Webhook kommt zu spät (Zahlung existiert, Order bereits storniert):**

- **Lösung:** **Grace Period 30–60 Min.** vor Auto-Stornierung; trifft die Zahlung danach trotzdem ein → **Erstattung** + Kunden-E-Mail („Ihre Zahlung wurde erstattet, bitte bestellen Sie erneut").
- Beantwortet die offene Entscheidung in #121 (Late-Success → **Erstattung**, nicht manuelle Reaktivierung).

> **Präzisierung (2026-08-07):** Die Erstattung läuft im Pilotbetrieb **nicht vollautomatisch**. Das System erkennt den Fall, erzeugt einen **Refund-Vorschlag** und benachrichtigt den Admin; die Auslösung erfolgt per Bestätigung über den bestehenden Refund-Flow (backend#142).
>
> **Der Kern der Entscheidung vom 2026-06-10 bleibt unverändert** — erstattet wird, nicht reaktiviert. Begründung für den Zwischenschritt: Ein Fehler in der TTL- oder Erkennungslogik würde bei Vollautomatik reihenweise gültige Zahlungen erstatten. Der Bestätigungsschritt kostet fast nichts und macht den Fehlerfall harmlos; bei wachsendem Volumen kann er entfallen.
>
> **Gegen die Order-Reaktivierung spricht zusätzlich:** Beim Ablauf der TTL wird der Bestand freigegeben. Bei Einzelstücken und Kleinserien, wie unsere Brands sie führen, ist der Artikel bis zum Zahlungseingang häufig verkauft — die Reaktivierung scheitert dann an der Bestandsprüfung und endet doch bei der Erstattung.

**Szenario 3 — BNPL-Stornierung (Klarna):**

- **Lösung:** Stornierung/Retoure einer Klarna-Order löst **automatisch** eine Klarna-API-Rückbuchung aus, damit der Kunde keine Rechnung über den vollen Betrag erhält. **Pflichtschritt im Retoure-/Refund-Flow** (Klarna ist Launch-Zahlart, s. §1.3).

**Szenario 4 — Vorkasse/Überweisung:**

- **Entscheidung:** **Nicht angeboten** — zu fehleranfällig. (Konsistent mit §1.3: nur Stripe-Methoden.)

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#143 (48h-SLA) · #144 (Klarna-Reversal) · #121 (Grace Period + Refund-Vorschlag) · #224 (SLA über Wochenenden) · Elysion-UG/elysion-frontend#57 (48h-SLA-Anzeige Seller).

---

### 1.7 Settlement-Verbindlichkeit & Einspruchsfrist

**Status:** ENTSCHIEDEN (2026-06-10)

- Die im **Seller-Dashboard angezeigte laufende Übersicht ist unverbindlich** (rein informativ).
- **Verbindlich** ist ausschließlich der **wöchentliche Settlement-Bericht** nach **Ablauf der Einspruchsfrist**.
- **Nachträglich** eingehende Chargebacks, Rückbuchungen oder Korrekturen werden mit dem **jeweils nächsten Settlement** verrechnet (nicht rückwirkend in einen bereits verbindlichen Bericht).

**Festlegung (2026-06-10, logisch):** Die **Einspruchsfrist entspricht der 7-Kalendertage-Haltefrist** (§1.2) — **eine** einzige Frist, kein zweiter Timer. Nach ihrem Ablauf wird der Wochenbericht **verbindlich** und am selben Mittwoch ausgezahlt (Verbindlichkeit + Auszahlung fallen zusammen).

_Im Code bereits umgesetzt: `PayoutProperties.holdPeriod = Duration.ofDays(7)`, dokumentiert als ein Timer für beide Fristen; Kadenz „wöchentlich, fester Mittwoch" in `AdminPayoutService`._

**Festlegung (2026-08-07) — Wirkung eines Einspruchs:**

- Ein Einspruch blockiert **ausschließlich die strittige Zeile**, nicht den gesamten Bericht. Unstrittige Positionen werden normal finalisiert und ausgezahlt; der Streitbetrag bleibt offen und wandert in die Verrechnung mit der Folgeperiode.
- **Konsequenz für das Datenmodell:** Ein Bericht muss zwei Zustände gleichzeitig tragen können — **teilweise finalisiert**. Das ist von Anfang an vorzusehen, nicht nachträglich einzuziehen.
- **Begründung gegen „ganzer Bericht":** Eine strittige Position von zwanzig würde die gesamte Wochenauszahlung aufhalten. Das bestraft den Seller für den Streitfall und erzeugt genau den Druck, der zu Eskalationen führt.

**Festlegung (2026-08-07) — Erfassung:** Der Einspruch läuft über einen **eigenen Seller-Endpoint** (Self-Service im Seller-Portal), nicht über den Support. Kostet Endpoint, DTO, Formular und Tests, liefert dafür einen lückenlosen Audit-Trail darüber, wer wann was bestritten hat. Bei verbindlichen Abrechnungsdokumenten ist das die belastbarere Variante.

**Reihenfolge:** backend#220 (`refund_allocations`) sollte **vor** #145 gebaut werden. Ein Seller, der eine Zeile bestreitet, braucht eine belegbare Einzelbuchung statt einer Rekonstruktion aus Aggregaten.

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#145 (Settlement-Lifecycle informativ→verbindlich, Einspruchsfrist, Verrechnung) · #220 (Refund-Aufteilung als Voraussetzung) · Elysion-UG/elysion-frontend#58 (Dashboard: „unverbindlich"-Kennzeichnung + verbindlicher Wochenbericht).

---

### 1.8 Duplicate Charges / Duplicate Orders

**Status:** ENTSCHIEDEN (2026-06-10) — mehrstufige Prävention, Restfälle manuell

Residual-Duplikate, die durch alle automatischen Ebenen rutschen, werden **manuell** geprüft und entschieden (Storno + Refund oder Freigabe). Mehrstufige Prävention und Ist-Stand im Code:

| #   | Mechanismus                                                                                                | Ebene           | Stand im Code                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| 1   | **Button-Lock** im Checkout (Doppelklick verhindert)                                                       | Frontend        | ✅ vorhanden (`PaymentStep.tsx`, Submit während Request deaktiviert)                          |
| 2   | **Idempotency Key** bei jedem Stripe-Request (+ Stripe-seitiger Unique Constraint)                         | Backend         | ✅ vorhanden (`PaymentIntentService` / `StripeHttpApiClient`)                                 |
| 3   | **Duplikat-Check vor Order-Anlage** (`customer_id` + Cart-Hash < 120 s → bestehende Order zurückgeben)     | Backend         | ⚠️ **fehlt** — nur Duplicate-**PaymentIntent**-Blocking vorhanden, kein Cart-Hash/120 s-Guard |
| 4   | **Webhook-Deduplizierung** (Event-ID, Doppel-Delivery ignorieren)                                          | Backend         | ✅ vorhanden (`providerEventId`-Idempotenz, `recordWebhookDuplicate`)                         |
| 5   | **Täglicher Scan** (gleiche E-Mail + Lieferadresse + Line Items + < 30 min → Flag → manuelle Entscheidung) | Backend + Admin | ⚠️ **fehlt** — kein Scan-Job, keine Admin-Review-Sicht                                        |

**Umsetzung der Lücken:** Elysion-UG/elysion-marketplace-backend#146 (Mechanismus 3 + 5) · Elysion-UG/elysion-frontend#59 (Admin-Review-UI für geflaggte Duplikate).

---

### 1.9 Fehlerkommunikation im Checkout & Payment

**Status:** ENTSCHIEDEN (2026-06-10) — Kommunikationsprinzip

**Grundsatz:** Fehler werden **nur** dann gegenüber dem Kunden kommuniziert, wenn wir sicher sind, dass dem Kunden ein **Nachteil entsteht, der unsere Versprechen überschreitet** (z. B. zugesagte Lieferzeit, ein Zahlungsproblem auf unserer Seite). Interne/transiente Fehler ohne Kundennachteil werden **nicht** aktiv kommuniziert (still behandeln / retryen / loggen).

**Wenn kommuniziert wird, immer offen und transparent:**

1. **welche Instanz** den Fehler verursacht hat (Kunde, Plattform/Elysion, Seller, Zahlungsdienstleister), und
2. die **konkreten Konsequenzen** für den Kunden (was passiert jetzt, was ist zu tun).

Heutiger Stand: generische Meldungen (z. B. „Bestellung konnte nicht abgeschlossen werden", „Zahlung fehlgeschlagen") ohne Instanz-/Konsequenz-Angabe → an das Prinzip anzugleichen.

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#147 (Fehler-Attribution: Instanz + Konsequenz in Payment-/Checkout-Fehlerantworten) · Elysion-UG/elysion-frontend#60 (Checkout-/Payment-Fehlermeldungen an das Prinzip angleichen).

---

## II. Seller-Management & Zertifizierung

### 2.1 Seller-Zulassungsprozess

**Status:** OFFEN — BLOCKER (vor Seller-Onboarding)

Die technische Infrastruktur ist vorhanden. Die Geschäftsregeln für die Zulassung sind nicht definiert.

**Offene Fragen:**

- Automatische Zulassung oder manuelle Prüfung durch Admin?
- Welche Dokumente sind erforderlich (Gewerbeanmeldung, Steuernummer, Zertifikate)?
- Begründungspflicht bei Ablehnung (aktuell kein Mindestlänge für Begründungstext)?
- Einspruchsverfahren nach Ablehnung?
- SLA für Bearbeitungszeit (z. B. 5 Werktage)?

**Bereits entschieden (überschreibbar):**

- Registrierung: User startet als BUYER-Rolle mit `sellerProfile.status = PENDING`
- Admin-Endpunkt: `POST /api/v1/admin/seller-profiles/{id}/approve`
- Nach Freigabe: Rolle wechselt zu SELLER

---

### 2.2 Zertifizierungsstufen (SellerValueProfileLevel)

**Status:** OFFEN

Die Typen `STANDARD | LEVEL_2 | LEVEL_3` sind technisch implementiert, aber semantisch nicht definiert.

**Offene Fragen:**

- Was bedeutet LEVEL_2 und LEVEL_3 in der Praxis (z. B. Anzahl Zertifikate, Prüfungstiefe)?
- Kann ein Seller die Stufe nachträglich ändern?
- Wie werden Käufer über die Bedeutung der Stufen informiert?
- Wie beeinflusst die Stufe das Matching mit Käuferprofilen?

**Bereits entschieden (überschreibbar):**

- Käuferprofil-Typen: `none | simple | extended`
- Matching-Engine ist implementiert (Modul_04)

---

### 2.3 Zertifikatsablauf & Produktstatus

**Status:** ENTSCHIEDEN — überschreibbar

**Aktuelle Implementierung:**

- Produkt benötigt ≥1 verifiziertes Zertifikat für Status ACTIVE
- Abgelaufenes Zertifikat → Produkt wird automatisch INACTIVE
- Admin erhält 30-Tage-Erinnerung vor Ablauf

**Offene Fragen (können bestehende Logik überschreiben):**

- Automatische Deaktivierung ODER zuerst Seller benachrichtigen und Grace-Period geben?
- Wie lang ist die Grace-Period (7 Tage, 14 Tage)?
- Kann Seller das Produkt manuell reaktivieren oder muss er auf Zert-Erneuerung warten?
- Sehen Käufer abgelaufene Produkte noch in der Suche?

---

### 2.4 Zertifikats-Verifikationsprozess (Prüf-SOP)

**Status:** OFFEN — BLOCKER (vor Seller-Onboarding) · _neu aufgenommen 2026-06-10 (Pre-Mortem-Analyse)_

Die technische Verifikation (Admin klickt „verify") ist implementiert — aber es ist nicht definiert, **was der Admin dabei fachlich prüft**. Die Glaubwürdigkeit der Zertifikate ist der Kern-USP der Plattform; ein durchgerutschtes gefälschtes Zertifikat wäre ein PR-Totalschaden (siehe `docs/PRE_MORTEM.md` Szenario 6).

**Offene Fragen:**

- Gegen welche Quellen wird geprüft? (Öffentliche Zertifikatsregister: GOTS Public Database, Fairtrade FLOCERT, OEKO-TEX Label Check etc.)
- Was gilt als gültiger Nachweis — PDF-Scan allein, oder Pflicht-Abgleich von Zertifikatsnummer + Aussteller + Gültigkeitsdatum gegen das Register?
- Vier-Augen-Prinzip bei der Erstverifizierung eines neuen Sellers?
- Stichproben / wiederkehrende Re-Checks bei bestehenden Sellern?
- Eskalationsprozess bei Fälschungsverdacht (Seller-Suspendierung, Produkt-Sofort-Deaktivierung, rechtliche Schritte)?
- Welche Zertifikate/Siegel werden überhaupt anerkannt (Whitelist)?

---

## III. Produkte & Inventar

### 3.1 Produkt-Status-Maschine

**Status:** ENTSCHIEDEN — teilweise überschreibbar

**Aktuelle Übergänge:**

```
DRAFT → REVIEW       (mind. 1 Bild erforderlich)
REVIEW → ACTIVE      (mind. 1 verifiziertes Zertifikat)
REVIEW → REJECTED    (nur Admin)
ACTIVE ↔ INACTIVE    (Seller oder Zertifikatsablauf)
```

**Offene Fragen:**

- Können Seller Produkte im Status REVIEW oder ACTIVE bearbeiten?
- Sehen Seller abgelehnte Produkte und den Ablehnungsgrund?
- Soft-Delete oder Hard-Delete für Produkte?

---

### 3.2 Inventar & Backorders

**Status:** OFFEN

Das Reservierungsmodell ist implementiert. Die Backorder-Logik ist nicht entschieden.

**Offene Fragen:**

- Backorders erlauben oder sofort ablehnen wenn Out-of-Stock?
- Cart-Ablauf-Zeit: Wann werden reservierte Artikel freigegeben?
- Multi-Lager-Unterstützung gewünscht?

**Bereits entschieden (überschreibbar):**

- `PendingOrderExpiryJob` läuft alle 5 Minuten
- Unbezahlte PENDING-Bestellungen werden automatisch storniert
- Lagerreservierungen werden dabei freigegeben

---

### 3.3 Produktbilder — Limits & Optimierung

**Status:** OFFEN

**Offene Fragen:**

- Max. Anzahl Bilder pro Produkt (5, 10, 20)?
- Max. Dateigröße und Auflösung?
- Automatische Komprimierung oder Seller-Pflicht?
- Wasserzeichen / Branding auf Bildern?

**Bereits entschieden (überschreibbar):**

- Aktuell kein Limit implementiert (unlimitierter Upload)
- Keine Bildoptimierung vorhanden

---

### 3.4 Kanonische Varianten-Optionswerte (Farben & Größen)

**Status:** ENTSCHIEDEN (2026-08-07)

Ausgangslage: `variant_options.option_type`/`option_value` waren Freitext, normalisiert nur zur Abfragezeit (`trim` + `lower`). `Rot`/`rot`/`ROT ` fielen zusammen — `rot`/`Rubinrot`/`red` nicht. Die Filter-Facette zeigte damit so viele Einträge, wie es Schreibweisen gab.

**Farben — kanonische Filterfarbe plus freier Anzeigename:**

|                 | Zweck                                       | Pflege             |
| --------------- | ------------------------------------------- | ------------------ |
| **Filterfarbe** | Facette und Filter, ~12–15 kanonische Werte | Admin, feste Liste |
| **Anzeigename** | Darstellung am Produkt, Freitext            | Seller             |

Der Käufer filtert nach `rot`, sieht am Produkt aber `Rubinrot`. Eine reine Lookup-Liste hätte dem Seller die genaue Produktbezeichnung genommen, ein reines Alias-Mapping die Facette nie sauber bekommen.

**Größen — Größensysteme, von Kategorien geteilt:** Eigene Entität mit geordneten Werten (Babygrößen 50/56–86/92, Kindergrößen 98/104–164, Konfektion XS–XXL, Zahlengrößen 36–46). Eine Kategorie verweist auf **ein** System; mehrere Kategorien teilen sich eines. Der Filter bietet in „Babybodys" damit kein `XL` an. Die Werte brauchen eine **eigene Sortierreihenfolge** — alphabetisch ergibt `110/116` vor `98/104` und `L` vor `M` vor `S`.

**Pflege:** ausschließlich Admin. Beim aktuellen Onboarding mit persönlichem Kontakt kein Flaschenhals; bei späterer Selbstbedienung ist ein Beantragungs-Flow nachrüstbar.

**CSV-Import mit unbekannten Werten:** Das Produkt wird **angelegt und im Status `DRAFT` geparkt**, bis die Optionswerte aufgelöst sind; der Import liefert einen Report der offenen Werte. Ablehnen würde Massenimporte an einer einzelnen Farbschreibweise scheitern lassen, ein Sammeleimer „sonstige" die Facette wieder aushöhlen. Der DRAFT-Weg fügt sich in die Zustandsmaschine aus §3.1 ein — ohne aufgelöste Optionswerte besteht ein Produkt den Übergang nach `REVIEW` schlicht nicht.

**Abhängigkeit:** Die Textilkennzeichnungs-Verordnung (§8.4, `elysion-frontend#204`, anwaltliche Prüfung) fasst dieselbe Produktmaske und das `materials`-Modell an. Werden dort strukturierte Faserangaben _anstelle_ von `materials` gefordert, wird ein Teil dieser Arbeit erneut angefasst — bewusst in Kauf genommen. Die Produktmaske ist so zu schneiden, dass Materialangaben austauschbar bleiben.

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#218 · löst die query-seitige Normalisierung aus #136 und den funktionalen Index `V8` ab.

---

## IV. Bestellmanagement & Versand

### 4.1 "Delivered"-Definition

**Status:** OFFEN

**Offene Fragen:**

- Wer markiert eine Bestellung als DELIVERED: Seller, Käufer oder automatisch nach N Tagen?
- Können Käufer eine Lieferung anfechten?
- Wann beginnt das Erstattungsfenster (ab SHIPPED oder ab DELIVERED)?
- Was ist der Settlement-Auslöser (SHIPPED oder DELIVERED)?

**Bereits entschieden (überschreibbar):**

- Seller ruft `POST /api/v1/seller/orders/{id}/deliver` auf
- Käufer hat aktuell keine Bestätigung/Anfechtemöglichkeit

---

### 4.2 Bestellablauf & Auto-Stornierung

**Status:** ENTSCHIEDEN — überschreibbar

**Aktuelle Implementierung:**

- Job läuft alle 5 Minuten
- Unbezahlte PENDING-Bestellungen werden storniert
- Kein Hinweis an Käufer vor Stornierung

**Offene Fragen:**

- Wie lang ist das Zeitfenster bis zur Auto-Stornierung (aktuell unklar, vermutlich 10–15 Min)?
- Sollen Käufer eine Warnung vor Ablauf erhalten?
- Sollen Seller sehen, warum eine Bestellung storniert wurde?

---

### 4.3 Multi-Seller-Bestellungen

**Status:** ENTSCHIEDEN — überschreibbar

**Aktuelle Implementierung:**

- Eine Parent-Order pro Checkout
- Mehrere `OrderGroup`s (eine pro Seller)
- Settlement pro OrderGroup

**Offene Fragen:**

- Soll der Checkout-Flow die Aufschlüsselung nach Seller anzeigen?

**Beantwortet (2026-08-07):**

- ~~Unterschiedliche Versandkosten pro Seller oder Flatrate?~~ → **pro Seller**, siehe §4.4
- ~~Was passiert wenn ein Seller-Artikel storniert wird (Teilerstattung oder Gesamtbestellung neu)?~~ → **Teilerstattung je `OrderGroup`**. Eine order-weite Erstattung ist zusätzlich möglich, aber ausschließlich über den **gesamten Restbetrag** — teilweise order-weite Erstattungen bleiben abgelehnt, weil sie sich keiner Settlement-Zeile eindeutig zuordnen ließen. Die Aufteilung je Seller wird in `refund_allocations` festgehalten (backend#220).

---

### 4.4 Versandkostenmodell je Brand

**Status:** ENTSCHIEDEN (2026-08-07)

Ausgangslage: Versandkosten waren nicht nur unkonfigurierbar, sondern **hart auf 0 verdrahtet** (`OrderCreationService`: `0L` für Steuer und Versand, `total = subtotal`). Jede bisher erzeugte Bestellung hat 0 € Versand.

**Felder je Brand, im Onboarding zu hinterlegen:**

| Feld                 | Typ                                                 | Beispiel                                           |
| -------------------- | --------------------------------------------------- | -------------------------------------------------- |
| Versandkostenstufen  | Stufentabelle (Basis: Bestellwert **oder** Gewicht) | bis 30 €: 4,90 € · bis 60 €: 3,90 € · ab 60 €: 0 € |
| Versanddienstleister | Text                                                | DHL, DPD, GLS …                                    |
| Liefergebiet         | Festwert                                            | DACH (DE/AT/CH)                                    |

**SLA-Vorgabe für unsere Brands:** Versand 1–2 Werktage, Lieferung 3–5 Werktage. (Verhältnis zur technischen 48-h-Eskalationsschwelle aus §1.6 Szenario 1 ist dort als offener Punkt vermerkt.)

**Berechnung:** pro Brand-Gruppe — Zwischensumme bzw. Gewicht → passende Stufe → Freiversand-Schwelle; Summierung über die Gruppen. Das Cart-/Preview-DTO liefert die Versandkosten **pro Brand-Gruppe** plus Gesamtsumme, sonst kann das Frontend die Aufteilung nicht darstellen.

**Default ohne Konfiguration:**

- **Neue Seller:** Pflichtfeld im Onboarding, ohne Konfiguration kein Abschluss.
- **Bereits registrierte Seller:** laufen weiter auf 0 € (unveränderter Ist-Zustand) und erhalten eine Nachpflege-Aufforderung — keine sofortige Sperre, da bei ihnen das Onboarding bereits durch ist.

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#139 · Elysion-UG/elysion-frontend#52.

---

## V. Authentifizierung & Sicherheit

### 5.1 Account-Sperrung bei Fehlversuchen

**Status:** OFFEN — BLOCKER (Sicherheit vor Go-Live)

Aktuell keine Account-Sperre implementiert. Nur IP-basiertes Rate-Limiting (das umgangen werden kann).

**Offene Fragen:**

- Wie viele Fehlversuche vor Sperrung (z. B. 5)?
- Wie lange gesperrt (10 Min, 1 Stunde, bis E-Mail-Reset)?
- Soll der Nutzer bei verdächtiger Aktivität benachrichtigt werden?

---

### 5.2 E-Mail-Verifizierung

**Status:** OFFEN

Backend ist implementiert; ~~der Resend-Endpunkt fehlt im Backend~~ _(überholt — Resend-Endpunkt seit BE#90 vorhanden, verifiziert 2026-06-10)_. E-Mail-Verifizierung ist aktuell optional.

**Offene Fragen:**

- Pflicht-Verifizierung vor Kontoaktivierung?
- Grace-Period für Seller (z. B. 7 Tage verifizieren)?
- Auto-Suspend bei nicht verifizierten Konten nach 30 Tagen?

---

### 5.3 Zwei-Faktor-Authentifizierung (2FA)

**Status:** OFFEN

Noch nicht implementiert.

**Offene Fragen:**

- Pflicht für Admins und/oder Seller?
- Unterstützte Methoden: TOTP-App, SMS, oder beides?
- MVP oder Phase 2?

---

### 5.4 Bekannte Sicherheitslücken (P0 — vor Go-Live beheben)

Diese Punkte sind technische Bugs mit Sicherheitsrelevanz. Management muss Priorität und Zeitplan bestätigen:

_Status-Update 2026-06-10 (Code-/Issue-Verifikation): Punkt 1 ist behoben (BE#61 geschlossen). Punkt 2 ist behoben (BE#149 + FE#32): Backend nutzt Tomcats RemoteIpValve statt client-vertrauendem XFF-Parsing; der Frontend-Auth-Proxy sendet die Vercel-verifizierte Client-IP als `X-Client-IP`, authentifiziert per Shared Secret (`AUTH_PROXY_SECRET` ↔ `APP_AUTH_RATE_LIMIT_TRUSTED_PROXY_SECRET`)._

_Status-Update 2026-06-11 (Verifikation + Fix, BE#150): **Punkt 3 bestätigt und behoben** — `AuthService.refresh()` rotierte ohne Locking; im Parallel-Test erhielten 8 von 8 gleichzeitigen Refreshes mit demselben Token eine gültige Session. Fix: zeilengesperrter Token-Lookup (`SELECT … FOR UPDATE`), Regressionstest in `AuthFlowIT`. **Punkt 4 war bereits behoben** — Reset-/Verifikations-Links werden aus `app.frontend.url` generiert (Unit-Test `AuthServiceLinkGenerationTest` deckt dies ab), Frontend-Route `/reset-password` existiert. **Punkt 5 ist widerlegt** — der enge Cookie-Pfad ist beabsichtigt: Den Refresh-Cookie lesen ausschließlich `/auth/refresh` und `/auth/logout` (beide unter `/api/v1/auth`); eine Verbreiterung auf `/api/v1` würde das langlebige Token unnötig an jeden API-Request senden (Sicherheitsverschlechterung). Damit sind alle Punkte aus §5.4 geschlossen._

| #   | Problem                                                                                | Aufwand | Kritikalität   |
| --- | -------------------------------------------------------------------------------------- | ------- | -------------- |
| 1   | ~~**E-Mail-Constraint lehnt gültige Corporate-Mails ab**~~ ✅ behoben (BE#61)          | —       | erledigt       |
| 2   | ~~**Rate-Limit-Bypass via X-Forwarded-For**~~ ✅ behoben (BE#149 + FE#32)              | —       | erledigt       |
| 3   | ~~**Race-Condition bei Refresh-Token**~~ ✅ bestätigt & behoben (BE#150)               | —       | erledigt       |
| 4   | ~~**Password-Reset-Links zeigen auf Backend**~~ ✅ war bereits behoben (verifiziert)   | —       | erledigt       |
| 5   | ~~**Refresh-Cookie-Pfad zu eng**~~ ❌ widerlegt — enger Pfad ist beabsichtigt (BE#150) | —       | kein Fix nötig |

---

### 5.5 Staging-Credentials im öffentlichen Repo (FE#65)

**Status:** ENTSCHIEDEN & UMGESETZT (2026-06-13) — Option „Entkopplung"

Das Frontend-Repo ist öffentlich; die dokumentierten Seed-Passwörter waren zugleich
gültige Logins der öffentlich erreichbaren Staging-Umgebung (inkl. Admin-Portal).

**Entscheidung:** Staging-Passwörter werden von den dokumentierten Seed-Passwörtern
entkoppelt statt den Zustand zu akzeptieren.

**Umsetzung:**

- Die Staging-Seed-Accounts haben rotierte, zufällige Passwörter — abgelegt
  ausschließlich als GitHub-Secrets (`E2E_*_PASSWORD`). Eine lokale Kopie gibt es
  bewusst nicht.
- `e2e/stage/smoke.spec.ts` hat keine Passwort-Fallbacks mehr; ohne Env-Vars
  werden die Login-Tests übersprungen.
- Die dokumentierten Seed-Passwörter (`Seller123!` etc.) gelten weiterhin
  **nur lokal** — markiert in CLAUDE.md und den lokalen E2E-Specs.
- **Verbindlich:** Produktion wird niemals mit `seed-data.sql` befüllt; die
  Seed-Accounts dürfen in Produktion nicht existieren (relevant für BE#119).

**Nachtrag FE#106 (2026-07-15):** Zwei Korrekturen an der ursprünglichen
Umsetzung, beide beim Aufarbeiten des Klartext-Leaks in CI-Artefakten entdeckt:

- Die hier genannten Ablageorte `~\.elysion\deploy.env` → `STAGE_E2E_*` und das
  Rotationsskript `~\.elysion\seed\rotate-stage-passwords.ts` **existierten auf
  keiner erreichbaren Maschine**; das Skript war nie versioniert. Damit war die
  Rotation faktisch nicht durchführbar. Ersatz: `scripts/rotate-stage-passwords.py`
  im Backend-Repo (dort privat, mit Render-/Neon-IDs).
- „Alle 5 Seed-Accounts" traf nicht zu: GitHub-Secrets existieren nur für
  Admin/Seller/Buyer, und `e2e/buyer.setup.ts` liest sie gar nicht, sondern hat
  lokale Credentials hartkodiert. Rotiert sind die zwei Accounts, die der
  Stage-Smoke tatsächlich nutzt (`seller1@greenthread.dev`,
  `admin@marketplace.dev`) — die übrigen Seed-Accounts tragen weiterhin die
  dokumentierten Passwörter.

---

### 5.6 CSP-Nonce: Klassifikation invertiert (FE#221)

**Status:** ENTSCHIEDEN & UMGESETZT (2026-08-10) — Option „Nonce als Opt-in"

Die Content-Security-Policy wird pro Request in `src/middleware.ts` gesetzt. Bisher
bekam **jede** Route die strikte Nonce-Policy; nur eine handgepflegte Liste
öffentlicher Routen (`PUBLIC_ROUTES`) war davon ausgenommen. Eine Nonce auf einer
statisch vorgerenderten Seite ist aber tödlich: Next stempelt in die zur Bauzeit
erzeugten Bootstrap-Scripts keine passende Nonce, der Browser blockt sie, die
Hydration startet nie — die Seite ist tot. In `next dev` ist das unsichtbar (dort
rendert alles dynamisch) und fällt erst auf Staging auf.

**Belegter Anlass:** `npm run build` gegen `dev` zeigt `/_not-found` als statisch
vorgerendert (`○`). Die Route fiel durch die Ausnahmeliste und bekam die
Nonce-Policy — jeder unbekannte Pfad lieferte damit totes HTML: Header und
Warenkorb auf der 404-Seite funktionslos.

**Entscheidung:** Die Klassifikation wird invertiert. Die Nonce gilt nur noch für
die authentifizierten, dynamisch gerenderten Flächen (Seller-, Admin-, Auth- und
geschützte Buyer-Routen — genau die vier Route-Gruppen mit `force-dynamic`).
Alles andere, inklusive `/_not-found` und jedem unbekannten Pfad, bekommt die
nonce-freie Policy.

Maßgeblich ist die **Fehlerrichtung**, nicht die Fehlerzahl:

| Fehlerfall                        | vorher             | invertiert                        |
| --------------------------------- | ------------------ | --------------------------------- |
| vergessene öffentliche Seite      | Seite **tot**      | läuft                             |
| unbekannter Pfad / `/_not-found`  | Seite **tot**      | läuft                             |
| vergessene authentifizierte Route | läuft, strikte CSP | läuft, **CSP eine Stufe lascher** |

Vorher stand im Fehlerfall ein **Totalausfall**, invertiert der Verlust **einer
Härtungsschicht**: die betroffene Route bekäme `script-src 'unsafe-inline'` statt
der Nonce. Der eigentliche Zugriffsschutz — Session-Gate in der Middleware,
clientseitige Guards, Backend-Autorisierung — bleibt unberührt, und der Rest der
Policy (`connect-src`/`img-src` nur self + Backend-Origin, `object-src 'none'`,
`frame-ancestors 'none'`) begrenzt die Relaxation.

**Restpreis, bewusst offen:** Eine vergessene authentifizierte Route verliert die
Nonce **still** — kein Test schlägt an. Der Drift-Guard aus FE#218 prüft bislang
nur die öffentliche Seite. Ein Gegenstück über die authentifizierten Listen wurde
zurückgestellt und als eigenes Issue nachgezogen (FE#235). Ebenfalls unverändert:
ein Tippfehler unterhalb eines authentifizierten Prefixes (z. B.
`/admin/tippfehler`) rendert weiter das statische `/_not-found` mit Nonce — die
Middleware kennt die Route-Tabelle nicht.

**Nebenbefund (offen, gehört zu FE#37):** `/producer` und `/product` werden
weiterhin dynamisch (`ƒ`) gerendert. Das Akzeptanzkriterium aus FE#37
(„(public)-Routen statisch/ISR") ist damit ausgerechnet für die beiden
SEO-relevanten Shop-Routen nicht erfüllt.

---

## VI. Checkout & Warenkorb

### 6.1 Guest-Checkout

**Status:** OFFEN

Backend unterstützt Gast-Warenkörbe (sessionId-basiert). Frontend-Route existiert als Stub.

**Offene Fragen:**

- Soll Guest-Checkout automatisch ein Konto erstellen?
- Erhalten Gäste Bestell-/Versand-E-Mails?
- Können Gäste Bestellungen ohne Konto tracken?
- Datenspeicherung für Gast-Bestellungen (30, 60, 90 Tage)?

**Bereits entschieden (überschreibbar):**

- Backend: Gast-Carts sind vollständig implementiert
- Frontend: Checkout setzt aktuell authentifizierten User voraus (Gast-Pfad ist Stub)
- Roadmap: Phase 2

---

### 6.2 Rabattcodes / Promo-Codes

**Status:** OFFEN

Kein Rabattsystem implementiert. Nicht im Roadmap erwähnt.

**Offene Fragen:**

- Sollen Rabattcodes unterstützt werden?
- Prozentualer Rabatt oder Festbetrag?
- Plattformweit oder Seller-spezifisch?
- Admin-Interface zur Verwaltung?

---

### 6.3 Abandoned Cart Recovery

**Status:** OFFEN (Phase 3)

**Offene Fragen:**

- E-Mail-Kampagne nach N Stunden bei abgebrochenem Checkout?
- Produkt-Details und ggf. Rabattanreiz?
- Warenkörbe nach X Tagen löschen?

---

## VII. Frontend & UX

### 7.1 `/dev`-Routen in Production

**Status:** ERLEDIGT (2026-04-03)

Die Entwicklerrouten (`/dev/*`, API-Test-Playground) wurden mit Commit `7d7ae13`
(„chore: remove dead files and dev tooling") vollständig gelöscht — die Frage
„schützen oder löschen?" ist damit durch Löschung entschieden. Verifiziert
2026-06-13 gegen Staging: alle `/dev/*`-Pfade liefern 404 (Issue #71).

---

### 7.2 Skeleton Loading States

**Status:** ENTSCHIEDEN (teilweise) — überschreibbar

**Bereits umgesetzt:** Produktliste hat Skeleton-Loading.
**Noch ausstehend:** Warenkorb, Bestellungen, Checkout, OrderDetail.

**Offene Fragen (Priorisierung durch Management):**

- Welche Flows haben Priorität für Skeleton-Implementierung?

---

## VIII. Compliance & Recht

### 8.1 MwSt. / VAT

**Status:** OFFEN

Keine MwSt.-Berechnung oder -Abführungslogik vorhanden.

**Offene Fragen:**

- Muss die Plattform MwSt. ausweisen (B2C)?
- Reverse-Charge für EU-grenzüberschreitende B2B-Transaktionen?
- Welche EU-Länder sind initial im Scope?

---

### 8.2 KYC / Identitätsprüfung für Seller

**Status:** WEITGEHEND GEKLÄRT durch §1.2-Entscheidung (Stripe Connect Express)

> Mit der Entscheidung für **Stripe Connect Express** (§1.2) übernimmt **Stripe** KYC/Identitätsprüfung und Bankdaten-Verifizierung der Seller im Rahmen des Connect-Onboardings. Ein separater KYC-Anbieter ist damit für den Launch nicht erforderlich. Offen bleibt nur die organisatorische Abnahme (Datenschutz/AGB).

Keine eigene Identitätsprüfung für Seller implementiert (an Stripe Connect delegiert).

**Offene Fragen:**

- KYC-Pflicht für Seller (relevant für Geldwäschepravention bei Auszahlungen)?
- Welcher KYC-Anbieter (z. B. Stripe Identity, IDnow)?
- Gilt ab welchem Umsatz oder von Anfang an?

---

### 8.3 DSGVO / Datenspeicherung

**Status:** ENTSCHIEDEN — überschreibbar

**Bereits implementiert:**

- Soft-Delete für Nutzer
- E-Mail-Anonymisierung bei Löschung

**Offene Fragen:**

- Datenspeicherungsfrist für Gast-Bestellungen?
- Recht auf Vergessenwerden für Seller-Bestellungshistorie (steuerrechtliche Aufbewahrungspflicht)?
- Datenschutzbeauftragter benannt?

---

### 8.4 Marketplace-Betreiber-Pflichten (DAC7, VerpackG, GPSR, Textilkennzeichnung, Green Claims)

**Status:** OFFEN — teils BLOCKER · _neu aufgenommen 2026-06-10 (Pre-Mortem-Analyse)_

Diese Pflichten treffen **Elysion als Plattformbetreiber** (nicht nur die Seller) und kommen bislang in keinem Dokument vor (`docs/COMPLIANCE.md` deckt nur Shop-Recht ab: Impressum, AGB, Widerruf, DSGVO, BFSG). Empfehlung: anwaltliche Prüfung explizit auf Betreiber-Pflichten ausweiten.

| Pflicht                            | Kern                                                                                            | Zu entscheiden                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **DAC7 / PStTG**                   | Plattformen müssen Seller-Umsätze jährlich ans BZSt melden                                      | Wer übernimmt die Meldung (Steuerberater?), welche Seller-Daten müssen dafür ab Tag 1 erhoben werden? |
| **VerpackG § 9**                   | Marktplätze dürfen nur für LUCID-registrierte Seller anbieten (Prüfpflicht!)                    | LUCID-Registrierungsnummer als Pflichtfeld im Seller-Onboarding? Prüfprozess?                         |
| **GPSR** (seit 12/2024)            | Verantwortliche Person in der EU + Sicherheitsangaben pro Produkt; Marketplace-Mitverantwortung | Pflichtfelder am Produkt? Prüfung beim Listing?                                                       |
| **Textilkennzeichnungs-VO**        | Faserzusammensetzung ist Pflichtangabe bei Textilien                                            | Material-Angabe vom optionalen Filter zum Pflichtfeld machen?                                         |
| **EmpCo / Green Claims** (ab 2026) | Generische Umweltaussagen („nachhaltig", „klimaneutral") ohne Nachweis werden verboten          | Wording-Richtlinie für Plattform-Texte **und** Seller-Produkttexte; wer prüft Seller-Claims?          |

**Hinweis:** Für eine Plattform, die mit „nachhaltig zertifiziert" wirbt, ist insbesondere EmpCo/Green Claims existenziell — Abmahnrisiko trifft zuerst den sichtbarsten Akteur (die Plattform).

---

### 8.5 Rechnungsstellung (Käufer-Rechnung & Provisionsabrechnung)

**Status:** OFFEN — BLOCKER (spätestens mit erster Abrechnung) · _neu aufgenommen 2026-06-10 (Pre-Mortem-Analyse)_

Es existiert keinerlei Rechnungs-Funktionalität — weder im Datenmodell (`Invoice` fehlt) noch als UI. Stripe liefert nur eine `receiptUrl` (Zahlungsbeleg ≠ Rechnung).

**Offene Fragen:**

- **Käufer-Rechnung:** Wer stellt sie aus — der Seller (Marktplatz-Standard) oder die Plattform im Namen des Sellers? Muss die Plattform den Sellern dafür ein Werkzeug bereitstellen?
- **Provisionsabrechnung:** Elysion muss den Sellern eine **umsatzsteuerkonforme Rechnung über die Provision** stellen (Pflicht der Plattform selbst). Format, Rhythmus (mit dem wöchentlichen Settlement-Bericht, §1.7?), USt-Ausweis?
- Zusammenhang mit §8.1 (MwSt.): ohne VAT-Entscheidung ist keine korrekte Rechnung möglich.
- Aufbewahrung (GoBD, 10 Jahre) — wo werden Rechnungen archiviert?

---

## IX. Infrastruktur & Betrieb

### 9.1 Dateispeicher für Bilder & Dokumente

**Status:** OFFEN

**Offene Fragen:**

- Cloud-Storage (AWS S3, Google Cloud Storage) oder anderes?
- CDN für Produktbilder?

**Beantwortet (2026-08-07):**

- ~~Backup-Strategie für Uploads?~~ → `/app/data/file-assets` (Zertifikatsdokumente, Produktbilder) liegt **außerhalb der Datenbank**; ein DB-Restore ohne diese Dateien liefert eine Datenbank voller Verweise ins Leere. Derselbe periodische Job, der den `pg_dump` erzeugt, archiviert auch das File-Verzeichnis und legt beides **gemeinsam** offsite ab — ein Zeitstempel, ein Wiederherstellungspaket, damit DB- und Dateistand nicht auseinanderlaufen. Details in §9.4.

---

### 9.2 Rate-Limiting bei Skalierung

**Status:** ENTSCHIEDEN — überschreibbar

**Aktuelle Implementierung:** In-Memory, pro Backend-Instanz.

**Offene Fragen:**

- Migration zu Redis-basiertem Rate-Limiting vor horizontaler Skalierung?
- Wann ist horizontale Skalierung geplant?

---

### 9.3 Monitoring & Alerting

**Status:** TEILWEISE ENTSCHIEDEN — Uptime-Monitoring entschieden (2026-08-07); Systemwahl und On-Call offen

**Festlegung (2026-08-07) — minimales Uptime-Monitoring:**

Unabhängig von der Grundsatzentscheidung unten wird ein externer Uptime-Monitor eingerichtet: **Betterstack Free-Tier**, Alarmierung per **E-Mail an beide Entwickler**. Begründung: Der Free-Tier enthält Statuspage und Incident-Timeline; UptimeRobot bietet mehr Monitore, die im Pilot niemand braucht. Das Setup blockiert die spätere Systemwahl nicht und wird bei Bedarf ersetzt.

Überwacht werden zunächst `GET /actuator/health` (Backend Staging) und die Buyer-Frontend-Startseite; mit dem Prod-Aufbau kommen die Prod-URLs und die Erreichbarkeit des Stripe-Webhook-Endpoints dazu.

> **Wichtig bei der Konfiguration:** Check-Timeout auf **~120 s**, nicht auf den Default von 30 s. Der Render-Free-Tier hat einen Kaltstart von 60–90 s; bei zu kurzem Timeout alarmiert der Monitor bei jedem Kaltstart, und die Alarme werden nach zwei Wochen ignoriert — das ist schlimmer als kein Monitoring. Nebeneffekt: Der Monitor übernimmt damit den Keep-Alive-Ping.

**Zusätzlich zu überwachen (2026-08-07):** Die von den externen Connectoren verwendete API-Version, insbesondere bei Shopify. Läuft eine Version aus, führt Shopify die Anfrage stillschweigend gegen die älteste unterstützte Version aus („Fall-Forward") — kein Fehler, nur potenziell verändertes Verhalten. Siehe §13.

**Weiterhin offen:**

- Welches Monitoring-System für Fehler und Performance (Datadog, Grafana, Sentry)?
- Wer ist On-Call bei Zahlungsausfällen?
- SLA für Verfügbarkeit (99,9 %? 99,5 %)?

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#152.

---

### 9.4 Datenbank-Backup & Wiederherstellung

**Status:** ENTSCHIEDEN (2026-08-07) — **BLOCKER** vor Go-Live

Ausgangslage, verifiziert am 2026-08-05 über die Neon-API: Projekt `elysion` läuft auf `free_v3` mit `history_retention_seconds = 21600` — **6 Stunden** Point-in-Time-Recovery. Ein Fehler vom Freitagabend, der Montagfrüh auffällt, ist damit nicht wiederherstellbar. Verschärfend: Die Prod-DB dieses Projekts wurde bereits einmal gelöscht (alter Render-Service), damals ohne Order-Historie.

**Zwei Ebenen:**

| Ebene                              | Zweck                                         | Schützt gegen                                                |
| ---------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| **Neon Paid, PITR 30 Tage**        | präzise Wiederherstellung auf einen Zeitpunkt | Bedienfehler, fehlerhafte Migration, versehentliches Löschen |
| **Periodische `pg_dump`, offsite** | unabhängige Kopie außerhalb des Anbieters     | Account-Verlust, Anbieterausfall, Sperrung                   |

Ein Backup beim selben Anbieter schützt nicht gegen „Account gesperrt" — deshalb beide Ebenen. Die zweite ist bewusst schlicht gehalten und muss keine PITR-Qualität haben. Das File-Verzeichnis aus §9.1 wird im selben Paket archiviert.

**Warum 30 Tage:** Maßgeblich ist nicht die Aufbewahrungspflicht, sondern _wie lange ein Fehler unentdeckt bleiben darf_. 30 Tage decken Urlaub und ruhige Phasen ab; 7 Tage wären das nackte Minimum.

> **Abgrenzung:** Aufbewahrungspflicht und Backup-Retention sind nicht dasselbe. GoBD verlangt, dass Rechnungen 10 Jahre unveränderbar **verfügbar** sind — nicht, dass 10 Jahre PITR vorgehalten wird. Die Zehnjahrespflicht wird über das Rechnungsarchiv aus §8.5 erfüllt. Das entkoppelt beide Themen und hält die Backup-Kosten realistisch.

**Der Restore-Drill ist der eigentliche Wert:** Ein Backup, das nie zurückgespielt wurde, ist eine Vermutung. Er muss einmal real laufen und schriftlich festhalten: Ablauf, Dauer, Prüfschritte danach (Readiness, Login, Produkt-Reads, File-Reads, Order-/Payment-Reads). Die Plan-Entscheidung allein erfüllt das Operations-Gate nicht.

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#192 · verwandt: #122 (Prod-Neuaufbau).

---

## X. Zusammenfassung: Priorisierte Entscheidungsmatrix

### Kritisch — Muss vor Go-Live entschieden sein

| #   | Thema                                                                 | Bereich    | Auswirkung                 |
| --- | --------------------------------------------------------------------- | ---------- | -------------------------- |
| 1   | Seller-Kommissionsmodell (Rate + Struktur)                            | Umsatz     | Blockiert Auszahlungen     |
| 2   | Stripe Live-Aktivierung (Zeitplan)                                    | Umsatz     | Blockiert Einnahmen        |
| 3   | Seller-Zulassungskriterien (Dokumente, manuell/auto)                  | Onboarding | Blockiert Seller-Start     |
| 4   | P0-Sicherheitslücken beheben (E-Mail-Bug, Rate-Limit, Race-Condition) | Sicherheit | Blockiert sicheren Betrieb |
| 5   | Auszahlungs-Workflow (manuell vs. automatisch)                        | Finanzen   | Blockiert Seller-Zahlungen |

### Hoch — Vor Phase-2-Start entscheiden

| #   | Thema                                            | Bereich             |
| --- | ------------------------------------------------ | ------------------- |
| 6   | Erstattungsrichtlinie (Zeitfenster, Genehmigung) | Kundenservice       |
| 7   | Guest-Checkout-Flow                              | Conversion          |
| 8   | E-Mail-Verifizierung (Pflicht oder optional?)    | Vertrauen           |
| 9   | "Delivered"-Definition und Settlement-Auslöser   | Logistik + Finanzen |
| 10  | MwSt./VAT-Handling                               | Compliance          |

### Mittel — Phase 2

| #   | Thema                                      | Bereich                |
| --- | ------------------------------------------ | ---------------------- |
| 11  | 2FA für Admins/Seller                      | Sicherheit             |
| 12  | Zertifizierungsstufen-Semantik (LEVEL_2/3) | Produktdifferenzierung |
| 13  | Produktbild-Limits                         | Storage / UX           |
| 14  | KYC für Seller                             | Compliance             |
| 15  | Dateispeicher-Strategie (S3 o. ä.)         | Infrastruktur          |

### Niedrig — Phase 3

| #   | Thema                              | Bereich               |
| --- | ---------------------------------- | --------------------- |
| 16  | Rabattcodes / Promo-System         | Marketing             |
| 17  | Abandoned Cart Recovery            | Marketing             |
| 18  | Bewertungssystem (Produkte/Seller) | Vertrauen             |
| 19  | Seller Analytics Dashboard         | Seller-Experience     |
| 20  | Mehrsprachigkeit (DE/EN)           | Internationalisierung |

### Neu aufgenommen (2026-06-10 — aus Pre-Mortem-Analyse, `docs/PRE_MORTEM.md`)

| #   | Thema                                                                                      | Bereich              | Einstufung                       |
| --- | ------------------------------------------------------------------------------------------ | -------------------- | -------------------------------- |
| 21  | Zertifikats-Verifikations-SOP (§2.4)                                                       | Vertrauen / Kern-USP | Kritisch — vor Seller-Onboarding |
| 22  | Marketplace-Betreiber-Pflichten (§8.4: DAC7, VerpackG, GPSR, Textil-KennzVO, Green Claims) | Compliance           | Kritisch — teils vor Go-Live     |
| 23  | Rechnungsstellung Käufer + Provisionsrechnung (§8.5)                                       | Finanzen / Steuern   | Kritisch — mit erster Abrechnung |
| 24  | Go-to-Market & Pilot-Erfolgskriterien (§12.1)                                              | Strategie            | Kritisch — vor Launch            |
| 25  | Unit Economics / Seller-Marge (§12.2)                                                      | Strategie            | Hoch                             |

### Entschieden am 2026-08-07

Abgearbeitet aus der Liste der Issues, die auf eine Management-Entscheidung warteten. Details jeweils im genannten Paragraphen.

| Thema                             | §    | Entscheidung                                                                      |
| --------------------------------- | ---- | --------------------------------------------------------------------------------- |
| Buyer-Rückgabe-Flow               | 1.4  | Schlanker MVP; Widerruf wird bestätigt, nicht bewertet                            |
| Late-Success nach Order-Ablauf    | 1.6  | Erstattung bleibt; im Pilot mit Admin-Bestätigungsschritt                         |
| Versand-SLA über Wochenenden      | 1.6  | **neu aufgenommen, offen** — 48 h rechnen in Kalenderstunden                      |
| Einspruch gegen ein Settlement    | 1.7  | Blockiert nur die strittige Zeile; eigener Seller-Endpoint                        |
| Kanonische Varianten-Optionswerte | 3.4  | Filterfarbe + Anzeigename; geteilte Größensysteme; Admin-Pflege; Import als DRAFT |
| Versandkostenmodell je Brand      | 4.4  | Stufentabelle im Onboarding; Pflicht für neue Seller, 0 € für Bestand             |
| Backup für Uploads                | 9.1  | Gemeinsames Wiederherstellungspaket mit dem DB-Dump                               |
| Uptime-Monitoring                 | 9.3  | Betterstack Free + Mail an beide; Timeout 120 s wegen Kaltstart                   |
| Datenbank-Backup                  | 9.4  | Neon Paid, 30 Tage PITR, zusätzlich externe Dumps; Restore-Drill verpflichtend    |
| Externe Systemanbindungen         | 13.1 | Xentral, Tradebyte, Shopware 6, Shopify; Tradebyte zuerst                         |

Ohne eigenen Paragraphen, nur in den Issues dokumentiert: Nachhaltigkeits-Score als `post-launch` eingestuft (backend#217), Refund-Audit-Trail zieht nach `finance_audit_records` (backend#220), Endpoint-Pfad `/seller/products` bleibt (backend#113, geschlossen), GitHub Team für Branch-Protection (backend#123), Design-System-Altlasten (frontend#83).

---

## XI. Bereits getroffene Architekturentscheidungen (nur mit größerem Aufwand änderbar)

Diese Entscheidungen sind tief im Code verankert. Eine Änderung würde Datenbankmigrationen oder größere Refactorings erfordern:

| Entscheidung                               | Beschreibung                                              | Änderungsaufwand                |
| ------------------------------------------ | --------------------------------------------------------- | ------------------------------- |
| **Beträge als Integer-Cent**               | Alle Geldbeträge als BIGINT (Cent), niemals Float         | Sehr hoch — alle Finanztabellen |
| **Kein separates Shop-Konzept**            | 1 Seller = 1 Präsenz, Produkte direkt via `seller_id`     | Hoch — Datenmodell              |
| **Varianten-Preise absolut (nicht Delta)** | `variant.price_cents` ist Absolutpreis, NULL = Basispreis | Mittel                          |
| **Refresh Token per HttpOnly-Cookie**      | Kein localStorage, XSS-sicher                             | Mittel                          |
| **Spring-Page-Format für Produktliste**    | `{ content[], totalElements, totalPages, size, number }`  | Mittel                          |
| **Soft-Delete für User**                   | `deleted_at` Timestamp statt Hard-Delete                  | Mittel — DSGVO-Logik            |
| **Multi-OrderGroup-Modell**                | Eine Parent-Order, N OrderGroups (pro Seller)             | Sehr hoch — Kern-Bestellmodell  |

---

## XII. Geschäftsstrategie & Pilot

_Neu aufgenommen 2026-06-10 (Pre-Mortem-Analyse, siehe `docs/PRE_MORTEM.md`)._

### 12.1 Go-to-Market & Pilot-Erfolgskriterien

**Status:** OFFEN — aus Pre-Mortem-Sicht das größte Einzelrisiko (Szenario 3)

Die gesamte Projektdokumentation enthält kein Go-to-Market-Artefakt. Für einen Two-Sided-Marketplace ist das Henne-Ei-Problem (Seller brauchen Käufer, Käufer brauchen Angebot) das Hauptrisiko — unabhängig von der technischen Qualität.

**Offene Fragen:**

- **Pilot-Definition:** Wie viele Seller, welches GMV-Ziel, welches Zeitfenster? Ab wann gilt der Pilot als Erfolg, ab wann wird abgebrochen/pivotiert?
- **Seller-Akquise:** Wer spricht wie viele Ziel-Seller an (nachhaltige Textil-Labels)? Pipeline, Zuständigkeit, Pitch?
- **Käufer-Akquise:** Welche Kanäle (SEO, Social, Presse, Kooperationen mit den Zertifizierern selbst)? Budget?
- **Launch-Form:** Stiller Soft-Launch mit Pilot-Sellern vs. öffentlicher Launch mit Presse?

### 12.2 Unit Economics / Seller-Marge

**Status:** OFFEN

Das Fee-Modell (§1.1: 15 % Take Rate + Seller trägt Stripe-Fee + Refund-/Chargeback-Abzüge) ist entschieden, aber nie aus Seller-Sicht durchgerechnet. Nachhaltige Textil-Labels haben dünne Margen; Textil-E-Commerce hat 30–50 % Retourenquote.

**Offene Fragen:**

- Beispielrechnung: Was bleibt einem Seller bei einer typischen 60-€-Bestellung netto — und was bei einer retournierten?
- Ab welchem Warenkorbwert ist ein Verkauf für den Seller profitabel? (Relevant für Mindestbestellwert-/Versandkosten-Politik)
- Ist die 15 %-Take-Rate gegenüber Alternativen (eigener Shopify-Shop, Avocadostore, Etsy) konkurrenzfähig argumentierbar?

---

## XIII. Externe Systemanbindungen

### 13.1 Anbindungswege für Brand-Systeme

**Status:** ENTSCHIEDEN — Zielsysteme gesetzt (2026-08-07); Fundamentfragen offen

Brands sollen ihre Produktdaten, Bestände und Bestellungen über ihr **eigenes System** austauschen können, statt CSV zu pflegen. Vier Zielsysteme sind gesetzt:

| System         | Kategorie             | Rolle beim Brand                                |
| -------------- | --------------------- | ----------------------------------------------- |
| **Xentral**    | ERP                   | Warenwirtschaft, Bestand, Auftragsabwicklung    |
| **Tradebyte**  | Marktplatz-Middleware | vermittelt zwischen Marken-ERP und Marktplätzen |
| **Shopware 6** | Shop-System           | eigener Webshop der Marke                       |
| **Shopify**    | Shop-System           | eigener Webshop der Marke                       |

In der Systematik aus backend#172 ist das **Anbindungsweg 3/4** (Weg 1 = CSV/Excel, Weg 2 = Feed). Die Import-Pipeline aus Weg 1 existiert bereits und war ausdrücklich als Engine für die Connectoren angelegt — sie ruft die Command-Services in-process auf, mit derselben Validierung wie das Portal. **Die Connectoren setzen als austauschbare Quell-Adapter davor an, statt vier eigene Import-Implementierungen zu bauen.**

**Tradebyte weicht strukturell ab:** Der Weg heißt dort _Custom Channels_ — Elysion wird als Kanal in TB.One verfügbar, und **Tradebyte setzt den Kanal um**, nicht wir. Ablauf: Account Manager → Kick-off (Zielsystem und Datenaustauschformate) → Aufwandsschätzung durch Tradebyte → Realisierung. Unsere Aufgabe verschiebt sich damit von „Connector implementieren" zu „Schnittstelle spezifizieren, gegen die sie entwickeln". Kosten und Dauer sind nicht öffentlich und nur im Gespräch zu klären.

**Reihenfolge:** Tradebyte zuerst. Xentral bringt bereits einen eigenen Tradebyte-Connector mit — ein Brand mit beiden Systemen erreicht uns möglicherweise schon über den Tradebyte-Kanal, ohne dass wir einen Xentral-Connector bauen.

**Offene Fundamentfragen (gelten systemübergreifend, vor jedem Connector zu klären):**

1. **Wer führt den Bestand?** Führt ihn das Brand-System, ist unser `variant.stock` ein Cache. Overselling ist bei geteiltem Bestand zwischen zwei Syncs kein Randfall, sondern der Regelfall — besonders bei Shopware und Shopify, wo der Brand parallel im eigenen Shop verkauft. Verweis auf §3.2.
2. **Wer führt den Preis?** Und was gilt, wenn ein Seller den Preis im Elysion-Portal ändert?
3. **Bestellungs-Rückschub:** Der Seller versendet aus seinem System. Landet eine Bestellung dort nicht, wird nichts versendet. Push bei `PAID` oder erst nach Widerrufsfrist? Wie kommt Tracking zurück? Was passiert bei Refund/Retoure (§1.4)?
4. **Zugangsdaten je Seller:** verschlüsselte Ablage, Rotation, Verhalten bei abgelaufenem Token.
5. **Mapping auf das Katalogmodell:** Externe Systeme liefern Farben und Größen als Freitext. Jeder Connector braucht eine Mapping-Tabelle je Seller auf die kanonischen Werte aus §3.4; die DRAFT-Parkregel gilt unverändert.
6. **Fehlerverhalten:** Ein Connector, der still nichts mehr synchronisiert, ist schlechter als einer, der laut scheitert. Sichtbarkeit im Sync-Protokoll und im Monitoring (§9.3).

**Technische Randbedingungen je System (Stand 2026-08-07, vor Umsetzung erneut prüfen):**

| System     | Auth                                    | Ereignisse                                               | Besonderheit                                                                                                       |
| ---------- | --------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Xentral    | Personal Access Token, OAuth-Exchange   | Webhooks vorhanden                                       | Drei API-Generationen; V1 tot, **V3 aktuell, viele Endpunkte Beta**                                                |
| Tradebyte  | —                                       | —                                                        | Tradebyte liefert an uns; Custom-Channel-Verfahren                                                                 |
| Shopware 6 | OAuth2 Client Credentials (Integration) | **Webhooks nur im App-System**, nicht über die Admin API | Access-Token lebt **10 Minuten** → Refresh nötig                                                                   |
| Shopify    | OAuth (Custom oder öffentliche App)     | Webhooks, verbrauchen **kein** Rate-Limit-Budget         | GraphQL gesetzt (REST seit 2024-04 Wartungsmodus); **quartalsweise Versionierung**, Fall-Forward scheitert lautlos |

Bei Shopware entscheidet Fundamentfrage 1 damit direkt über den Integrationsweg: kleines Oversell-Fenster → App-System nötig; periodischer Abgleich genügt → Admin API. Das Fundament sollte generell **ereignisbasiert plus periodischer Abgleichlauf** vorsehen, nicht Polling mit Webhooks als Nachrüstung.

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#96 (Fundament) · #225 (Xentral) · #226 (Tradebyte) · #227 (Shopware 6) · #228 (Shopify) · #172 (Anbindungsweg 1, geschlossen).

---

_Dieses Dokument wird laufend aktualisiert. Bei Entscheidungen bitte Datum und Entscheidungsträger ergänzen._
