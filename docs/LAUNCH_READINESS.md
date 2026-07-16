# Launch-Readiness — Elysion Sustainable Marketplace

**Scope:** Frontend (`elysion-frontend`) + Backend (`elysion-marketplace-backend`)
**Zweck:** Konsolidierter Ist-Stand beider Repos und inhaltlicher Hintergrund der
Launch-Vorbereitung — **warum** etwas offen ist.

> **Was noch offen ist, steht in den GitHub-Issues** beider Repos (Label
> `launch-blocker` = 🔴), nicht hier. Dieses Dokument liefert Kontext und
> Begründungen. Mapping: B1→FE#10, B2→BE#117, B3→BE#118, B4→FE#9, B5→BE#119,
> B6→BE#109–112, W1-FF→BE#104, W2-FF→BE#120, W4-Backend→BE#115, W5→FE#11,
> W6→BE#121, E2E-Stripe→FE#12.

Verwandt: [`COMPLIANCE.md`](./COMPLIANCE.md) (rechtliche Details),
[`MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md) (Geschäftsregeln),
Backend-Repo `docs/backend/go-live-checklist.md` (Go-Live-Schritte).
Umgebungen und URLs: [`INDEX.md`](./INDEX.md#umgebungen). **Produktion** ist derzeit
außer Betrieb (alte Render-DB gelöscht) — Neuaufbau vor Launch: BE#122.

---

## 1. Gesamtbild

**Backend und Frontend sind funktional weitgehend fertig.** Alle Kernflüsse — Auth, Katalog, Warenkorb, Checkout, Multi-Vendor-Orders, Stripe-Payments, Refunds, Admin-Moderation, Zertifikate — sind end-to-end implementiert. Was bis zum Launch fehlt, ist primär **Konfiguration, rechtliche Inhalte und einige kleinere Funktionslücken** — keine großen Feature-Baustellen.

| Bereich                                  | Backend                 | Frontend                 |
| ---------------------------------------- | ----------------------- | ------------------------ |
| Auth (3 Portale, Verify, Reset)          | ✅                      | ✅                       |
| User / Adressen / Profile                | ✅                      | ✅                       |
| Produkte + Varianten + Bilder            | ✅                      | ✅                       |
| Kategorien                               | ✅                      | ✅                       |
| Cart (Guest + Auth)                      | ✅                      | ✅                       |
| Checkout (2-Schritt Backend / 3-Step UI) | ✅                      | ✅                       |
| Orders (Multi-Vendor + Fulfillment)      | ✅                      | ✅                       |
| Payments (Stripe)                        | ✅                      | ✅ (Key fehlt)           |
| Refunds / Settlements                    | ✅                      | ✅ (Admin Finance)       |
| Zertifikate                              | ✅                      | ✅                       |
| Admin-Panel (komplett)                   | ✅                      | ✅                       |
| Seller-Dashboard (Tab-basiert)           | ✅                      | ✅                       |
| Recommendations / Matching               | ✅                      | ✅                       |
| File Upload                              | ✅                      | ✅                       |
| Public Seller-/Producer-Profil           | 🟡 kein Profil-Endpoint | ✅ echte Produktdaten    |
| Kontaktformular                          | 🟡 kein Endpoint        | ✅ mailto-Fallback       |
| **Monitoring-Persistenz**                | ❌ fehlt (Spec da)      | ✅ Flush + Service       |
| **Payout-Execution**                     | ⚠️ Connect offen (Spec) | ✅ UI (Connect+Freigabe) |

---

## 2. 🔴 Launch-Blocker (müssen vor Go-Live)

### B1 — Stripe-Publishable-Key konfigurieren (Frontend)

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ist seit 2026-05-31 in `.env.example` und `.env.local` dokumentiert (Variable + Hinweise). **Offen:** der echte Key-Wert muss noch eingetragen werden — Test-Key (`pk_test_…`) für Dev/QA, Live-Key (`pk_live_…`) in Prod. Solange leer, ist `stripePromise = null` in `src/components/features/checkout/PaymentStep.tsx` und der Checkout zeigt „Zahlungssystem nicht konfiguriert".
**Hinweis:** Die Stripe-Integration selbst ist vollständig (echte `@stripe/react-stripe-js`-Anbindung, `PaymentStep` in `Checkout.tsx` verdrahtet, Status-Polling, `PaymentService.getStatus()`). Es fehlt **nur** der Key-Wert in der Umgebung.

### B2 — Stripe-Live-Secrets (Backend)

`APP_STRIPE_SECRET_KEY` + `APP_STRIPE_WEBHOOK_SECRET` müssen auf Live-Mode gesetzt werden. Backend-Integration (Intent, Webhook-Idempotenz, Settlement) ist fertig.

### B3 — Stripe-Webhook in Prod erreichbar

`…/api/v1/payments/webhook` muss von Stripe live erreichbar sein, sonst werden Zahlungen nie finalisiert und Orders bleiben `PENDING` (laufen nach TTL ab). Steht als Rollback-Kriterium in der Backend-Go-Live-Checklist.

### B4 — Rechtliche Pflichtseiten enthalten Platzhalter

Impressum (~15× `[PLATZHALTER]`), Datenschutz (~8×), AGB (~4×), Widerruf (~2×) sowie Kontaktdaten (`Contact.tsx`, Footer). In DE/EU **rechtlicher Blocker**: Impressumspflicht (§5 DDG/TMG), DSGVO-Datenschutzerklärung, Widerrufsbelehrung.
**Aktion:** Echte Firmendaten einpflegen + anwaltliche Prüfung der Texte (Empfehlungen siehe [`COMPLIANCE.md`](./COMPLIANCE.md)). Die Seitengerüste und Footer-Links existieren bereits (alle KRITISCH-Tasks K1–K8 als Frontend umgesetzt).

### B5 — Prod-Secrets & SMTP (Backend)

`SPRING_PROFILES_ACTIVE=prod`, echte `APP_JWT_SECRET`, `APP_PASSWORD_PEPPER`, `APP_MAIL_ENABLED=true` + reale SMTP-Credentials, `APP_FRONTEND_URL`, `APP_CORS_ALLOWED_ORIGINS` auf echte Domains. Cookies `Secure` + korrekte SameSite/Domain-Policy.

### B6 — Plattformgebühr & Payout-Workflow festlegen ✅ (entschieden 2026-06-01)

Die Geschäftsregeln sind **entschieden** (siehe [`MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md) §1.1 / §1.2):

