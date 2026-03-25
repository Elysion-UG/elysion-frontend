# API-Integration Guide — Sustainable Shop Frontend

**Backend URL:** `https://marketplace-backend-1-1w30.onrender.com`
**API-Prefix:** `/api/v1`
**Vollständige Backend-Docs:** `../../marketplace-backend/docs/api-for-v0.md`

---

## Bestehende Infrastruktur (bereits implementiert)

### HTTP-Client: `src/lib/api-client.ts`

```typescript
import { apiRequest, ApiError, setAccessToken, getAccessToken } from "@/src/lib/api-client"

// Einfacher GET-Request
const user = await apiRequest<User>("/api/v1/users/me")

// POST mit Body
const result = await apiRequest<{ userId: string; email: string }>("/api/v1/auth/register", {
  method: "POST",
  body: JSON.stringify(dto),
})

// Fehlerbehandlung
try {
  await apiRequest("/api/v1/...")
} catch (e) {
  if (e instanceof ApiError) {
    console.log(e.status)   // HTTP Status
    console.log(e.message)  // Backend message
    console.log(e.body)     // Vollständiger Error-Body inkl. error-Code & fields
  }
}
```

**Wichtig:**
- `credentials: 'include'` ist immer gesetzt → Refresh-Token-Cookie wird automatisch mitgesendet
- Access Token wird automatisch als `Authorization: Bearer ...` angehängt
- Response-Envelope `{ status, message, data }` wird automatisch ausgepackt → `data` direkt zurückgegeben
- 204 No Content → `null`

### Umgebungsvariable

```env
# .env.local (Entwicklung)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Produktion
NEXT_PUBLIC_API_URL=https://marketplace-backend-1-1w30.onrender.com
```

---

## Bereits implementierte Services

### `src/services/auth.service.ts`

| Methode | Endpoint | Beschreibung |
|---------|----------|-------------|
| `AuthService.register(dto)` | `POST /api/v1/auth/register` | Registrierung (BUYER oder SELLER) |
| `AuthService.login(dto)` | `POST /api/v1/auth/login` | Login → AccessToken + Cookie |
| `AuthService.refresh()` | `POST /api/v1/auth/refresh` | Token erneuern via Cookie |
| `AuthService.logout()` | `POST /api/v1/auth/logout` | Logout + Cookie löschen |
| `AuthService.verifyEmail(token)` | `POST /api/v1/auth/verify-email` | E-Mail verifizieren |
| `AuthService.forgotPassword(email)` | `POST /api/v1/auth/forgot-password` | Passwort-Reset anfordern |
| `AuthService.resetPassword(token, pw)` | `POST /api/v1/auth/reset-password` | Neues Passwort setzen |

### `src/services/user.service.ts`

| Methode | Endpoint | Beschreibung |
|---------|----------|-------------|
| `UserService.getMe()` | `GET /api/v1/users/me` | Aktuellen User abrufen |
| `UserService.updateMe(dto)` | `PATCH /api/v1/users/me` | Profil aktualisieren |
| `UserService.deleteMe()` | `DELETE /api/v1/users/me` | Account soft-delete |

### `src/services/address.service.ts`

| Methode | Endpoint | Beschreibung |
|---------|----------|-------------|
| `AddressService.list()` | `GET /api/v1/users/me/addresses` | Alle Adressen |
| `AddressService.create(dto)` | `POST /api/v1/users/me/addresses` | Neue Adresse |
| `AddressService.update(id, dto)` | `PATCH /api/v1/users/me/addresses/{id}` | Adresse aktualisieren |
| `AddressService.setDefault(id)` | `PATCH /api/v1/users/me/addresses/{id}/default` | Als Standard setzen |
| `AddressService.delete(id)` | `DELETE /api/v1/users/me/addresses/{id}` | Adresse löschen |

---

## Noch zu implementierende Services

### SellerProfileService (anlegen in `src/services/seller-profile.service.ts`)

```typescript
import { apiRequest } from "@/src/lib/api-client"
import type { SellerProfile } from "@/src/types"

export const SellerProfileService = {
  // Nur für SELLER-Rolle
  async get(): Promise<SellerProfile> {
    return apiRequest("/api/v1/users/me/seller-profile")
  },

  async update(dto: Partial<{ companyName: string; vatId: string; iban: string }>): Promise<SellerProfile> {
    return apiRequest("/api/v1/users/me/seller-profile", {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },
}
```

### SellerValueProfileService

