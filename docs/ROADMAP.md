# Entwicklungs-Roadmap

## Elysion — Sustainable Online Shop

**Stand:** 2026-03-28
**Tech Stack:** Next.js 16 (Frontend) + Spring Boot (Backend)
**Team:** 2 Entwickler (Gründer)

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
- [x] Payments (Mock)

### Testing

- [x] 266 Unit-Tests mit ~97% Coverage (Vitest + Testing Library)
- [x] Pre-commit Pipeline (ESLint + Prettier + Husky + lint-staged)

---

## Phase 2 — Feature-Erweiterung (Geplant)

### Polish & Hardening (P5)

- [ ] **P5-1** Toast-Benachrichtigungen vollständig: SellerDashboard (Ship, Status-Update)
- [ ] **P5-2** Skeleton-Loading-States: Cart, Orders, OrderDetail, Checkout
- [ ] `POST /api/v1/auth/resend-verification` UI verdrahten (wartet auf Backend)

### Neue Features

- [ ] Stripe-Zahlungsintegration (`PaymentService` ist vorbereitet, Checkout-UI fehlt Zahlungsschritt)
- [ ] Guest Checkout
- [ ] Wishlist / Favoriten
- [ ] Retouren- und Erstattungs-UI
- [ ] Seller Analytics Dashboard (Charts)
- [ ] Bewertungs- und Rezensions-System

### Technisch

- [ ] Session-Wiederherstellung nach Page-Reload (AuthContext: `refresh()` on mount)
- [ ] Next.js `router.push()` / `<Link>` statt `window.location.href`
- [ ] `/dev`-Routen in Produktion absichern (Env-Guard)
- [ ] E2E-Tests mit Playwright für kritische User-Flows

---

## Phase 3 — Skalierung & Optimierung (Zukunft)

- [ ] Server-Side Rendering / Static Generation für Produktseiten (SEO)
- [ ] Internationalisierung (i18n) — DE / EN
- [ ] Performance-Optimierungen (Image Optimization, Bundle-Splitting)
- [ ] Seller Analytics mit echten Daten und Charts
- [ ] Push-Benachrichtigungen für Bestellstatus
- [ ] Mobile App (React Native / Expo)