- **Provision:** 15 % Default, pro Seller vom Admin anpassbar, auf Warenwert exkl. Versand; die Stripe-Gebühr trägt der Seller und wird pro Transaktion separat ausgewiesen.
- **Payouts:** monatliche manuelle Admin-Freigabe über **Stripe Connect Express**, kein Mindestbetrag, Settlement ab `DELIVERED`, eigene Payout-Mail.

**Frontend ist umgesetzt** (Admin-Provisions-Editor, Seller-Connect-Onboarding-Karte, Admin-Tab „Fällige Auszahlungen").

**Verbleibender Blocker = Backend:** Stripe Connect Express + zugehörige Endpoints sind ein echtes Feature (verschiebt den Funktions-Launch). API-Verträge dokumentiert in [`api-integration.md`](./api-integration.md) → Backend-Issues. `createPayout()` muss das bestehende `ConflictException`-Stub ersetzen.

---

## 3. 🟡 Wichtig, aber nicht zwingend blockierend

### W1 — Public Seller-/Producer-Profil ✅ (Frontend erledigt 2026-05-31)

`src/components/features/products/ProducerPage.tsx` wurde auf **echte Daten** umgebaut: Firmenname + die aktiven Produkte des Sellers via `ProductService.list({ sellerId })` (Hook `useSellerProducts`). Die früheren **Mock-/Fake-Daten** (EcoWear, Rating 4.8 / 124 Reviews, erfundene Kennzahlen) wurden vollständig entfernt — damit ist auch das § 5b UWG-Risiko (COMPLIANCE H4) erledigt.
**Optionales Fast-Follow (Backend):** Ein dedizierter `GET /api/v1/sellers/{id}/profile` würde ein reicheres Profil ermöglichen (Beschreibung, Seller-Zertifikate, Standort). Kein Launch-Blocker.

### W2 — Kontaktformular ✅ (Frontend erledigt 2026-05-31)

`src/components/shared/Contact.tsx` öffnet jetzt per **`mailto:`-Fallback** das E-Mail-Programm mit vorausgefüllter Nachricht (Helfer `src/lib/contact.ts`, Adresse via `NEXT_PUBLIC_SUPPORT_EMAIL`). Der irreführende `setTimeout`-Stub mit Fake-„Nachricht gesendet" wurde entfernt; die Support-Mail wird als Link angezeigt.
**Optionales Fast-Follow (Backend):** Ein echter Kontakt-Endpoint (Speicherung/Weiterleitung serverseitig) bleibt optional, kein Launch-Blocker.

### W3 — Onboarding persistiert nicht ✅ (Frontend erledigt 2026-06-01)

`src/components/features/auth/Onboarding.tsx` ist bewusst „advisory"; die echte Präferenz-Speicherung läuft über `/praeferenzen` (BuyerValueProfile). Akzeptabel für Launch.
**Erledigt:** Datenschutz-Hinweis ergänzt (informativer Block mit Link auf `/datenschutz` und `/praeferenzen`, COMPLIANCE M8); `console.log`/`alert()` waren bereits durch `toast.success()` ersetzt (COMPLIANCE M5). Damit sind beide vormals offenen Teilpunkte geschlossen.

### W4 — Monitoring-Persistenz 🟡 (Frontend erledigt 2026-06-01, Backend offen)

**Frontend umgesetzt:** Flush-Mechanismus in `src/lib/error-store.ts` (Timer 30 s, Threshold ab 20 Events, `beforeunload`-Beacon, Backoff, Truncation, direkter `fetch`) + `src/services/monitoring.service.ts` (Admin-Reads) + Typ `PersistedErrorEvent`. Das Live-Dashboard (`/admin/monitoring`) bleibt unverändert als In-Memory-Ansicht.
**Backend offen:** Tabelle `frontend_error_events`, Ingestion-/Admin-Controller, Cleanup-Job — vollständige Spec + API-Verträge in [`monitoring-api.md`](./monitoring-api.md) → Backend-Issue. Solange der Endpoint fehlt, schlägt der Flush still fehl (kein Crash).

### W5 — Fokus-Trapping in Modals (Barrierefreiheit)

`useFocusTrap`-Hook existiert; vollständige Anwendung in allen Modals (z. B. LoginModal) offen (COMPLIANCE H9). Relevant für BFSG/WCAG 2.1 AA.

### W6 — Late-Success-after-Expiry Finance-Review

Zahlungen können nach Order-Ablauf eintreffen → Backend erkennt + loggt das für Finance-Review. Der **manuelle Review-Prozess** muss organisatorisch dokumentiert sein.

---

## 4. 🟢 Tests & Qualität

- **Unit (Vitest):** solide Coverage der Service-, Context- und Lib-Schicht;
  Feature-Komponenten sind noch weitgehend ungetestet. Schwellen:
  [`CODE_STANDARDS.md`](./CODE_STANDARDS.md#coverage-schwellen).
- **E2E (Playwright):** Admin (breit), Auth (alle Portale), Buyer-Checkout,
  Buyer-Orders, Seller, Public-Smoke + a11y-Smoke + Static-Assets.
- **Backend:** Keine offenen `TODO/FIXME` im Java-Code; Webhook-Idempotenz, Rate-Limiting, Audit-Logging vorhanden.

### Test-Lücken

- ❌ Kein E2E-Test für den **Stripe-Payment-Flow** (schwer ohne konfigurierten Key — nach B1/Backend-Setup nachziehen). Producer-Seite und Kontaktformular haben jetzt Unit-Tests.

---

## 5. Detail-Findings nach Datei

| Bereich           | Datei / Ort                                         | Befund                                                                                                                                                  | Kategorie |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Stripe Key        | `.env.example`, `.env.local`                        | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` dokumentiert; Key-Wert noch einzutragen                                                                            | 🔴 B1     |
| Producer          | `src/components/features/products/ProducerPage.tsx` | ✅ Auf echte Daten umgebaut (Seller-Produkte via `useSellerProducts`); Mock/Fake-Reviews entfernt                                                       | ✅ W1     |
| Kontakt           | `src/components/shared/Contact.tsx`                 | ✅ `mailto:`-Fallback (`src/lib/contact.ts`); Fake-Stub entfernt                                                                                        | ✅ W2     |
| Onboarding        | `src/components/features/auth/Onboarding.tsx:75`    | „Advisory", keine Persistenz (bewusst)                                                                                                                  | 🟡 W3     |
| Monitoring        | `src/services/monitoring.service.ts`                | ✅ Frontend fertig (Flush in `error-store.ts` + MonitoringService, committet 2026-06-07); Backend-Ingestion offen → BE#115                              | 🟡 W4     |
| Impressum         | `src/app/(public)/impressum/page.tsx`               | ~15× `[PLATZHALTER]`                                                                                                                                    | 🔴 B4     |
| Datenschutz       | `src/app/(public)/datenschutz/page.tsx`             | ~8× Platzhalter                                                                                                                                         | 🔴 B4     |
| AGB               | `src/app/(public)/agb/page.tsx`                     | ~4× Platzhalter                                                                                                                                         | 🔴 B4     |
| Widerruf          | `src/app/(public)/widerruf/page.tsx`                | ~2× Platzhalter                                                                                                                                         | 🔴 B4     |
| Public Seller API | Backend                                             | `GET /api/v1/sellers/{id}/profile` fehlt                                                                                                                | 🟡 W1     |
| Contact API       | Backend                                             | Kein Kontakt-Endpoint (optional; Frontend nutzt `mailto:`)                                                                                              | 🟢 W2     |
| Payout-Execution  | Backend                                             | Entschieden: Stripe Connect Express + monatliche Admin-Freigabe. FE fertig; `createPayout()` (wirft noch `ConflictException`) + Connect-Endpoints offen | ⚠️ B6     |
