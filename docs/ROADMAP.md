# Entwicklungs-Roadmap

Planung über die Phasen hinweg. **Was gerade offen ist, steht in den GitHub-Issues** —
diese Datei gibt nur die grobe Richtung. Launch-Stand und Blocker mit Begründung:
[`LAUNCH_READINESS.md`](./LAUNCH_READINESS.md). Der **terminierte Weg bis Production**
(Phasen P0–P5, Aufwände, Kalender, Go-/No-Go-Gates) steht in
[`LAUNCH_PLAN.md`](./LAUNCH_PLAN.md).

---

## Phase 1 — MVP ✅ abgeschlossen

Alle Kernmodule sind implementiert und ans Backend angebunden: Auth, Profile,
Adressen, Werteprofile, Admin-Panel, Produkte, Kategorien, Zertifikate, Warenkorb,
Checkout, Bestellungen, Matching, File-Upload, Payments. Der Modul-Stand FE+BE steht
in [`LAUNCH_READINESS.md`](./LAUNCH_READINESS.md) §1.

Dazu: App Router mit Route Groups, zentraler API-Client mit Token-Handling und
401-Retry, AuthContext, CartContext mit optimistischen Updates, Route-Schutz via
`middleware.ts`, Pre-commit-Pipeline.

## Phase 2 — Feature-Erweiterung

**Erledigt:** Stripe-Zahlungsintegration (nur der Key fehlt, B1) · Skeleton-Loading
States · Toast-Abdeckung im SellerDashboard · `resend-verification` verdrahtet ·
Producer-Seite auf echte Daten umgebaut · Kontaktformular mit `mailto:`-Fallback ·
Session-Wiederherstellung nach Reload · `/dev`-Routen entfernt · E2E-Tests mit
Playwright.

**Offen:**

- [ ] Monitoring-Persistenz (Backend-Endpoint, Spec in [`monitoring-api.md`](./monitoring-api.md))
- [ ] Optionaler Public-Seller-Profil-Endpoint für ein reicheres Producer-Profil
- [ ] Optionaler Kontakt-Endpoint (serverseitige Speicherung/Weiterleitung)
- [ ] Guest Checkout
- [ ] Wishlist / Favoriten
- [ ] Retouren- und Erstattungs-UI (Buyer-facing)
- [ ] Seller-Analytics-Dashboard
- [ ] Bewertungs- und Rezensions-System

## Phase 3 — Skalierung & Optimierung

- [ ] SSR / Static Generation für Produktseiten (SEO) — setzt serverseitige
      Token-Validierung voraus, siehe [`ARCHITECTURE.md`](./ARCHITECTURE.md) §4.1.1
- [ ] Internationalisierung (DE / EN) — `src/lib/i18n/de.ts` ist angelegt, aber noch
      nicht eingebunden
- [ ] Performance (Image Optimization, Bundle-Splitting)
- [ ] Push-Benachrichtigungen für Bestellstatus
- [ ] Mobile App (React Native / Expo)
