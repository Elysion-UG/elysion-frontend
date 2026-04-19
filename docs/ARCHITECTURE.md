# Frontend-Architektur — v0-sustainable-online-shop

> Architektonische Leitplanken für das Next.js-Frontend. Ergänzt `CLAUDE.md`
> (Projekt-Überblick), `README.md` (Setup) und `docs/api-integration.md`
> (Backend-Vertrag).

## 1. High-Level-Überblick

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js 14 App Router (React 18 + TypeScript)               │
│  ─────────────────────────────────────────────────────────── │
│  app/(public)  app/(buyer)  app/(seller)  app/(admin)        │
│       │            │            │             │              │
│       └────────────┴───── context ─┴─────────┘               │
│                 AuthContext · CartContext · ErrorContext     │
│                            │                                 │
│                     services/* (API services)                │
│                            │                                 │
│                   lib/api-client (apiRequest)                │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
              Spring Boot Backend (REST API)
```

- **Route-Gruppen** `(public)/(buyer)/(seller)/(admin)` bilden die vier Portale
  (Kunde, Käufer-innen-Bereich, Händler-Dashboard, Admin-Backoffice) und werden
  per Subdomain-Routing ausgeliefert.
- **Server Components** sind Standard in App Router; Komponenten werden nur
  explizit mit `"use client"` markiert, wenn sie Hooks, State oder Event-Handler
  benötigen.
- **React Query** cached Server-State; lokaler UI-State lebt in Context oder
  Komponenten-State.

## 2. Schichten

### 2.1 `app/` — Routing & Seiten

- Thin pages: laden Daten, rendern Feature-Komponenten aus `components/features`.
- Jede Route-Gruppe besitzt ein eigenes `error.tsx`, das `RouteErrorFallback`
  verwendet (siehe §4.2).

### 2.2 `components/`

```
components/
├── features/   — Fach-Komponenten je Domain (auth, cart, checkout, orders,
│                 products, profile, seller, admin)
├── layout/     — NavbarShell, Footer, Sidebars
├── shared/     — About, Contact, RouteErrorFallback, ErrorBoundary
└── ui/         — shadcn/ui Primitives (nicht manuell editieren)
```

Ziel: kleine, fokussierte Komponenten (<300 LOC, meist <150). "God components"
werden in `feature/<feature>-parts/` oder `feature/<feature>/` dekomponiert
(siehe `product-detail/`, `praeferenzen-parts/`, `producer-parts/`).

### 2.3 `context/`

Globale Client-State-Container:

| Context        | Verantwortung                                 |
| -------------- | --------------------------------------------- |
| `AuthContext`  | `user`, `token`, Login/Logout, Portal-Auswahl |
| `CartContext`  | Warenkorb, Summen, Merge bei Login            |
| `ErrorContext` | React-Zugriff auf den `errorStore`            |

Provider-Werte sind immer mit `useMemo` stabilisiert, damit Consumers nicht
unnötig rerendern.

### 2.4 `hooks/`

Projekt-spezifische Hooks: `useOrders`, `useProducts`, `useProfile`,
`useBuyerValueProfile`, `useAsyncAction`, `useFocusTrap`, … Thin Wrappers um
React Query, damit die Service-Ebene UI-agnostisch bleibt.

### 2.5 `services/`

Ein Service-Objekt pro Domain (z.B. `AuthService`, `ProductService`,
`BuyerValueProfileService`). Alle Methoden rufen `apiRequest()` aus
`lib/api-client` auf — Services besitzen **keine** eigene Fetch- oder
Fehlerbehandlung.

### 2.6 `lib/`

- `api-client.ts` — einziger Einstiegspunkt für HTTP-Requests. Access-Token im
  Modul-Memory (XSS-sicher), Refresh-Cookie via `credentials: 'include'`.
  Meldet Fehler automatisch an den `errorStore`.
- `error-store.ts` — framework-agnostischer Ringpuffer, verwendet von
  api-client, Error Boundaries und Admin-Monitoring-View.
- `schemas.ts` — Zod-Schemas für Login, Register, Address, Product, Preferences,
  Contact. `zodToFieldErrors` liefert flaches `{path: message}` für Formulare.
- `validation.ts` — Passwort-Regeln (label-basiert, für Live-Hints).
- `currency.ts`, `country.ts`, `seller-url.ts`, `product-display-cache.ts` —
  Utilities.
- `env.ts` — zentrale Env-Variablen, per Zod validiert.

### 2.7 `types/`

Domain-nach-Domain gesplittet, re-exportiert über `types/index.ts`. Source of
truth für Frontend-Modelle.

## 3. Datenfluss (Read)

```
UI Component
   └─ custom hook (z.B. useProducts)
        └─ React Query
             └─ service method (z.B. ProductService.list)
                  └─ apiRequest  ─────► Backend REST
                  ◄───── JSON envelope
             ◄──── normalized data (z.B. ProductPage)
        ◄────── { data, isLoading, error }
   ◄──── Render
```

**Regeln:**

- Service-Schicht normalisiert Backend-Besonderheiten (siehe
  `CLAUDE.md → Bekannte Abweichungen`).
- Komponenten nutzen **keine** direkten `fetch`-Aufrufe.

## 4. Querschnittsthemen

### 4.1 Authentifizierung

Portal-spezifische Login-Endpoints
(`AuthService.loginAsCustomer|Seller|Admin`). Der Access-Token lebt im
Modul-Memory in `api-client.ts`. Die Session (Token, User, Portal) wird beim
Page-Reload aus dem `sessionStorage` wiederhergestellt. Für die Persistenz
eines angemeldeten Zustands über den Tab-Wechsel hinweg dient der
HttpOnly-Refresh-Cookie, den `AuthService.refresh()` automatisch nutzt.

### 4.2 Fehlerbehandlung

- **Ein Kanal** — alle Client-Fehler fließen in `errorStore.report(…)`.
- **Vier Quellen**:
  1. `api-client` (lazy dynamic import) meldet jede `ApiError`.
  2. `ErrorBoundary` fängt Render-Fehler in Feature-Komponenten.
  3. `app/(group)/error.tsx` → `RouteErrorFallback` (shared fallback) meldet
     Segment-Fehler mit dem `routeGroup` als Metadata.
  4. `global-error.tsx` fängt den allerletzten Fall, wenn Providers selbst
     crashen.
- Im UI: spezifische Fehlermeldungen aus `ApiError` (z.B. 429 mit
  `Retry-After`), sonst generische lokalisierte Strings.

### 4.3 Validierung

Zod-Schemas in `lib/schemas.ts`. Formulare nutzen `schema.safeParse(input)` und
`zodToFieldErrors(err)` für Feld-Fehler. Das PasswordStrengthHints-Widget
bleibt bei der Regel-Liste aus `lib/validation.ts`, da die Live-UX mehr ist
als reine Boolean-Validierung.

### 4.4 Caching-Strategie

- **Produkt-Listen/Detail:** React Query (`staleTime` je Feature gesetzt,
  Pagination mit `keepPreviousData`).
- **Kategorien/Stammdaten:** längere `staleTime` + `product-display-cache`
  fallback (IndexedDB-Wrapper) für Offline-freundliche Titel-Lookups.
- **Auth:** kein Cache, jede Portal-Session explizit.

### 4.5 Routing zwischen Portalen

`lib/seller-url.ts` generiert absolute URLs zwischen Portalen (unterschiedliche
Subdomains). Keine Komponente baut Portal-URLs von Hand.

## 5. Test-Pyramide

```
        E2E (Playwright, seller-Profil kritischer Flows)
      ─────────────────────────────────────────────
      Component Tests (RTL + Vitest, happy-path +
      error-path; gekapselt in features/**)
     ───────────────────────────────────────────────
     Unit Tests (Vitest, utilities: currency, country,
     api-client, validation, schemas, services)
```

- Coverage-Schwelle: 20% Lines/Statements/Functions, 15% Branches (Phase 1 —
  **nicht final**; Phase 4 erhöht sie wieder auf ≥50%).
- E2E-Auth: `storageState` aus `e2e/.auth/seller.json`; Serial Mode wegen
  Single-Use-Refresh-Rotation.

## 6. Konventionen (Kurz)

- **Imports:** `@/src/...` Alias.
- **Komponenten:** PascalCase-Dateinamen; Props-Interfaces direkt über der
  Komponente; keine default-exports in Feature-Subfolders (barrel `index.ts`
  re-exportiert named exports).
- **Services:** camelCase-Objekte mit async-Methoden; keine Klassen.
- **Styles:** Tailwind + shadcn-Primitives; keine CSS-Module, keine Inline-
  Styles außer dynamische Werte (z.B. `width: ${pct}%`).
- **Strings:** Deutsch im UI; langfristig zentralisiert unter
  `src/lib/i18n/de.ts` (Phase 5).

## 7. Bewusst ausgeschlossen

- Globale Zustandsbibliotheken (Redux/Zustand) — React Query + Context reichen.
- SSR-Data-Fetching für geschützte Seiten — Portale sind client-authentisiert.
- Custom Fetch-Wrapper außerhalb `api-client.ts` — ein Ort, eine Regel.

## 8. Refactoring-Historie

| Phase | Fokus                                                                        |
| ----- | ---------------------------------------------------------------------------- |
| 1     | Context-Memoization, ESLint warn→error, ehrliche Coverage                    |
| 2     | God-Component-Dekomposition (ProductDetail, Login, Präferenzen, Producer)    |
| 3     | Server-Component-Pilot, unified error fallback, Zod-Schemas, dieses Dokument |
| 4     | (geplant) E2E-Ausbau, Komponententests, A11y-Smoke                           |
| 5     | (geplant) Barrel-Audit, `lib/utils` Aufteilung, i18n-Vorbereitung            |
