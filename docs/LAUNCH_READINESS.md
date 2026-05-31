# Launch-Readiness — Elysion Sustainable Marketplace

**Stand:** 2026-05-31
**Scope:** Frontend (`v0-sustainable-online-shop`) + Backend (`marketplace-backend`)
**Zweck:** Konsolidierter Ist-Stand beider Repos und vollständige Liste der noch offenen Punkte bis zum Go-Live. Single Source of Truth für die Launch-Vorbereitung.

> Verwandte Dokumente: rechtliche Details in [`COMPLIANCE.md`](./COMPLIANCE.md), Management-Entscheidungen in [`../MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md), Backend-Go-Live-Schritte in `../../marketplace-backend/docs/backend/go-live-checklist.md`.

---

## 1. Gesamtbild

**Backend und Frontend sind funktional weitgehend fertig.** Alle Kernflüsse — Auth, Katalog, Warenkorb, Checkout, Multi-Vendor-Orders, Stripe-Payments, Refunds, Admin-Moderation, Zertifikate — sind end-to-end implementiert. Was bis zum Launch fehlt, ist primär **Konfiguration, rechtliche Inhalte und einige kleinere Funktionslücken** — keine großen Feature-Baustellen.

| Bereich                                  | Backend                 | Frontend              |
| ---------------------------------------- | ----------------------- | --------------------- |
| Auth (3 Portale, Verify, Reset)          | ✅                      | ✅                    |
| User / Adressen / Profile                | ✅                      | ✅                    |
| Produkte + Varianten + Bilder            | ✅                      | ✅                    |
| Kategorien                               | ✅                      | ✅                    |
| Cart (Guest + Auth)                      | ✅                      | ✅                    |
| Checkout (2-Schritt Backend / 3-Step UI) | ✅                      | ✅                    |
| Orders (Multi-Vendor + Fulfillment)      | ✅                      | ✅                    |
| Payments (Stripe)                        | ✅                      | ✅ (Key fehlt)        |
| Refunds / Settlements                    | ✅                      | ✅ (Admin Finance)    |
| Zertifikate                              | ✅                      | ✅                    |
| Admin-Panel (komplett)                   | ✅                      | ✅                    |
| Seller-Dashboard (Tab-basiert)           | ✅                      | ✅                    |
| Recommendations / Matching               | ✅                      | ✅                    |
| File Upload                              | ✅                      | ✅                    |
| Public Seller-/Producer-Profil           | 🟡 kein Profil-Endpoint | ✅ echte Produktdaten |
| Kontaktformular                          | 🟡 kein Endpoint        | ✅ mailto-Fallback    |
| **Monitoring-Persistenz**                | ❌ fehlt (Spec da)      | 🟡 nur In-Memory      |
| **Payout-Execution**                     | ⚠️ manuell              | — (Read-Only Admin)   |

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

### B6 — Plattformgebühr & Payout-Workflow festlegen

Settlement-Modell ist im Backend fertig, aber die **Höhe der Plattformgebühr** und der **Auszahlungs-Workflow** sind als BLOCKER offen (siehe [`MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md) §1.1 / §1.2). Payouts laufen aktuell manuell/off-platform (Read-Only-API). Vor echtem Seller-Onboarding zu entscheiden.

---

## 3. 🟡 Wichtig, aber nicht zwingend blockierend

### W1 — Public Seller-/Producer-Profil ✅ (Frontend erledigt 2026-05-31)

`src/components/features/products/ProducerPage.tsx` wurde auf **echte Daten** umgebaut: Firmenname + die aktiven Produkte des Sellers via `ProductService.list({ sellerId })` (Hook `useSellerProducts`). Die früheren **Mock-/Fake-Daten** (EcoWear, Rating 4.8 / 124 Reviews, erfundene Kennzahlen) wurden vollständig entfernt — damit ist auch das § 5b UWG-Risiko (COMPLIANCE H4) erledigt.
**Optionales Fast-Follow (Backend):** Ein dedizierter `GET /api/v1/sellers/{id}/profile` würde ein reicheres Profil ermöglichen (Beschreibung, Seller-Zertifikate, Standort). Kein Launch-Blocker.

### W2 — Kontaktformular ✅ (Frontend erledigt 2026-05-31)

`src/components/shared/Contact.tsx` öffnet jetzt per **`mailto:`-Fallback** das E-Mail-Programm mit vorausgefüllter Nachricht (Helfer `src/lib/contact.ts`, Adresse via `NEXT_PUBLIC_SUPPORT_EMAIL`). Der irreführende `setTimeout`-Stub mit Fake-„Nachricht gesendet" wurde entfernt; die Support-Mail wird als Link angezeigt.
**Optionales Fast-Follow (Backend):** Ein echter Kontakt-Endpoint (Speicherung/Weiterleitung serverseitig) bleibt optional, kein Launch-Blocker.

### W3 — Onboarding persistiert nicht

`src/components/features/auth/Onboarding.tsx` ist bewusst „advisory"; die echte Präferenz-Speicherung läuft über `/praeferenzen` (BuyerValueProfile). Akzeptabel für Launch. Offen: Datenschutz-Hinweis vor Präferenzspeicherung (COMPLIANCE M8) und Ersatz von `console.log`/`alert()` (COMPLIANCE M5).

### W4 — Monitoring-Persistenz

Admin-Monitoring (`/admin/monitoring`) zeigt nur einen In-Memory-Ring-Buffer (`src/lib/error-store.ts`), Daten gehen bei Reload verloren. `src/services/monitoring.service.ts` fehlt; Backend-Endpoint noch nicht gebaut. Spezifikation liegt vor: [`monitoring-api.md`](./monitoring-api.md).

### W5 — Fokus-Trapping in Modals (Barrierefreiheit)

