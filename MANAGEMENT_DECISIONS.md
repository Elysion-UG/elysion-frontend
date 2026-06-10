# Management Decisions & Open Questions

## Elysion Sustainable Marketplace

**Erstellt:** 2026-03-31
**Scope:** Frontend (v0-sustainable-online-shop) + Backend (marketplace-backend)
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

**Status:** TEILWEISE ENTSCHIEDEN — Refund-Berechtigungen entschieden (2026-06-10); Zeitfenster/Restocking offen

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

**Noch offen:**

- Detaillierter Eskalations-/Dispute-Prozess (über die Rollenzuordnung hinaus) — folgt mit dem Miro-BPMN „Retoure".

**Bereits entschieden (überschreibbar):**

- ~~Nur Admins können Erstattungen auslösen (API)~~ → **überholt (2026-06-10):** Seller lösen Full/Partial eigenständig aus, Admin nur als Eskalation
- Käufer-seitiger Rückgabe-Flow: als **Antrag** vorgesehen (kein direkter Refund) — Umsetzung als eigenes Thema (Miro-BPMN)

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#142 (Seller-/Admin-Refund-Berechtigungen) · Elysion-UG/elysion-frontend#56 (Seller-Refund-UI).

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

**Szenario 2 — Webhook kommt zu spät (Zahlung existiert, Order bereits storniert):**

- **Lösung:** **Grace Period 30–60 Min.** vor Auto-Stornierung; trifft die Zahlung danach trotzdem ein → **automatischer Refund** + Kunden-E-Mail („Ihre Zahlung wurde erstattet, bitte bestellen Sie erneut").
- Beantwortet die offene Entscheidung in #121 (Late-Success → **automatischer Refund**, nicht manuelle Reaktivierung).

**Szenario 3 — BNPL-Stornierung (Klarna):**

- **Lösung:** Stornierung/Retoure einer Klarna-Order löst **automatisch** eine Klarna-API-Rückbuchung aus, damit der Kunde keine Rechnung über den vollen Betrag erhält. **Pflichtschritt im Retoure-/Refund-Flow** (Klarna ist Launch-Zahlart, s. §1.3).

**Szenario 4 — Vorkasse/Überweisung:**

- **Entscheidung:** **Nicht angeboten** — zu fehleranfällig. (Konsistent mit §1.3: nur Stripe-Methoden.)

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#143 (48h-SLA) · #144 (Klarna-Reversal) · #121 (Grace Period + Auto-Refund) · Elysion-UG/elysion-frontend#57 (48h-SLA-Anzeige Seller).

---

### 1.7 Settlement-Verbindlichkeit & Einspruchsfrist

**Status:** ENTSCHIEDEN (2026-06-10)

- Die im **Seller-Dashboard angezeigte laufende Übersicht ist unverbindlich** (rein informativ).
- **Verbindlich** ist ausschließlich der **wöchentliche Settlement-Bericht** nach **Ablauf der Einspruchsfrist**.
- **Nachträglich** eingehende Chargebacks, Rückbuchungen oder Korrekturen werden mit dem **jeweils nächsten Settlement** verrechnet (nicht rückwirkend in einen bereits verbindlichen Bericht).

**Festlegung (2026-06-10, logisch):** Die **Einspruchsfrist entspricht der 7-Kalendertage-Haltefrist** (§1.2) — **eine** einzige Frist, kein zweiter Timer. Nach ihrem Ablauf wird der Wochenbericht **verbindlich** und am selben Mittwoch ausgezahlt (Verbindlichkeit + Auszahlung fallen zusammen).

**Umsetzung:** Elysion-UG/elysion-marketplace-backend#145 (Settlement-Lifecycle informativ→verbindlich, Einspruchsfrist, Verrechnung) · Elysion-UG/elysion-frontend#58 (Dashboard: „unverbindlich"-Kennzeichnung + verbindlicher Wochenbericht).

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
- Unterschiedliche Versandkosten pro Seller oder Flatrate?
- Was passiert wenn ein Seller-Artikel storniert wird (Teilerstattung oder Gesamtbestellung neu)?

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

Backend ist implementiert; der Resend-Endpunkt fehlt im Backend. E-Mail-Verifizierung ist aktuell optional.

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

| #   | Problem                                                                                     | Aufwand | Kritikalität                 |
| --- | ------------------------------------------------------------------------------------------- | ------- | ---------------------------- |
| 1   | **E-Mail-Constraint lehnt gültige Corporate-Mails ab** (z. B. `vorname.nachname@domain.de`) | ~2h     | P0 — blockiert Registrierung |
| 2   | **Rate-Limit-Bypass via X-Forwarded-For** (Brute-Force möglich)                             | ~4h     | P0 — Sicherheitsrisiko       |
| 3   | **Race-Condition bei Refresh-Token** (parallele Requests erzeugen 2 gültige Tokens)         | ~3h     | P0 — Session-Hijacking       |
| 4   | **Password-Reset-Links zeigen auf Backend** statt auf Frontend                              | ~2h     | P1 — UX-Blocker              |
| 5   | **Refresh-Cookie-Pfad zu eng** (`/api/v1/auth` statt `/api/v1`)                             | ~1h     | P1                           |

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

**Status:** OFFEN — Sicherheitsrelevant

Entwicklerrouten (`/dev/*`) sind ohne Umgebungsschutz live. Können internen Zustand leaken.

**Offene Fragen:**

- Routen entfernen oder mit Env-Variable schützen?
- Nur für internes Testing behalten oder löschen?

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

## IX. Infrastruktur & Betrieb

### 9.1 Dateispeicher für Bilder & Dokumente

**Status:** OFFEN

**Offene Fragen:**

- Cloud-Storage (AWS S3, Google Cloud Storage) oder anderes?
- CDN für Produktbilder?
- Backup-Strategie für Uploads?

---

### 9.2 Rate-Limiting bei Skalierung

**Status:** ENTSCHIEDEN — überschreibbar

**Aktuelle Implementierung:** In-Memory, pro Backend-Instanz.

**Offene Fragen:**

- Migration zu Redis-basiertem Rate-Limiting vor horizontaler Skalierung?
- Wann ist horizontale Skalierung geplant?

---

### 9.3 Monitoring & Alerting

**Status:** OFFEN

**Offene Fragen:**

- Welches Monitoring-System (Datadog, Grafana, Sentry)?
- Wer ist On-Call bei Zahlungsausfällen?
- SLA für Verfügbarkeit (99,9 %? 99,5 %)?

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

_Dieses Dokument wird laufend aktualisiert. Bei Entscheidungen bitte Datum und Entscheidungsträger ergänzen._
