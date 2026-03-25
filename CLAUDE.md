# CLAUDE.md — v0-sustainable-online-shop (Frontend)

> **WICHTIG:** Lies beim Start immer auch die CLAUDE.md des Backend-Repos unter
> `../marketplace-backend/CLAUDE.md` — sie enthält aktuelle API-Pfade, Konventionen
> und Business-Regeln, die hier nicht dupliziert werden.

---

## Projekt-Überblick

**Typ:** Next.js 15 Frontend (React 18, TypeScript, Tailwind CSS, shadcn/ui)
**Zweck:** Marketplace für nachhaltig zertifizierte Textilprodukte
**Backend:** Spring Boot REST API → `https://marketplace-backend-1-1w30.onrender.com`
**Vollständige API-Docs:** `docs/api-integration.md` in diesem Repo

---

## Technologie-Stack

| Technologie | Version | Zweck |
|-------------|---------|-------|
| Next.js | ^15 | Framework (App Router) |
| React | ^18 | UI |
| TypeScript | ^5 | Sprache |
| Tailwind CSS | ^3 | Styling |
| shadcn/ui + Radix UI | latest | Komponentenbibliothek |
| sonner | ^2 | Toast-Notifications |
| lucide-react | ^0.454 | Icons |

---

## Projektstruktur

```
src/
  App.tsx               — Root-Komponente mit Routing-Logik
  app/                  — Next.js App Router (Seiten)
  components/           — UI-Komponenten
  context/
    AuthContext.tsx      — Globaler Auth-State (User, AccessToken, isAuthenticated)
  lib/
    api-client.ts        — Zentraler HTTP-Client (fetch wrapper, Token-Handling)
  services/
    auth.service.ts      — Auth-API-Calls
    user.service.ts      — User-Profil-API-Calls
    address.service.ts   — Adress-API-Calls
    index.ts             — Re-Export aller Services
  types/
    index.ts             — Alle TypeScript-Typen & DTOs
  styles/               — Globale Styles
4claude/                — Projektdokumentation (Konzept, Module, Architektur)
docs/
  api-integration.md    — API-Integration Guide für v0
```

---

## API-Client Konventionen

**Datei:** `src/lib/api-client.ts`

- Base URL: `process.env.NEXT_PUBLIC_API_URL` (default: `http://localhost:8080`)
- **Production:** `NEXT_PUBLIC_API_URL=https://marketplace-backend-1-1w30.onrender.com`
- Access Token wird **im Modul-Memory** gehalten (kein localStorage → XSS-sicher)
- `credentials: 'include'` ist immer gesetzt (für HttpOnly Refresh-Token-Cookie)
- Response Envelope: `{ status, message, data }` → `apiRequest` gibt direkt `data` zurück
- 204 No Content → gibt `null` zurück
- Fehler werfen `ApiError(status, message, body)`

```typescript
// Neuen Service anlegen:
import { apiRequest } from "@/src/lib/api-client"

export const MyService = {
  async doSomething(): Promise<SomeType> {
    return apiRequest("/api/v1/...", { method: "POST", body: JSON.stringify(dto) })
  }
}
```

---

## Auth-Flow

1. Login → `AuthService.login()` → `accessToken` im Speicher via `setAccessToken()`
2. Alle Requests → `api-client` hängt `Authorization: Bearer <token>` Header an
3. Token abgelaufen (401) → `AuthService.refresh()` → Cookie wird automatisch mitgesendet
4. Logout → `AuthService.logout()` → Cookie wird gelöscht, Token genullt

**AuthContext** (`src/context/AuthContext.tsx`) verwaltet:
- `user: User | null`
- `accessToken: string | null`
- `isAuthenticated: boolean`
- `isLoading: boolean`

---

## TypeScript-Typen

Alle Typen in `src/types/index.ts`. Wichtige Typen:

```typescript
UserRole        = "BUYER" | "SELLER" | "ADMIN"
AccountStatus   = "ACTIVE" | "SUSPENDED" | "DELETED"
SellerStatus    = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
AddressType     = "SHIPPING" | "BILLING" | "BOTH"
SellerValueProfileLevel = "STANDARD" | "LEVEL_2" | "LEVEL_3"  // Backend: STANDARD|LEVEL_2|LEVEL_3
```