```typescript
export const SellerValueProfileService = {
  async get(): Promise<SellerValueProfile> {
    return apiRequest("/api/v1/users/me/seller/value-profile")
  },

  async upsert(dto: { level: "STANDARD" | "LEVEL_2" | "LEVEL_3"; payload?: string; score?: number }): Promise<SellerValueProfile> {
    return apiRequest("/api/v1/users/me/seller/value-profile", {
      method: "PUT",
      body: JSON.stringify(dto),
    })
  },
}
```

### AdminService (anlegen in `src/services/admin.service.ts`)

```typescript
// Nur für ADMIN-Rolle
export const AdminService = {
  // User-Liste (paginiert)
  async listUsers(page = 0, size = 20): Promise<AdminUserListResponse> {
    return apiRequest(`/api/v1/admin/users?page=${page}&size=${size}`)
  },

  async getUser(id: string): Promise<AdminUserDetails> {
    return apiRequest(`/api/v1/admin/users/${id}`)
  },

  async suspendUser(id: string): Promise<{ userId: string; status: string }> {
    return apiRequest(`/api/v1/admin/users/${id}/suspend`, { method: "PATCH", body: "{}" })
  },

  async activateUser(id: string): Promise<{ userId: string; status: string }> {
    return apiRequest(`/api/v1/admin/users/${id}/activate`, { method: "PATCH", body: "{}" })
  },

  // Seller Profile Verwaltung
  async approveSellerProfile(sellerProfileId: string): Promise<SellerProfile> {
    return apiRequest(`/api/v1/admin/seller-profiles/${sellerProfileId}/approve`, { method: "POST", body: "{}" })
  },

  async rejectSellerProfile(sellerProfileId: string, reason: string): Promise<SellerProfile> {
    return apiRequest(`/api/v1/admin/seller-profiles/${sellerProfileId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  },

  async suspendSellerProfile(sellerProfileId: string, reason: string): Promise<SellerProfile> {
    return apiRequest(`/api/v1/admin/seller-profiles/${sellerProfileId}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  },
}
```

---

## Typen-Korrekturen (bekannte Abweichungen)

### 1. `UserStatus` um `PENDING` erweitern

```typescript
// src/types/index.ts — ändern von:
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED"
// zu:
export type AccountStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DELETED"
```

### 2. `SellerValueProfileLevel` korrigieren

```typescript
// Backend gibt zurück: "STANDARD" | "LEVEL_2" | "LEVEL_3"
// src/types/index.ts — ändern von:
export type SellerValueProfileLevel = "STANDARD" | "ADVANCED" | "PREMIUM"
// zu:
export type SellerValueProfileLevel = "STANDARD" | "LEVEL_2" | "LEVEL_3"
```

### 3. `PaginatedResponse` an Backend-Struktur anpassen

```typescript
// Backend gibt zurück: { items, page, size, totalElements, totalPages }
// src/types/index.ts — hinzufügen:
export interface PagedResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
```

### 4. Admin-spezifische Typen hinzufügen

```typescript
export interface AdminUserListItem {
  id: string
  email: string
  role: UserRole
  status: AccountStatus
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminUserDetails extends AdminUserListItem {
  firstName: string
  lastName: string
  phone?: string
  sellerProfile?: SellerProfile & {
    approvedAt?: string
    approvedBy?: string
    rejectedAt?: string
    rejectedBy?: string
    rejectionReason?: string
    createdAt: string
    updatedAt: string
  }
}
```

---

## Response-Struktur aller Endpoints

```
GET  /api/v1/users/me                   → User
PATCH /api/v1/users/me                  → User
DELETE /api/v1/users/me                 → { userId: string }

GET  /api/v1/users/me/addresses         → Address[]
POST /api/v1/users/me/addresses         → Address
PATCH /api/v1/users/me/addresses/{id}   → Address
PATCH /api/v1/users/me/addresses/{id}/default → Address
DELETE /api/v1/users/me/addresses/{id}  → null (204)

GET  /api/v1/users/me/seller-profile    → SellerProfile
PATCH /api/v1/users/me/seller-profile   → SellerProfile

GET  /api/v1/users/me/seller/value-profile → SellerValueProfile
PUT  /api/v1/users/me/seller/value-profile → SellerValueProfile

GET  /api/v1/admin/users                → PagedResponse<AdminUserListItem>
GET  /api/v1/admin/users/{id}           → AdminUserDetails
PATCH /api/v1/admin/users/{id}/suspend  → { userId, status }
PATCH /api/v1/admin/users/{id}/activate → { userId, status }

POST /api/v1/admin/seller-profiles/{id}/approve  → SellerProfile
POST /api/v1/admin/seller-profiles/{id}/reject   → SellerProfile
POST /api/v1/admin/seller-profiles/{id}/suspend  → SellerProfile
```

---

## Ausstehende Frontend-Seiten (geplant)

### `/verify-email` — E-Mail-Verifizierung

> **Hintergrund:** Das Backend wird den Verify-Link künftig auf das Frontend zeigen lassen:
> `{APP_FRONTEND_URL}/verify-email?token=xxx`
> (Abhängig von Backend-Ticket: "Email-Verifizierung — Link auf Frontend umleiten")

Die Seite `app/verify-email/page.tsx` soll:

1. Token aus URL-Parameter lesen
2. Automatisch `AuthService.verifyEmail(token)` aufrufen
3. Drei Zustände anzeigen:
   - **Laden** — "Deine E-Mail wird bestätigt..."
   - **Erfolg** — "E-Mail bestätigt! Du wirst zum Login weitergeleitet." → Redirect nach 3s zu `/login`
   - **Fehler** — "Link ungültig oder abgelaufen." + Button "Neuen Link anfordern"

```typescript
// Relevante Service-Methode ist bereits vorhanden:
AuthService.verifyEmail(token)  // POST /api/v1/auth/verify-email

// Fehlercode bei ungültigem/abgelaufenem Token:
// HTTP 400 / error: "BAD_REQUEST"
```

---

### `/reset-password` — Passwort zurücksetzen

> **Hintergrund:** Das Backend wird den Reset-Link künftig auf das Frontend zeigen lassen:
> `{APP_FRONTEND_URL}/reset-password?token=xxx`
> (Abhängig von Backend-Ticket: "Password-Reset — Link auf Frontend umleiten")

Die Seite `app/reset-password/page.tsx` soll:

1. Token aus URL-Parameter lesen
2. Formular mit "Neues Passwort" + "Passwort bestätigen" anzeigen
3. Bei Absenden `AuthService.resetPassword(token, newPassword)` aufrufen
4. Drei Zustände:
   - **Formular** — Eingabe des neuen Passworts
   - **Erfolg** — "Passwort erfolgreich geändert." → Redirect nach 3s zu `/login`
   - **Fehler** — "Link ungültig oder abgelaufen." + Button "Neuen Link anfordern"

```typescript
// Relevante Service-Methode ist bereits vorhanden:
AuthService.resetPassword(token, newPassword)  // POST /api/v1/auth/reset-password

// Fehlercode bei ungültigem/abgelaufenem Token:
// HTTP 400 / error: "BAD_REQUEST"
```

---

## Fehlerbehandlung Best Practices

```typescript
import { ApiError } from "@/src/lib/api-client"

async function handleApiCall() {
  try {
    const data = await SomeService.doSomething()
    // ...
  } catch (e) {
    if (e instanceof ApiError) {
      switch (e.status) {
        case 400:
          // Validation-Fehler → e.body.data.fields enthält Feld-Fehler
          const fields = (e.body as any)?.data?.fields
          break
        case 401:
          // Nicht eingeloggt → zur Login-Seite
          break
        case 403:
          // Keine Berechtigung (falsche Rolle)
          break
        case 404:
          // Nicht gefunden
          break
        case 409:
          // Konflikt (z.B. E-Mail bereits vergeben)
          break
        case 429:
          // Rate Limited
          break
      }
    }
  }
}
```

---

## Seller-Approval Flow (wichtig für UI)

```
Registrierung als SELLER
        ↓
User.role = "BUYER" (!) — noch nicht SELLER!
User.sellerProfile.status = "PENDING"
        ↓
Admin genehmigt → POST /api/v1/admin/seller-profiles/{id}/approve
        ↓
User.role = "SELLER"
User.sellerProfile.status = "APPROVED"
```

**UI-Hinweis:** Ein User mit `role: "BUYER"` und `sellerProfile.status: "PENDING"` ist ein wartender Seller!
Der User bekommt `role: "SELLER"` erst nach Admin-Genehmigung.

---

## Authentifizierungs-Header

```typescript
// Wird automatisch vom api-client gesetzt — NICHT manuell setzen!
Authorization: Bearer <accessToken>

// Refresh Token kommt automatisch als Cookie — credentials: 'include' ist gesetzt
Cookie: refreshToken=<httponly-cookie>
```
