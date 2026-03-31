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

**Status:** OFFEN — BLOCKER (vor Payout-Feature)

Das Datenbankmodell für Settlements und Auszahlungen ist fertig implementiert. Die Höhe der Plattformgebühr ist jedoch noch nicht festgelegt.

**Offene Fragen:**

- Wie hoch ist die Plattformgebühr (z. B. 10 %, 15 %)?
- Flat-Rate oder volumenbasierte Staffelung?
- Kann die Gebühr pro Seller individuell angepasst werden (Admin UI)?
- Können Seller ihre Abrechnungsdetails einsehen?

**Bereits entschieden (überschreibbar):**

- Beträge werden als Integer (Cent) gespeichert, niemals als Float
- `settlement.platformFee` und `settlement.sellerNet` werden pro OrderGroup berechnet
- Kein Abrechnungs-UI für Admins vorhanden (nur API)

---

### 1.2 Auszahlungs-Workflow (Seller Payouts)

**Status:** OFFEN — BLOCKER (vor Seller-Onboarding)

Das Backend-Modell ist vollständig. Der Auslöser und Ablauf der Auszahlung ist nicht entschieden.

**Offene Fragen:**

- Automatische Auszahlung (täglich/wöchentlich) oder manuelle Admin-Freigabe?
- Wer löst die Auszahlung aus (Admin, Seller, Cronjob)?
- Mindestauszahlungsbetrag (z. B. €50)?
- Was passiert mit Guthaben unter dem Mindestauszahlungsbetrag (Vortrag oder Sperre)?
- Erhalten Seller eine Auszahlungsbenachrichtigung per E-Mail?

**Bereits entschieden (überschreibbar):**

- Settlement-Berechtigung: Zahlung erfolgreich UND OrderGroup delivered
- Pro OrderGroup eine eigene Settlement-Zeile

---

### 1.3 Stripe-Integration aktivieren

**Status:** OFFEN — BLOCKER (vor Live-Transaktionen)

Das Backend ist production-ready (Stripe API v2026-03-23). Das Frontend nutzt noch einen Mock-Flow.

**Offene Fragen:**

- Wann soll die echte Stripe-Integration aktiviert werden?
- Wie werden bestehende Test-/Mock-Bestellungen behandelt?
- Wer hält die Stripe-API-Keys (DevOps, Management)?

**Bereits entschieden (überschreibbar):**

- Backend: `StripeHttpApiClient` ist vollständig implementiert
- Frontend: `PaymentService` & `Checkout.tsx` verwenden noch Mock-Endpunkt

---

### 1.4 Rückgaben & Erstattungen

**Status:** OFFEN

Backend unterstützt vollständige und teilweise Rückerstattungen. Keine Self-Service-UI für Käufer vorhanden.

**Offene Fragen:**

- Können Käufer selbst Rückgaben/Erstattungen beantragen (Account-Bereich)?
- Zeitfenster für Erstattungen (14 Tage, 30 Tage, 60 Tage)?
- Vollerstattung oder Restocking-Gebühr?
- Wer genehmigt Erstattungen (Admin, Seller, automatisch)?
- Eskalationsprozess bei Streitigkeiten?

**Bereits entschieden (überschreibbar):**

- Nur Admins können aktuell Erstattungen auslösen (API)
- Kein Käufer-seitiger Rückgabe-Flow (Phase 2 geplant)

---

### 1.5 Zahlungsabgleich (Reconciliation)

**Status:** OFFEN

Kein automatischer Abgleich mit Stripe vorhanden.

**Offene Fragen:**

- Wie oft soll ein Abgleich mit Stripe stattfinden (täglich, wöchentlich)?
- Wie werden fehlende Webhooks erkannt und behandelt?
- Wer ist zuständig bei Zahlungsdifferenzen?

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

**Status:** OFFEN

Keine Identitätsprüfung für Seller implementiert.

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
