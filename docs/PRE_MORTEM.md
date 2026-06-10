# Pre-Mortem-Analyse — Elysion Sustainable Marketplace

**Erstellt:** 2026-06-10
**Scope:** Frontend (`elysion-frontend`) + Backend (`elysion-marketplace-backend`) + Geschäftsmodell
**Methode:** Pre-Mortem — wir nehmen an, das Projekt ist in 12 Monaten gescheitert, und arbeiten rückwärts: _Was ist passiert?_ Szenarien sind nach Eintrittswahrscheinlichkeit × Schaden geordnet.
**Datenbasis:** `MANAGEMENT_DECISIONS.md`, `docs/LAUNCH_READINESS.md`, `docs/COMPLIANCE.md`, `docs/ROADMAP.md`, Backend-Doku (`go-live-checklist.md`, `operations-runbook.md`, `deployment.md`, Domain-Docs), beide Codebasen, alle offenen Issues beider Repos (Stand 2026-06-10).

> **Verwendung:** Dieses Dokument ist Diskussionsgrundlage. Jedes Szenario endet mit einem konkreten Gegenmittel. Für Punkte ohne bestehendes Issue siehe Abschnitt „Offene Punkte ohne Issue" am Ende.

---

## Szenario 1 — Die Finanz-Operations kollabieren

**Wahrscheinlichkeit: hoch · Schaden: hoch**

