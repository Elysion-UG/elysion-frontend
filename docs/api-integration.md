# API-Integration Guide — Sustainable Shop Frontend

**Backend URL:** `https://marketplace-backend-1-1w30.onrender.com`
**API-Prefix:** `/api/v1`
**Vollständige Backend-Docs:** `../../marketplace-backend/docs/api-for-v0.md`

---

## HTTP-Client: `src/lib/api-client.ts`

```typescript
import {
  apiRequest,
  apiRequestRaw,
  apiUpload,
  ApiError,
  setAccessToken,
  getAccessToken,
} from "@/src/lib/api-client"

// GET-Request
const user = await apiRequest<User>("/api/v1/users/me")

// POST mit Body
const result = await apiRequest<TokensResponse>("/api/v1/auth/login", {
  method: "POST",
  body: JSON.stringify(dto),
})

// Multipart Upload (Content-Type wird automatisch gesetzt)
const file = await apiUpload<FileUploadResponse>("/api/v1/files/upload", formData)

// Fehlerbehandlung
try {
  await apiRequest("/api/v1/...")
} catch (e) {
  if (e instanceof ApiError) {
    console.log(e.status) // HTTP Status
    console.log(e.message) // Backend message
    console.log(e.body) // Vollständiger Error-Body inkl. error-Code & fields
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

## Implementierte Services (`src/services/`)

Alle Services werden aus `src/services/index.ts` re-exportiert.

| Service                     | Endpoints                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `AuthService`               | register, login, logout, refresh, verifyEmail, forgotPassword, resetPassword                                   |
| `UserService`               | getCurrentUser, updateProfile, deleteAccount _(noch Mocks — P1-2)_                                             |
| `AddressService`            | list, create, update, setDefault, delete                                                                       |
| `AdminService`              | listUsers, getUser, suspendUser, activateUser, approveSellerProfile, rejectSellerProfile, suspendSellerProfile |
| `SellerProfileService`      | get, update                                                                                                    |
| `SellerValueProfileService` | get, upsert                                                                                                    |
| `BuyerValueProfileService`  | get, upsert                                                                                                    |
| `CategoryService`           | list, tree, get, create, update, delete                                                                        |
| `ProductService`            | list, getBySlug, getById, create, update, updateStatus, addImage, deleteImage, createVariant                   |
| `CertificateService`        | list, get, create, update, linkToProduct, getProductCertificates                                               |
| `CartService`               | get, addItem, updateItem, removeItem, clear                                                                    |
| `CheckoutService`           | preview, complete                                                                                              |
| `OrderService`              | list, getById                                                                                                  |
| `SellerOrderService`        | list, getById, updateStatus, ship, deliver, listSettlements                                                    |
| `PaymentService`            | createIntent, getStatus                                                                                        |
| `FileService`               | upload, getMetadata, getContentUrl, delete, link, unlink, uploadAndLink                                        |
| `RecommendationService`     | getRecommendations                                                                                             |

---

## Fehlerbehandlung Best Practices

```typescript
import { ApiError } from "@/src/lib/api-client"

async function handleApiCall() {
  try {
    const data = await SomeService.doSomething()
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

## Auth-Flow

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

---

## Response-Struktur Referenz

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

GET  /api/v1/products                   → ProductPage (Spring Page)
GET  /api/v1/products/{slug}            → ProductDetail
POST /api/v1/products                   → ProductCommandResponse
PATCH /api/v1/products/{id}             → ProductCommandResponse
PATCH /api/v1/products/{id}/status      → ProductCommandResponse

GET  /api/v1/cart                       → Cart
POST /api/v1/cart/items                 → Cart
PATCH /api/v1/cart/items/{id}           → Cart
DELETE /api/v1/cart/items/{id}          → Cart (204)

POST /api/v1/checkout                   → CheckoutStartResponse
POST /api/v1/checkout/complete          → CheckoutCompleteResponse

GET  /api/v1/orders                     → Order[]
GET  /api/v1/orders/{id}                → OrderDetail

GET  /api/v1/seller/orders              → OrderGroupsPage
PATCH /api/v1/seller/orders/{id}/ship   → OrderGroupDetail
GET  /api/v1/seller/orders/settlements  → SettlementsPage

POST /api/v1/files/upload               → FileUploadResponse
GET  /api/v1/files/{id}                 → FileMetadata
GET  /api/v1/files/{id}/content         → (binary — use as <img src>)

GET  /api/v1/recommendations            → Recommendation[] (Backend noch nicht implementiert)
```

---

## Authentifizierungs-Header

```typescript
// Wird automatisch vom api-client gesetzt — NICHT manuell setzen!
Authorization: Bearer <accessToken>

// Refresh Token kommt automatisch als Cookie — credentials: 'include' ist gesetzt
Cookie: refreshToken=<httponly-cookie>
```