**Hinweis:** Backend gibt `UserStatus` mit `PENDING` zurück (noch nicht verifiziert).
Frontend-Typ `AccountStatus` muss ggf. um `"PENDING"` erweitert werden.

---

## Umgebungsvariablen

```env
NEXT_PUBLIC_API_URL=https://marketplace-backend-1-1w30.onrender.com
```

Lokal (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## Implementierte Module (Stand: 2026-03-22)

| Modul | Status | Services/Komponenten |
|-------|--------|---------------------|
| Auth (Login/Register/Logout/Refresh) | ✅ Vollständig | `auth.service.ts`, `AuthContext.tsx` |
| User Profil (GET/PATCH/DELETE) | ✅ Vollständig | `user.service.ts` |
| Adressen (CRUD + Default) | ✅ Vollständig | `address.service.ts` |
| Buyer Value Profile | ✅ Vollständig | `buyer-value-profile.service.ts` |
| Seller Profil | ✅ Vollständig | `seller-profile.service.ts` |
| Seller Value Profile | ✅ Vollständig | `seller-value-profile.service.ts` |
| Admin Panel | ✅ Service + Komponenten | `admin.service.ts`, `AdminUsers.tsx`, `AdminUserDetail.tsx` |
| Produkte | ✅ Service vorhanden (Backend implementiert) | `product.service.ts` |
| Kategorien | ✅ Service vorhanden (Backend implementiert) | `category.service.ts` |
| Zertifikate | ✅ Service vorhanden (Backend implementiert) | `certificate.service.ts` |
| Matching Engine | ⬜ Backend noch nicht implementiert | — |
| Warenkorb / Checkout | ⬜ Backend noch nicht implementiert | — |
| Bestellungen | ⬜ Backend noch nicht implementiert | — |

---

## Bekannte Abweichungen Frontend ↔ Backend

| Feld | Status | Notiz |
|------|--------|-------|
| `AccountStatus` + `"PENDING"` | ✅ Behoben | Backend sendet `PENDING` für unverifizierte User — in `types/index.ts` ergänzt |
| `SellerValueProfileLevel` | ✅ Behoben | Backend-Werte `STANDARD\|LEVEL_2\|LEVEL_3` in `types/index.ts` korrigiert |
| `PagedResponse<T>` Feldnamen | ✅ Behoben | Backend: `{ items, page, size, totalElements, totalPages }` — Typ ergänzt |
| `expiresIn` Feldname | ✅ Behoben | Backend-Feld ist `expiresIn` (nicht `expiresInSeconds`) — bestätigt |
| Product-Liste (`GET /api/v1/products`) | ⚠️ Aktiv | Gibt Spring-Page zurück: `{ content[], totalElements, totalPages, size, number }` — nicht `PagedResponse<T>`. Typ: `ProductPage` verwenden. |
| Product-Detail intern (`GET /api/v1/products/{id}`) | ⚠️ Aktiv | Gibt `{ title }` zurück (nicht `{ name }`), kein ApiResponse-Wrapper |
| Product-Detail öffentlich (`GET /api/v1/products/{slug}`) | ⚠️ Aktiv | Gibt `{ name }` zurück (nicht `{ title }`) |

---

## Strikte Grenzen

- **Keine Änderungen an `src/main/` des Backends** — insbesondere keine Änderungen an Mail-Templates, Mail-Links, `AuthService.java` oder anderen Business-Logic-Klassen im Backend-Repo. Änderungen dort nur auf explizite Anweisung des Users.

---

## Code-Konventionen

- Komponenten: PascalCase (z.B. `ProductCard.tsx`)
- Services: camelCase Objekt mit async-Methoden (z.B. `AuthService.login()`)
- Typen/Interfaces: PascalCase
- API-Pfade: immer `/api/v1/...` (relative Pfade im apiRequest)
- Imports: `@/src/...` Alias verwenden
- Fehlerbehandlung: `ApiError` fangen, `error.status` für HTTP-Statuscode

---

## Entwicklung

```bash
# Dev-Server starten
npm run dev
# oder
bun dev

# Build
npm run build

# Lint
npm run lint
```

---

## Verknüpfte Repos

- **Backend:** `../marketplace-backend/` → Spring Boot API
- **Backend CLAUDE.md:** `../marketplace-backend/CLAUDE.md` — **immer mit lesen!**
- **Backend API-Docs:** `../marketplace-backend/docs/api-for-v0.md`