Der Launch erfolgte, sobald die formalen Blocker B1–B5 erledigt waren — aber die Auszahlungs-Pipeline war ein Stub: `createPayout()` wirft `ConflictException`, Stripe-Connect-Onboarding existiert nicht (BE#110, BE#111), `commissionRate` existiert nur im Frontend-Typmodell (BE#109), Settlement-Line-Items (Stripe-Fee, Refund-/Chargeback-Abzüge) sind nicht implementiert (BE#140, BE#145). Die ersten Seller-Auszahlungen wurden manuell per Überweisung gemacht, „bis Connect fertig ist". Ohne Reconciliation (§1.5 — **kein Issue**) und ohne implementierte Provisionslogik stimmten nach sechs Wochen die Zahlen nicht mehr mit Stripe überein. Ein Seller bekam zu viel, einer zu wenig — das Vertrauen der Pilot-Seller war weg. Pilot-Seller sind bei einem Marketplace die einzige Referenz.

**Frühindikatoren:** erste manuelle Überweisung außerhalb des Systems; Differenz zwischen Seller-Dashboard und Stripe-Dashboard; „das rechnen wir später nach".

**Gegenmittel:**

- BE#109/#110/#111/#140/#145 als harte Launch-Blocker behandeln (nicht nur B1–B6), **oder** bewusst entscheiden: Pilotbetrieb max. N Wochen mit manuell verifizierter Abrechnung und expliziter Seller-Kommunikation.
- Reconciliation-Mindestmaß (§1.5) vor Launch: täglicher Stripe-Abgleich, Erkennung fehlender Webhooks. → **Issue fehlt.**

---

## Szenario 2 — Abmahnung statt Umsatz

**Wahrscheinlichkeit: hoch · Schaden: mittel bis hoch**

Drei Wochen nach Launch kam die erste Abmahnung — nicht wegen der Platzhalter im Impressum (die wurden gefüllt, FE#9), sondern wegen Pflichten, die in `COMPLIANCE.md` gar nicht vorkommen:

- **MwSt./USt (§8.1):** keine Steuerlogik, keine Entscheidung, kein Issue. Falsche/fehlende USt-Ausweise im B2C-Checkout sind abmahnfähig; die Provisionsrechnung der Plattform an Seller braucht ebenfalls USt-Ausweis.
- **Textilkennzeichnungs-VO:** Faserzusammensetzung ist Pflichtangabe — das Material-Feature existiert als Filter, nicht als Pflichtfeld.
- **VerpackG § 9:** Marktplätze dürfen nur für LUCID-registrierte Seller anbieten (Prüfpflicht der Plattform).
- **GPSR (seit 12/2024):** verantwortliche Person + Sicherheitsangaben pro Produkt; Marketplace-Pflichten.
- **EmpCo-Richtlinie / Green Claims (ab 2026):** generische Umweltaussagen ohne Nachweis werden verboten — existenziell für eine Plattform, die mit „nachhaltig zertifiziert" wirbt.
- **DAC7:** jährliche Meldepflicht der Seller-Umsätze ans BZSt — kommt in keinem Dokument vor.

Neue Shops sind Standardziele von Abmahnvereinen; ein Shop, der mit Nachhaltigkeit wirbt, doppelt. Für ein 2-Personen-Team ohne Rechtsbudget kostete jede Abmahnung einen Monat Entwicklungszeit.

**Gegenmittel:** `COMPLIANCE.md` um die Marketplace-Betreiber-Pflichten erweitern (VerpackG, GPSR, DAC7, Textil-KennzVO, EmpCo); MwSt. von „OFFEN/Phase 2" auf Launch-Blocker hochstufen; anwaltliche Prüfung explizit auf Plattform-Pflichten ausweiten, nicht nur Rechtstexte. → **Issues fehlen (alle Punkte).**

---

## Szenario 3 — Das Henne-Ei-Problem wurde nie gelöst

**Wahrscheinlichkeit: hoch · Schaden: tödlich (langsam)**

Technisch lief alles — aber es gab nie einen Plan, wie die ersten 20 Seller und die ersten 1.000 Käufer kommen. Die gesamte Doku (10 Frontend-Docs, 30+ Backend-Docs, 67 offene Issues) enthält **kein einziges Go-to-Market-Artefakt**: keine Pilot-Definition, keine Seller-Akquise-Strategie, keine Käufer-Kanal-Hypothese, keine Erfolgs-/Abbruchkriterien. Der Marketplace startete mit 5 Pilot-Sellern und 3 Bestellungen pro Woche; 15 % Take Rate auf ~200 €/Woche GMV deckten nicht einmal Hosting. Nach 9 Monaten war die Motivation weg.

**Verschärfend:** Die Unit Economics sind nicht durchgerechnet. 15 % + Stripe-Fee + Refund-/Chargeback-Abwälzung (§1.1) trifft kleine nachhaltige Textil-Labels mit dünnen Margen hart — es gibt keine Beispielrechnung, ab welchem Warenkorbwert sich ein Verkauf für den Seller lohnt.

**Gegenmittel:** Ein eintägiger Workshop, ein Dokument: Pilotumfang (Seller-Zahl, GMV-Ziel, Zeitfenster = Erfolg/Abbruch), Akquise-Funnel, Beispielrechnung Seller-Marge pro Bestellung. Wichtiger als jedes der 67 offenen Issues. → **Issue/Dokument fehlt.**

---

## Szenario 4 — Der Retouren-Tsunami

**Wahrscheinlichkeit: mittel–hoch · Schaden: hoch**

Textil-E-Commerce hat 30–50 % Retourenquote. Zum Launch gab es aber keinen Retouren-Flow: Der Buyer konnte nur per E-Mail anfragen, der Seller konnte keinen Refund auslösen (der vollständig implementierte `RefundService` ist über **keinen einzigen Controller-Endpoint** erreichbar), der Admin machte jeden Refund über das Stripe-Dashboard. Lange Wartezeiten → Käufer eskalierten zu Chargebacks → 15 €/Chargeback + Streitbetrag gingen laut §1.1 an die Seller → Seller kündigten. Der Anspruch „14 Tage Widerruf, keine Restocking-Gebühr" (§1.4) war im Code nicht einlösbar.

**Gegenmittel:** BE#142 (Refund-Endpoints) + FE#56 (Seller-Refund-UI) vor Launch; den Buyer-Rückgabe-Antrag (Miro-BPMN „Retoure") mindestens als simples Formular-MVP. → **Buyer-Flow hat kein Issue** (in §1.4 explizit als „eigenes Thema, noch nicht in Issues" markiert); zudem fehlt jede `Return`/RMA-Domain im Backend.

---

## Szenario 5 — Datenverlust, zum Zweiten

**Wahrscheinlichkeit: niedrig–mittel · Schaden: tödlich**

Die Prod-DB ist im Projektverlauf **schon einmal gelöscht worden** (alter Render-Service, vgl. BE#122). Beim Neuaufbau wurden Backups wieder nicht aktiviert — in der `go-live-checklist.md` sind „Managed Postgres Backups aktiviert" und „Restore-Drill dokumentiert" unchecked. Acht Monate nach Launch — diesmal mit echten Bestellungen, Zahlungs- und steuerlich aufbewahrungspflichtigen Finanzdaten — passierte es wieder. Ohne Order-Historie keine Settlements, keine DAC7-Meldung, keine Gewährleistungsabwicklung. Game over, möglicherweise mit persönlicher Haftung.

**Gegenmittel:** Backups + dokumentierter, einmal geprobter Restore als nicht verhandelbare Bedingung in BE#122 (Prod-Neuaufbau) aufnehmen. File-Storage (`/app/data/file-assets`) in die Backup-Strategie einbeziehen.

---

## Szenario 6 — Vertrauensbruch beim Kern-USP

**Wahrscheinlichkeit: niedrig · Schaden: tödlich**

Ein Journalist (oder ein Konkurrent) lud ein gefälschtes GOTS-Zertifikat hoch — es wurde verifiziert, das Produkt ging live. Es gibt keinen dokumentierten Prozess, wie ein Admin ein Zertifikat tatsächlich validiert (z. B. Abgleich gegen die öffentlichen Zertifikatsregister von GOTS/Fairtrade/OEKO-TEX). Die Story „Nachhaltigkeits-Marketplace prüft Zertifikate nicht" zerstörte genau das Asset, das Elysion von Amazon unterscheidet. Verschärfend lag im selben Pfad eine XSS-Lücke Seller→Admin über die Zertifikats-`documentUrl` (FE#64) — ✅ inzwischen behoben (Full-Stack: nur `http(s)` erlaubt, Render unsicherer URLs als Plaintext).

**Zusätzlich konzeptionell:** `LEVEL_2`/`LEVEL_3` (§2.2) sind semantisch undefiniert — das Werteprofil-Matching (der zweite USP) matcht auf undefinierte Kategorien.

**Gegenmittel:** Verifikations-SOP schreiben (Registerabgleich, Vier-Augen-Prinzip bei Erstverifizierung eines Sellers); ~~FE#64 fixen~~ ✅ erledigt; §2.2-Semantik definieren. → **SOP und Stufen-Semantik haben kein Issue.**

---

## Szenario 7 — Security-Incident mit Ansage

**Wahrscheinlichkeit: mittel · Schaden: hoch**

Die P0-Lücken waren seit März 2026 dokumentiert (`MANAGEMENT_DECISIONS.md` §5.4). Stand 2026-06-10 verifiziert:

| §5.4-Punkt                                  | Status                                                                                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| E-Mail-Constraint lehnt gültige Adressen ab | ✅ behoben (BE#61 geschlossen)                                                                                                         |
| Rate-Limit-Bypass via X-Forwarded-For       | ✅ behoben (BE#149 + FE#32) — RemoteIpValve statt XFF-Vertrauen; Auth-Proxy sendet Vercel-verifizierte `X-Client-IP` mit Shared Secret |
| Refresh-Token-Race-Condition                | ⚠️ unverifiziert — kein Issue auffindbar                                                                                               |
| Password-Reset-Links zeigen auf Backend     | ⚠️ unverifiziert                                                                                                                       |
| Refresh-Cookie-Pfad zu eng                  | ⚠️ unverifiziert                                                                                                                       |

Dazu: keine Account-Sperrung bei Brute-Force (§5.1, als BLOCKER markiert — **kein Issue**), keine serverseitige Auth-Schicht im Frontend (FE#68), 8 offene `security`-Issues im Frontend. Ein Credential-Stuffing-Angriff auf Buyer-Accounts mit hinterlegten Adressen wurde zur DSGVO-Meldepflicht binnen 72 h — und wurde spät bemerkt, weil die Monitoring-Persistenz (BE#115) nie gebaut wurde.

**Gegenmittel:** §5.4-Resttabelle verifizieren und abarbeiten (geschätzt < 2 Tage Gesamtaufwand); Backend-Issue für XFF-Bypass anlegen; Account-Lockout-Entscheidung (§5.1) treffen.

---

## Szenario 8 — Free-Tier-Realität tötet die Conversion

**Wahrscheinlichkeit: mittel · Schaden: mittel**

Staging läuft auf Render Free-Tier (60–90 s Kaltstart). Wird Prod ähnlich sparsam aufgebaut (Entscheidung Paid-Tier laut `deployment.md` offen), bedeutet jeder Kaltstart einen verlorenen Erstbesucher — bei einem Marketplace, der ohnehin um jede Bestellung kämpft. Single-VM ohne Redundanz, In-Memory-Rate-Limiting, kein Alerting (§9.3 — **kein Issue**): Der erste virale Moment (Presseartikel über nachhaltigen Marketplace) wurde zum Totalausfall, den niemand bemerkte, weil es kein Alerting gab.

**Gegenmittel:** Paid-Tier-Entscheidung vor Launch; minimales externes Uptime-Monitoring (z. B. UptimeRobot auf `/actuator/health`) — kostet nichts, fehlt aber.

---

## Querschnittsbefund (Meta-Risiko)

Das eigentliche Muster hinter den Szenarien: **Entscheidungen und Frontend eilen dem Backend voraus.** Provision, Payouts, Settlements, Refunds — überall bedient fertige UI ein Backend aus Stubs. Die Doku erweckt mit „✅ entschieden / ✅ Frontend umgesetzt" einen Fertigstellungsgrad, der operativ nicht existiert. Die formale Blocker-Liste (B1–B6) misst _„kann man deployen?"_, nicht _„kann man betreiben?"_.

**Kernempfehlung:** Eine zweite Checkliste **„Operations-Readiness"** neben `LAUNCH_READINESS.md`:

1. Payout end-to-end (Connect-Onboarding → Settlement → Mittwoch-Freigabe → Geld auf Seller-Konto)
2. Refund end-to-end (Seller löst aus → Settlement-Reversal → Buyer-Geld zurück)
3. Backup aktiviert + Restore einmal geprobt
4. MwSt.-Ausweis korrekt (Checkout + Provisionsrechnung)
5. Zertifikats-Verifikations-SOP existiert und wurde einmal durchlaufen
6. Pilot-Erfolgskriterien definiert (Seller-Zahl, GMV, Zeitfenster)
7. Alerting: jemand erfährt, wenn Prod down ist oder Webhooks ausbleiben

Der Launch sollte an dieser Liste gemessen werden, nicht an B1–B6.

---

_Verwandte Dokumente: [`MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md) · [`LAUNCH_READINESS.md`](./LAUNCH_READINESS.md) · [`COMPLIANCE.md`](./COMPLIANCE.md) · Backend `docs/backend/go-live-checklist.md`_
