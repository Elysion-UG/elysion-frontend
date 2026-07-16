# Elysion — Sustainable Online Shop (Frontend)

Next.js-Frontend für **Elysion**, einen Marktplatz für nachhaltig zertifizierte
Textilprodukte. Käufer finden Produkte, die zu ihrem persönlichen Werteprofil passen;
Seller pflegen Katalog und Bestellungen; Admins moderieren die Plattform.

Drei Portale auf eigenen Subdomains (Buyer / Seller / Admin) teilen sich diese
Codebasis. Backend: Spring Boot REST API im Repo `../elysion-marketplace-backend/`.

**Alle Dokumente im Überblick: [`docs/INDEX.md`](./docs/INDEX.md)**

---

## Tech-Stack

| Ebene        | Technologie              | Version |
| ------------ | ------------------------ | ------- |
| Framework    | Next.js (App Router)     | ^16.2   |
| UI           | React                    | ^18.2   |
| Sprache      | TypeScript               | ^5      |
| Styling      | Tailwind CSS             | ^3.4    |
| Komponenten  | shadcn/ui + Radix UI     | —       |
| Server-State | TanStack React Query     | ^5      |
| Validierung  | Zod                      | ^4      |
| Zahlungen    | Stripe Elements          | ^3      |
| Tests        | Vitest + Testing Library | ^4      |
| E2E          | Playwright               | ^1.52   |

---

## Schnellstart

```bash
bun install
cp .env.example .env.local   # Pflichtvariablen sind dort kommentiert
bun run dev                  # → http://localhost:3000
```

Für lokale Entwicklung gegen das Backend wird das Backend-Repo benötigt.
Alle Env-Variablen — inklusive der in jeder deployten Umgebung **erforderlichen**
`API_URL` — sind in [`.env.example`](./.env.example) dokumentiert; `.env.example` ist
dafür die maßgebliche Quelle.

Voraussetzungen, Scripts und der PR-Prozess stehen in
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## Projektstruktur

```
src/
  app/                    — Next.js App Router
    (public)/             — /, /product, /producer, /cart, /about, /contact + Rechtsseiten
    (auth)/               — /login/*, /verify-email, /reset-password
    (buyer)/              — /checkout, /orders, /profil, /praeferenzen, /onboarding
    (seller)/             — /seller-dashboard
    (admin)/              — /admin/*
    api/v1/auth/          — Auth-Proxy (reicht den Refresh-Cookie durch)
    layout.tsx            — Root-Layout · providers.tsx — Client-Provider
  components/
    features/             — Fach-Komponenten je Domäne (admin, auth, cart, checkout,
                            orders, products, profile, seller)
    layout/               — PageLayout, NavbarShell, Footer, Admin-/Seller-Shell
    shared/               — About, Contact, BrandLogo, Error-Fallbacks, Admin-Tabellen
    ui/                   — shadcn/ui-Primitives (nicht manuell editieren)
  context/                — AuthContext, CartContext, ErrorContext, CookieConsentContext
  hooks/                  — useAuth, useCart, useProducts, useFocusTrap, …
  lib/                    — api-client, schemas (Zod), error-store, currency, seo, …
  services/               — API-Service je Domäne
  types/                  — Domain-Typen, re-exportiert über index.ts
  middleware.ts           — Portal-Routing + erste Auth-Verteidigungslinie
docs/                     — Projektdokumentation
e2e/                      — Playwright-Specs
```

---

## Architektur in Kürze

Ausführlich: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

- **API-Client** — alle Backend-Requests laufen über `src/lib/api-client.ts`, nie
  direkt `fetch()`. Der Access-Token liegt im Modul-Memory (XSS-Schutz), der
  Refresh-Token als HttpOnly-Cookie. Vertrag und Endpoints:
  [`docs/api-integration.md`](./docs/api-integration.md).
- **Auth** — drei portal-spezifische Login-Endpoints. Bei 401 refresht der Client
  einmal automatisch und wiederholt den Request.
- **Route-Schutz** — `middleware.ts` prüft auf geschützten Pfaden (`/checkout`,
  `/orders`, `/profil`, `/praeferenzen`, `/onboarding`, `/seller-dashboard`,
  `/admin/*`) ein tokenloses Presence-Marker-Cookie und leitet sonst zur Login-Seite.
  Das ist Defence-in-Depth, **keine** Autorisierung — die Client-Guards und das
  Backend setzen durch. `/cart` ist bewusst öffentlich.
- **Warenkorb** — `CartContext` aktualisiert optimistisch und synchronisiert danach
  mit dem Backend.

---

## Status

- **Launch-Stand FE+BE, Blocker mit Begründung:**
  [`docs/LAUNCH_READINESS.md`](./docs/LAUNCH_READINESS.md)
- **Was gerade offen ist:** die GitHub-Issues dieses Repos (Label `launch-blocker` = 🔴)
- **Planung:** [`docs/ROADMAP.md`](./docs/ROADMAP.md)
