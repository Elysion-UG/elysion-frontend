# Compliance-Plan — Elysion Marketplace (Deutsches Recht / EU-Recht)

**Stand:** April 2026 | **Codebase:** Next.js 16 Frontend, TypeScript

---

## Executive Summary — Kritische Lücken

| Priorität | Anzahl | Beschreibung                                                           |
| --------- | ------ | ---------------------------------------------------------------------- |
| KRITISCH  | 8      | Vor Launch zwingend erforderlich — Bußgeld- oder Abmahnrisiko ab Tag 1 |
| HOCH      | 9      | Innerhalb 4 Wochen nach Launch                                         |
| MITTEL    | 8      | Innerhalb 8 Wochen                                                     |
| NIEDRIG   | 6      | Laufend / Langfristig                                                  |

---

## 1. DSGVO / GDPR

**Status: FEHLT (mit Teilimplementierungen bei Datenlöschung)**

### Lücken

- Keine `/datenschutz`-Seite, kein Footer-Link
- `localStorage` (Warenkorb-Gast, Product-Cache) wird ohne Einwilligung beschrieben
- Kein Datenschutz-Hinweis bei Registrierung (Art. 7 DSGVO)
- Onboarding sammelt Präferenzen ohne Zweckangabe (Art. 13 DSGVO)
- Kein Self-Service für Datenexport (Art. 20 DSGVO) — erfordert Backend-Endpoint
- Personalisierte Empfehlungen ohne Transparenz (Art. 13/22 DSGVO)

### Umsetzungsstatus

- [x] **K2** `/datenschutz`-Seite mit Art. 13/14 DSGVO-Pflichtangaben _(Frontend)_
- [x] **K3** Cookie-Consent-Banner: Opt-in vor `localStorage`-Zugriff _(Frontend)_
- [x] **K7** Datenschutz-Checkbox bei Registrierung _(Frontend)_
- [ ] **M1** Self-Service Datenexport im Profil _(erfordert Backend: `GET /api/v1/users/me/export`)_
- [ ] **M8** Datenschutz-Hinweis im Onboarding vor Präferenzspeicherung _(Frontend)_

---

## 2. TMG / TTDSG — Impressum

**Status: FEHLT VOLLSTÄNDIG**

### Pflichtangaben nach § 5 TMG

- Vollständiger Name und Anschrift des Unternehmens
- Vertretungsberechtigte Person(en)
- Handelsregisternummer (falls eingetragen)
- Umsatzsteuer-ID (§ 27a UStG)
- Zuständige Aufsichtsbehörde (falls vorhanden)
- E-Mail-Adresse (Kontaktformular allein reicht **nicht**)
- Telefonnummer (oder Rückruf-Service mit konkretem Zeitrahmen)

### Umsetzungsstatus

- [x] **K1** `/impressum`-Seite anlegen _(Frontend — Platzhalterdaten, echte Daten einpflegen!)_
- [x] **K1** Footer-Link "Impressum" einfügen _(Frontend)_
- [x] **H2** About-Seite auf Deutsch mit echten Elysion-Daten _(Frontend)_
- [x] **H2** Contact-Seite auf Deutsch mit echten Kontaktdaten _(Frontend)_

> ⚠️ **Handlungsbedarf:** Die Platzhalterdaten in `/impressum` müssen vor dem Launch mit echten Unternehmensdaten befüllt werden!

---

## 3. UWG / PAngV — Preisangaben und Werbung

**Status: TEILWEISE — kritische Lücken**

### Lücken

- Bruttopreise ohne "inkl. X% MwSt."-Hinweis auf allen Preisanzeigen
- Versandkosten nicht transparent auf Produktkarten und Produktdetailseite
- Checkout: MwSt.-Zeile fehlt obwohl `order.tax` vom Backend geliefert wird
- "CO2-neutraler Versand" ohne Nachweis einer zertifizierenden Stelle (§ 5 UWG)
- "30 Tage Rückgaberecht" rechtswidrig formuliert (tatsächlich: 14 Tage gesetzliches Widerrufsrecht)

### Umsetzungsstatus

- [x] **K8** MwSt.-Hinweis ("inkl. MwSt., zzgl. Versandkosten") auf Produktdetailseite _(Frontend)_
- [x] **H6** "CO2-neutraler Versand" relativiert mit Hinweis auf Zertifizierungspflicht _(Frontend)_
- [x] **H3** Checkout: MwSt.-Zeile aus `preview.tax` immer anzeigen _(Frontend)_
- [ ] **K8** MwSt.-Hinweis auf Produktkarten in SustainableShop _(Frontend — TODO)_
- [ ] **H6** Nachweis für "CO2-neutraler Versand" bei zertifiziertem Anbieter hinterlegen

