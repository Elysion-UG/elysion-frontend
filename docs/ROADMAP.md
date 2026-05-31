# Entwicklungs-Roadmap

## Elysion — Sustainable Online Shop

**Stand:** 2026-05-31
**Tech Stack:** Next.js 16 (Frontend) + Spring Boot (Backend)
**Team:** 2 Entwickler (Gründer)

> Aktueller Launch-Status und offene Blocker: [`LAUNCH_READINESS.md`](./LAUNCH_READINESS.md)

---

## Phase 1 — MVP ✅ Abgeschlossen

Alle Kernfeatures sind implementiert und ins Backend integriert.

### Frontend (Next.js 16 + React 18 + TypeScript)

- [x] App Router mit Route Groups `(admin)`, `(auth)`, `(buyer)`, `(public)`, `(seller)`
- [x] Zentraler API-Client mit Token-Handling, 401-Retry, `ApiError`
- [x] AuthContext (Login, Register, Logout, Token-Refresh)
- [x] CartContext mit optimistischen Updates
- [x] Route-Schutz via `middleware.ts`

### Implementierte Module

- [x] Authentication (Login / Register / Logout / Verify Email / Reset Password)
- [x] User-Profil (GET / PATCH / DELETE)
- [x] Adressen (CRUD + Standard-Adresse)
- [x] Buyer Value Profile
- [x] Seller Profile + Seller Value Profile
- [x] Admin Panel (User- + Seller-Verwaltung, Produkte, Bestellungen, Zertifikate, Finance)
- [x] Produkte (CRUD + Status + Bilder + Varianten + Suche + Filter + Pagination)
- [x] Kategorien
- [x] Zertifikate
- [x] Warenkorb
- [x] Checkout (3-Schritt: Adresse → Vorschau → Bestätigung)
- [x] Bestellungen (Buyer + Seller)
- [x] Matching / Recommendations (mit Match-Score)
- [x] File Upload
- [x] Payments (Stripe Elements — Frontend voll integriert, benötigt nur `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)

### Testing

- [x] 266 Unit-Tests mit ~97% Coverage (Vitest + Testing Library)
- [x] Pre-commit Pipeline (ESLint + Prettier + Husky + lint-staged)

---

## Launch-Blocker (vor Go-Live) — siehe LAUNCH_READINESS.md

- [ ] **B1** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env` setzen (Stripe-Integration ist fertig)
- [ ] **B2/B3** Stripe Live-Secrets (Backend) + Webhook-Erreichbarkeit in Prod
- [ ] **B4** Rechtstexte (Impressum/Datenschutz/AGB/Widerruf) + Kontaktdaten mit Echtdaten füllen, anwaltlich prüfen
- [ ] **B5** Prod-Secrets + SMTP aktivieren, CORS/Cookies absichern
- [ ] **B6** Plattformgebühr + Payout-Workflow entscheiden (MANAGEMENT_DECISIONS §1.1/§1.2)

## Phase 2 — Feature-Erweiterung (Geplant)

### Polish & Hardening (P5) — abgeschlossen

- [x] **P5-1** Toast-Benachrichtigungen vollständig: SellerDashboard (Ship, Status-Update)
- [x] **P5-2a** Skeleton-Loading-States: SustainableShop (Produktlisting) — React Query Cache
- [x] **P5-2b** Skeleton-Loading-States: Cart, OrderDetail, Checkout, Profil, Präferenzen
- [x] `POST /api/v1/auth/resend-verification` UI verdrahtet (Backend-Endpoint vorhanden, `EmailVerification.tsx`)
- [x] Stripe-Zahlungsintegration (`PaymentStep.tsx` mit Stripe Elements — nur Key-Konfiguration offen, siehe B1)

### Neue Features

- [ ] Public Seller-/Producer-Profil anbinden (ProducerPage nutzt noch Mockdaten — Backend-Endpoint fehlt)
- [ ] Kontaktformular an echtes Backend/Postfach (aktuell Stub)
- [ ] Monitoring-Persistenz (`monitoring.service.ts` + Backend-Endpoint, Spec in `monitoring-api.md`)
- [ ] Guest Checkout
- [ ] Wishlist / Favoriten
- [ ] Retouren- und Erstattungs-UI (Buyer-facing)
- [ ] Seller Analytics Dashboard (Charts)
- [ ] Bewertungs- und Rezensions-System

### Technisch

- [x] Session-Wiederherstellung nach Page-Reload (sessionStorage + useLayoutEffect, kein Auth-Flash)
- [x] Next.js `router.push()` / `<Link>` statt `window.location.href`
- [ ] `/dev`-Routen in Produktion absichern (Env-Guard)
- [x] E2E-Tests mit Playwright für kritische User-Flows

---

## Phase 3 — Skalierung & Optimierung (Zukunft)

- [ ] Server-Side Rendering / Static Generation für Produktseiten (SEO)
- [ ] Internationalisierung (i18n) — DE / EN
- [ ] Performance-Optimierungen (Image Optimization, Bundle-Splitting)
- [ ] Seller Analytics mit echten Daten und Charts
- [ ] Push-Benachrichtigungen für Bestellstatus
- [ ] Mobile App (React Native / Expo)
