# Compliance — Deutsches Recht / EU-Recht

Rechtliche Pflichten der Plattform und ihr Umsetzungsstand. Die Tabellen unten sind
die **einzige** Statusquelle; Launch-Blocker mit Begründung stehen in
[`LAUNCH_READINESS.md`](./LAUNCH_READINESS.md) (B4).

> **Kein Ersatz für Rechtsberatung.** Rechtstexte und Gesetzesverweise gehören vor
> dem Launch anwaltlich geprüft — die Prüfung muss auch die
> Marktplatz-Betreiberpflichten umfassen, nicht nur die Textbausteine
> (siehe [`MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md) §8.4 und
> [`PRE_MORTEM.md`](./PRE_MORTEM.md) Szenario 2).
> Anbieter für geprüfte Texte: [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/),
> [Händlerbund](https://www.haendlerbund.de/),
> [Trusted Shops](https://www.trustedshops.de/shopbetreiber/rechtstexte/).

---

## KRITISCH — vor Launch

| #   | Aufgabe                                            | Gesetz          | Status                                |
| --- | -------------------------------------------------- | --------------- | ------------------------------------- |
| K1  | Impressum `/impressum` + Footer-Link               | § 5 DDG         | ✅ Seite steht — Echtdaten offen      |
| K2  | Datenschutzerklärung `/datenschutz` + Footer-Link  | Art. 13 DSGVO   | ✅ Seite steht — Echtdaten offen      |
| K3  | Cookie-Consent-Banner                              | § 25 TDDDG      | ✅                                    |
| K4  | Checkout-Button „Zahlungspflichtig bestellen"      | § 312j BGB      | ✅                                    |
| K5  | AGB `/agb` + Checkout-Akzeptanz-Checkbox           | § 305 ff. BGB   | ✅ Seite steht — Echtdaten offen      |
| K6  | Widerrufsbelehrung `/widerruf` + Musterformular    | § 312g, 356 BGB | ✅ Seite steht — Echtdaten offen      |
| K7  | Datenschutz-Checkbox bei Registrierung             | Art. 7 DSGVO    | ✅                                    |
| K8  | MwSt.-Hinweis auf der Produktdetailseite           | § 1 PAngV       | ✅ `PriceWithStock.tsx`               |
| K8b | MwSt.-Hinweis auf den Produktkarten im Shop        | § 1 PAngV       | ✅ `ProductCard.tsx` (#155)           |
| K8c | `/versand`-Seite (Versandkosten + MwSt.), verlinkt | § 1 PAngV       | ✅ `(public)/versand` + Footer (#155) |

> **Blocker B4:** Die Seitengerüste existieren, die Texte enthalten aber noch
> `[PLATZHALTER]` (Impressum ~15×, Datenschutz ~8×, AGB ~4×, Widerruf ~2×) sowie
> Platzhalter-Kontaktdaten in `Contact.tsx` und im Footer. Ohne echte Daten sind
> Impressumspflicht, Datenschutzerklärung und Widerrufsbelehrung nicht erfüllt.

## HOCH — innerhalb 4 Wochen nach Launch

| #   | Aufgabe                                           | Gesetz          | Status                                                          |
| --- | ------------------------------------------------- | --------------- | --------------------------------------------------------------- |
| H1  | `lang="de"` im Root-Layout                        | WCAG 2.1 / BFSG | ✅                                                              |
| H2  | About + Contact auf Deutsch mit Echtdaten         | DDG, UWG        | ✅                                                              |
| H3  | Versandkosten- + MwSt.-Zeile im Checkout          | § 1 PAngV       | ✅                                                              |
| H4  | Fake-Bewertungen aus ProducerPage entfernen       | § 5b UWG        | ✅ (2026-05-31)                                                 |
| H5  | Footer-Claims produktbezogen formulieren          | § 5 UWG         | ✅                                                              |
| H6  | „CO2-neutraler Versand" belegen oder relativieren | § 5 UWG         | ✅ relativiert — Nachweis bei zertifiziertem Anbieter steht aus |
| H7  | OS-Streitschlichtungs-Link im Impressum           | § 36 VSBG       | ✅                                                              |
| H8  | Skip-Navigation + ARIA-Labels für Mengen-Buttons  | BFSG / WCAG 2.1 | ✅                                                              |
| H9  | Fokus-Trapping in **allen** Modals                | BFSG / WCAG 2.1 | ⏳ `useFocusTrap` existiert, u.a. LoginModal offen → #11        |

## MITTEL — innerhalb 8 Wochen

| #   | Aufgabe                                           | Gesetz          | Status                                            |
| --- | ------------------------------------------------- | --------------- | ------------------------------------------------- |
| M1  | Self-Service-Datenexport im Profil                | Art. 20 DSGVO   | ⏳ braucht Backend: `GET /api/v1/users/me/export` |
| M2  | Barrierefreiheitserklärung `/barrierefreiheit`    | BFSG            | ⏳ offen                                          |
| M3  | WCAG-Farbkontrast-Audit (Axe/Wave)                | BFSG            | ⏳ offen                                          |
| M4  | „Für dich empfohlen" — Algorithmus erklären       | § 5b Abs. 2 UWG | ⏳ offen                                          |
| M5  | Onboarding: `console.log`/`alert()` ersetzen      | UX              | ✅ durch `toast` ersetzt                          |
| M6  | Gewährleistungshinweis auf der Produktdetailseite | § 438 BGB       | ⏳ offen                                          |
| M7  | Newsletter Double-Opt-In                          | § 7 UWG, DSGVO  | ⏳ braucht Backend                                |
| M8  | Datenschutz-Hinweis im Onboarding                 | Art. 13 DSGVO   | ✅ Link auf `/datenschutz`                        |

## NIEDRIG — langfristig

| #   | Aufgabe                                                        | Gesetz                    |
| --- | -------------------------------------------------------------- | ------------------------- |
| N1  | Seite `/nachhaltigkeitsstandards` mit Zertifizierungskriterien | EU Green Claims Directive |
| N2  | Rabatt-Referenzpreis-Mechanismus (falls Rabatte kommen)        | Omnibus-Richtlinie        |
| N3  | Hinweispflicht personalisierter Preise (falls implementiert)   | § 5a Abs. 4 UWG           |
| N4  | Vollständiger WCAG-2.1-AA-Audit                                | BFSG                      |
| N5  | Produkthaftungs-Prüfung bei Importeuren (Anwalt)               | ProdHaftG                 |
| N6  | Jährliche DSGVO-Überprüfung + Folgenabschätzung                | Art. 35 DSGVO             |

> **Nicht erfasst:** Marktplatz-Betreiberpflichten (DAC7, VerpackG § 9, GPSR,
> Textilkennzeichnungs-VO, EmpCo) und die MwSt.-Logik selbst sind hier bewusst nicht
> aufgeführt — sie hängen an Entscheidungen in
> [`MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md) §8.1/§8.4.

---

## Pflichtangaben im Impressum (§ 5 DDG)

Checkliste für das Befüllen von `/impressum`:

- Vollständiger Name und Anschrift des Unternehmens
- Vertretungsberechtigte Person(en)
- Handelsregisternummer (falls eingetragen)
- Umsatzsteuer-ID (§ 27a UStG)
- Zuständige Aufsichtsbehörde (falls vorhanden)
- E-Mail-Adresse — ein Kontaktformular allein reicht **nicht**
- Telefonnummer oder Rückruf-Service mit konkretem Zeitrahmen

## Pflichten im Checkout (§ 312j BGB)

- Button-Text **„Zahlungspflichtig bestellen"** — kein Synonym zulässig
- Checkbox für AGB + Widerrufsbelehrung vor Bestellabschluss
- MwSt.-Zeile immer anzeigen, auch bei 0
- Hinweis, dass Vertragspartner der Seller ist, nicht Elysion

## Einwilligung und Browser-Storage

`CookieConsentContext` (`src/context/CookieConsentContext.tsx`) steuert, ob
funktionale Cookies gesetzt werden dürfen:

| Ort                                | Art                              | Einwilligung nötig            |
| ---------------------------------- | -------------------------------- | ----------------------------- |
| `src/context/CartContext.tsx`      | `localStorage` (Gäste-Warenkorb) | ✅ ja — funktional            |
| `src/lib/product-display-cache.ts` | `localStorage` (Produkt-Cache)   | ✅ ja — funktional            |
| `src/lib/api-client.ts`            | `sessionStorage` (User + Portal) | ❌ nein — technisch notwendig |

Der Access-Token wird **nicht** gespeichert (`PersistedAuthSession` lässt ihn bewusst
weg); im `sessionStorage` liegen nur User-Objekt und Portal, damit ein Reload nicht
ausloggt. Der Token selbst lebt im Modul-Memory, die Session am HttpOnly-Cookie.

---

## Rechtsgrundlagen

| Gesetz           | Thema                             | Quelle                                       |
| ---------------- | --------------------------------- | -------------------------------------------- |
| DSGVO Art. 13/14 | Informationspflichten             | https://dsgvo-gesetz.de/                     |
| TDDDG § 25       | Cookie-Einwilligung               | https://www.gesetze-im-internet.de/ttdsg/    |
| DDG § 5          | Impressumspflicht                 | https://www.gesetze-im-internet.de/ddg/      |
| BGB § 312j       | Button-Lösung                     | https://www.gesetze-im-internet.de/bgb/      |
| BGB § 312g       | Widerrufsrecht                    | https://www.gesetze-im-internet.de/bgb/      |
| PAngV § 1        | Preisangaben                      | https://www.gesetze-im-internet.de/pangv/    |
| UWG § 5          | Irreführende Werbung              | https://www.gesetze-im-internet.de/uwg_2004/ |
| UWG § 5b         | Bewertungsauthentizität (Omnibus) | https://www.gesetze-im-internet.de/uwg_2004/ |
| BFSG             | Barrierefreiheit ab 28.06.2025    | https://www.gesetze-im-internet.de/bfsg/     |
| EGBGB Art. 246a  | Verbraucherinformationen          | https://www.gesetze-im-internet.de/egbgb/    |