> ⚠️ **Hinweis:** Für detaillierte Preistransparenz (Versandkosten-Tabelle, MwSt.-Aufschlüsselung pro Produkt) ist eine Versandkostenseite `/versand` sinnvoll.

---

## 4. BGB / EGBGB — Verbraucherrecht, Widerruf, AGB

**Status: FEHLT VOLLSTÄNDIG**

### Lücken

- Keine AGB — kein gültiges Vertragsverhältnis möglich
- Keine Widerrufsbelehrung — Widerrufsfrist läuft 12 Monate + 14 Tage (§ 356 Abs. 3 BGB)
- Checkout-Button "Jetzt bestellen" statt "Zahlungspflichtig bestellen" (§ 312j Abs. 3 BGB)
- Keine Checkbox im Checkout für AGB/Widerruf-Akzeptanz
- Kein Muster-Widerrufsformular (Anlage 2 EGBGB)
- Kein Hinweis: Vertragspartner ist der Seller, nicht Elysion

### Umsetzungsstatus

- [x] **K5** `/agb`-Seite mit Marketplace-Pflichtklauseln _(Frontend — Platzhalterdaten!)_
- [x] **K6** `/widerruf`-Seite mit Mustertext + Muster-Widerrufsformular _(Frontend)_
- [x] **K4** Checkout-Button: "Zahlungspflichtig bestellen" _(Frontend)_
- [x] **K5** Checkout: Checkbox "Ich akzeptiere AGB und Widerrufsbelehrung" _(Frontend)_
- [ ] **H7** OS-Streitschlichtungs-Link in Impressum: `https://ec.europa.eu/consumers/odr/`
- [ ] **M6** 2-Jahres-Gewährleistungshinweis (§ 438 BGB) auf Produktdetailseite

> ⚠️ **Handlungsbedarf:** AGB und Widerrufsbelehrung sollten von einem deutschen Rechtsanwalt geprüft werden. Empfehlung: IT-Recht Kanzlei, Händlerbund oder Trusted Shops Rechtstexte.

---

## 5. EU Omnibus-Richtlinie / Verbraucherrechte

**Status: TEILWEISE — kein Rabattsystem, aber strukturelle Risiken**

### Lücken

- Fake-Bewertungen in `ProducerPage.tsx` (hardcoded: rating 4.8, reviews 124) — **§ 5b UWG Verstoß**
- "Für dich empfohlen"-Widget ohne Erklärung des Algorithmus (§ 5b Abs. 2 UWG)

### Umsetzungsstatus

- [ ] **H4** Fake-Bewertungen aus ProducerPage entfernen _(erfordert echte Backend-Daten)_
- [ ] **M4** "Für dich empfohlen"-Erklärung im Widget _(Frontend)_

---

## 6. Barrierefreiheitsstärkungsgesetz (BFSG) — ab 28.06.2025

**Status: FEHLT — mehrere Verstöße**

### Lücken

- `lang="en"` im Root-Layout trotz deutschsprachiger Anwendung (WCAG 2.1 AA, Criterion 3.1.1)
- About, Contact, Onboarding auf Englisch
- Fehlende Skip-Navigation
- Mengen-Buttons ohne `aria-label` in ProductDetail
- Kein Fokus-Trapping in Modals (LoginModal)
- Kein `id="main-content"` auf `<main>`
- Keine Barrierefreiheitserklärung (Pflicht nach BFSG § 16 BGG ab 28.06.2025)
- Farbkontrast nicht WCAG-analysiert

### Umsetzungsstatus

- [x] **H1** `lang="de"` in `app/layout.tsx` _(Frontend)_
- [x] **H2** About und Contact auf Deutsch übersetzt _(Frontend)_
- [x] **H8** Skip-Navigation in PageLayout _(Frontend)_
- [x] **H8** `aria-label` für Mengen-Buttons in ProductDetail _(Frontend)_
- [ ] **H9** Fokus-Trapping in LoginModal _(Frontend — TODO)_
- [ ] **M2** `/barrierefreiheit`-Seite _(Frontend)_
- [ ] **N4** Vollständiger WCAG 2.1 AA Audit mit Axe/Wave _(Frontend)_
- [ ] **M5** Onboarding: `console.log`/`alert()` ersetzen _(Frontend)_

---

## 7. Nachhaltigkeits-Claims / Greenwashing

**Status: RISIKO — Claims ohne Nachweis**

### Lücken