`useFocusTrap`-Hook existiert; vollständige Anwendung in allen Modals (z. B. LoginModal) offen (COMPLIANCE H9). Relevant für BFSG/WCAG 2.1 AA.

### W6 — Late-Success-after-Expiry Finance-Review

Zahlungen können nach Order-Ablauf eintreffen → Backend erkennt + loggt das für Finance-Review. Der **manuelle Review-Prozess** muss organisatorisch dokumentiert sein.

---

## 4. 🟢 Tests & Qualität

- **Unit (Vitest):** ~39 Testdateien, solide Service-/Context-/Komponenten-Coverage. Thresholds in `vitest.config.ts` (global ≥50 % Lines, `lib`/`services` ≥75 %, `context` ≥70 %).
- **E2E (Playwright):** ~26 Specs — Admin (breit), Auth (alle Portale), Buyer-Checkout, Buyer-Orders, Seller, Public-Smoke + a11y-Smoke + Static-Assets.
- **Backend:** Keine offenen `TODO/FIXME` im Java-Code; Webhook-Idempotenz, Rate-Limiting, Audit-Logging vorhanden.

### Test-Lücken

- ❌ Kein E2E-Test für den **Stripe-Payment-Flow** (schwer ohne konfigurierten Key — nach B1/Backend-Setup nachziehen). Producer-Seite und Kontaktformular haben jetzt Unit-Tests.

---

## 5. Empfohlene Reihenfolge bis Launch

**Pflicht (Blocker):**

1. Stripe-Keys Frontend (B1) + Backend (B2) konfigurieren, Webhook-Erreichbarkeit in Prod testen (B3)
2. Rechtstexte + Kontaktdaten mit echten Daten füllen, anwaltlich prüfen (B4)
3. Prod-Secrets + SMTP aktivieren, CORS/Cookies absichern (B5)
4. Plattformgebühr + Payout-Workflow entscheiden (B6)
5. Backend-Go-Live-Checklist Schritt für Schritt durchgehen (Health, Checkout-Happy-Path, Mail)

**Fast-Follow (nach Launch ok):** 6. Optionaler Public-Seller-Profil-Endpoint für reicheres Producer-Profil (W1, Producer-Seite läuft bereits auf echten Produktdaten) 7. Kontaktformular an echtes Postfach (W2) 8. Monitoring-Persistenz (W4), E2E-Payment-Test, Fokus-Trapping (W5)

---

## 6. Detail-Findings nach Datei

| Bereich           | Datei / Ort                                         | Befund                                                                                            | Kategorie |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- |
| Stripe Key        | `.env.example`, `.env.local`                        | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` dokumentiert; Key-Wert noch einzutragen                      | 🔴 B1     |
| Producer          | `src/components/features/products/ProducerPage.tsx` | ✅ Auf echte Daten umgebaut (Seller-Produkte via `useSellerProducts`); Mock/Fake-Reviews entfernt | ✅ W1     |
| Kontakt           | `src/components/shared/Contact.tsx`                 | ✅ `mailto:`-Fallback (`src/lib/contact.ts`); Fake-Stub entfernt                                  | ✅ W2     |
| Onboarding        | `src/components/features/auth/Onboarding.tsx:75`    | „Advisory", keine Persistenz (bewusst)                                                            | 🟡 W3     |
| Monitoring        | `src/services/monitoring.service.ts`                | Service fehlt; `error-store.ts` ohne Flush                                                        | 🟡 W4     |
| Impressum         | `src/app/(public)/impressum/page.tsx`               | ~15× `[PLATZHALTER]`                                                                              | 🔴 B4     |
| Datenschutz       | `src/app/(public)/datenschutz/page.tsx`             | ~8× Platzhalter                                                                                   | 🔴 B4     |
| AGB               | `src/app/(public)/agb/page.tsx`                     | ~4× Platzhalter                                                                                   | 🔴 B4     |
| Widerruf          | `src/app/(public)/widerruf/page.tsx`                | ~2× Platzhalter                                                                                   | 🔴 B4     |
| Public Seller API | Backend                                             | `GET /api/v1/sellers/{id}/profile` fehlt                                                          | 🟡 W1     |
| Contact API       | Backend                                             | Kein Kontakt-Endpoint (optional; Frontend nutzt `mailto:`)                                        | 🟢 W2     |
| Payout-Execution  | Backend                                             | `StripePaymentProviderGateway.createPayout()` wirft `ConflictException` — manuell off-platform    | ⚠️ B6     |

---

## 7. Was bereits fertig ist (zur Klarstellung — nicht mehr „offen")

Mehrere früher als „geplant/Mock" geführte Punkte sind inzwischen **erledigt** und sollten nicht erneut als offen gelistet werden:

- ✅ **Stripe-Frontend** — voll integriert (`PaymentStep.tsx`, `@stripe/react-stripe-js`), nicht mehr Mock. Es fehlt nur der Key (B1).
- ✅ **Skeleton-Loading-States** — `CartSkeleton`, `CheckoutSkeleton`, `OrderDetailSkeleton`, `ProfileSkeleton`, `PraeferenzenSkeleton` existieren.
- ✅ **`resend-verification`** — Backend-Endpoint vorhanden, Frontend ruft ihn real auf (`auth.service.ts:103`, `EmailVerification.tsx:53`), kein Mock mehr.
- ✅ **Seller-Dashboard** — vollständiges Tab-Dashboard (Produkte, Bestellungen, Zertifikate, Profil, Settlements, Versand-Modal), kein Stub.
- ✅ **Rechtsseiten-Gerüste** — `/impressum`, `/datenschutz`, `/agb`, `/widerruf` + Footer-Links + Cookie-Consent + Checkout-Pflichtangaben (nur Inhalte/Echtdaten offen, siehe B4).