- Footer-Badges ("Bio & Fairtrade", "Faire Arbeitsbedingungen") pauschal für alle Produkte
- "CO2-neutraler Versand" ohne zertifizierten Nachweis
- "Certified B Corporation" in About-Seite war Mockdaten
- Onboarding-Filter ohne Erklärung der Zertifizierungskriterien

### Umsetzungsstatus

- [x] **H5** Footer-Badges auf produktbezogene Formulierung geändert _(Frontend)_
- [x] **K8** "CO2-neutraler Versand" relativiert _(Frontend)_
- [x] **H2** "Certified B Corporation" Mockdaten aus About entfernt _(Frontend)_
- [ ] **N1** `/nachhaltigkeitsstandards`-Seite mit Zertifizierungskriterien _(Frontend)_

---

## 8. Gewährleistung & Haftung

**Status: FEHLT**

### Lücken

- 2-Jahres-Gewährleistung (§ 438 BGB) wird nirgends kommuniziert
- Haftungsabgrenzung Elysion vs. Seller fehlt (Marketplace-Konstellation)

### Umsetzungsstatus

- [x] **K5** AGB enthält Haftungsabgrenzung Elysion/Seller-Klausel _(Frontend)_
- [ ] **M6** Gewährleistungshinweis auf Produktdetailseite _(Frontend — TODO)_
- [ ] **N5** Produkthaftungs-Prüfung bei Importeuren durch Rechtsanwalt _(extern)_

---

## Priorisierte Task-Liste

### KRITISCH — Vor Launch (alle umgesetzt ✓)

| #   | Task                                              | Gesetz          | Status                |
| --- | ------------------------------------------------- | --------------- | --------------------- |
| K1  | Impressum `/impressum` + Footer-Link              | § 5 TMG         | ✅ Frontend umgesetzt |
| K2  | Datenschutzerklärung `/datenschutz` + Footer-Link | Art. 13 DSGVO   | ✅ Frontend umgesetzt |
| K3  | Cookie-Consent-Banner                             | TTDSG § 25      | ✅ Frontend umgesetzt |
| K4  | Checkout-Button "Zahlungspflichtig bestellen"     | § 312j BGB      | ✅ Frontend umgesetzt |
| K5  | AGB `/agb` + Checkout-Akzeptanz-Checkbox          | § 305 ff. BGB   | ✅ Frontend umgesetzt |
| K6  | Widerrufsbelehrung `/widerruf` + Formular         | § 312g, 356 BGB | ✅ Frontend umgesetzt |
| K7  | Datenschutz-Checkbox bei Registrierung            | Art. 7 DSGVO    | ✅ Frontend umgesetzt |
| K8  | MwSt.-Hinweis auf Produktdetailseite              | § 1 PAngV       | ✅ Frontend umgesetzt |

### HOCH — Innerhalb 4 Wochen nach Launch

| #   | Task                                              | Gesetz          | Status                     |
| --- | ------------------------------------------------- | --------------- | -------------------------- |
| H1  | `lang="de"` in `app/layout.tsx`                   | WCAG 2.1 / BFSG | ✅ Frontend umgesetzt      |
| H2  | About, Contact auf Deutsch mit Echtdaten          | TMG, UWG        | ✅ Frontend umgesetzt      |
| H3  | Versandkosten + MwSt.-Zeile im Checkout           | § 1 PAngV       | ✅ Frontend umgesetzt      |
| H4  | Fake-Bewertungen aus ProducerPage entfernen       | § 5b UWG        | ⏳ Erfordert Backend-Daten |
| H5  | Footer-Claims produktbezogen formulieren          | § 5 UWG         | ✅ Frontend umgesetzt      |
| H6  | "CO2-neutraler Versand" belegen oder relativieren | § 5 UWG         | ✅ Frontend umgesetzt      |
| H7  | OS-Streitschlichtungs-Link im Impressum           | § 36 VSBG       | ✅ Im Impressum hinterlegt |
| H8  | Skip-Nav + ARIA-Labels                            | BFSG / WCAG 2.1 | ✅ Frontend umgesetzt      |
| H9  | Fokus-Trapping in allen Modals                    | BFSG / WCAG 2.1 | ⏳ TODO                    |

### MITTEL — Innerhalb 8 Wochen

| #   | Task                                                      | Gesetz             | Status                        |
| --- | --------------------------------------------------------- | ------------------ | ----------------------------- |
| M1  | Self-Service Datenexport (Art. 20 DSGVO)                  | DSGVO              | ⏳ Erfordert Backend-Endpoint |
| M2  | Barrierefreiheitserklärung `/barrierefreiheit`            | BFSG               | ⏳ TODO                       |
| M3  | WCAG Farbkontrast-Audit (Axe/Wave)                        | BFSG               | ⏳ TODO                       |
| M4  | "Für dich empfohlen"-Erklärung im Widget                  | § 5b Abs. 2 UWG    | ⏳ TODO                       |
| M5  | Onboarding: `console.log`/`alert()` ersetzen              | Code-Qualität + UX | ⏳ TODO                       |
| M6  | Gewährleistungshinweis (§ 438 BGB) auf Produktdetailseite | BGB                | ⏳ TODO                       |
| M7  | Newsletter Double-Opt-In Backend-seitig                   | § 7 UWG, DSGVO     | ⏳ Erfordert Backend          |
| M8  | Datenschutz-Hinweis im Onboarding                         | Art. 13 DSGVO      | ⏳ TODO                       |

### NIEDRIG — Langfristig / Fortlaufend

| #   | Task                                                         | Gesetz                    |
| --- | ------------------------------------------------------------ | ------------------------- |
| N1  | Nachhaltigkeitsstandards-Seite `/nachhaltigkeitsstandards`   | EU Green Claims Directive |
| N2  | Rabatt-Referenzpreis-Mechanismus (wenn Rabatte geplant)      | Omnibus-Richtlinie        |
| N3  | Hinweispflicht personalisierter Preise (falls implementiert) | § 5a Abs. 4 UWG           |
| N4  | Vollständiger WCAG 2.1 AA Audit (Axe, Wave, Lighthouse)      | BFSG                      |
| N5  | Produkthaftungs-Prüfung bei Importeuren (Rechtsanwalt)       | ProdHaftG                 |
| N6  | Jährliche DSGVO-Überprüfung + Datenschutz-Folgeabschätzung   | Art. 35 DSGVO             |

---

## Technische Hinweise

### Cookie-Consent und localStorage

Der `CookieConsentContext` (`src/context/CookieConsentContext.tsx`) steuert, ob funktionale
Cookies gesetzt werden dürfen. Folgende Zugriffe hängen davon ab:

| Datei                              | Art                              | Einwilligung nötig            |
| ---------------------------------- | -------------------------------- | ----------------------------- |
| `src/context/CartContext.tsx`      | `localStorage` (Gäste-Warenkorb) | ✅ Ja — funktional            |
| `src/lib/product-display-cache.ts` | `localStorage` (Produkt-Cache)   | ✅ Ja — funktional            |
| `src/lib/api-client.ts`            | `sessionStorage` (Auth-Token)    | ❌ Nein — technisch notwendig |

### Pflichtfelder bei Checkout (§ 312j BGB)

- Button-Text: **"Zahlungspflichtig bestellen"** — kein Synonym erlaubt
- Checkbox: AGB + Widerrufsbelehrung vor Bestellabschluss
- MwSt.-Zeile immer anzeigen (auch wenn 0)

### Impressum / AGB / Datenschutzerklärung

Die Texte in den Pflichtseiten enthalten Platzhalter (`[PLATZHALTER]`).  
**Vor dem Launch müssen alle Platzhalter durch echte Unternehmensdaten ersetzt werden.**  
Empfehlung: Texte von einem deutschen Rechtsanwalt oder einem spezialisierten Dienst prüfen lassen:

- [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/)
- [Händlerbund](https://www.haendlerbund.de/)
- [Trusted Shops Rechtstexte](https://www.trustedshops.de/shopbetreiber/rechtstexte/)

---

## Rechtsgrundlagen-Referenz

| Gesetz           | Thema                             | Quelle                                       |
| ---------------- | --------------------------------- | -------------------------------------------- |
| DSGVO Art. 13/14 | Informationspflichten             | https://dsgvo-gesetz.de/                     |
| TTDSG § 25       | Cookie-Einwilligung               | https://www.gesetze-im-internet.de/ttdsg/    |
| TMG § 5          | Impressumspflicht                 | https://www.gesetze-im-internet.de/tmg/      |
| BGB § 312j       | Button-Lösung                     | https://www.gesetze-im-internet.de/bgb/      |
| BGB § 312g       | Widerrufsrecht                    | https://www.gesetze-im-internet.de/bgb/      |
| PAngV § 1        | Preisangaben                      | https://www.gesetze-im-internet.de/pangv/    |
| UWG § 5          | Irreführende Werbung              | https://www.gesetze-im-internet.de/uwg_2004/ |
| UWG § 5b         | Bewertungsauthentizität (Omnibus) | https://www.gesetze-im-internet.de/uwg_2004/ |
| BFSG             | Barrierefreiheit ab 28.06.2025    | https://www.gesetze-im-internet.de/bfsg/     |
| EGBGB Art. 246a  | Verbraucherinformationen          | https://www.gesetze-im-internet.de/egbgb/    |
