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

| Service                     | Endpoints                                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthService`               | register, login, logout, refresh, verifyEmail, forgotPassword, resetPassword                                                                                      |
| `UserService`               | getCurrentUser, updateProfile, deleteAccount                                                                                                                      |
| `AddressService`            | list, create, update, setDefault, delete                                                                                                                          |
| `AdminService`              | listUsers, getUser, suspendUser, activateUser, approveSellerProfile, rejectSellerProfile, suspendSellerProfile, updateSellerCommission, listDuePayouts, runPayout |
| `SellerProfileService`      | get, update                                                                                                                                                       |
| `SellerValueProfileService` | get, upsert                                                                                                                                                       |
| `BuyerValueProfileService`  | get, upsert                                                                                                                                                       |
| `CategoryService`           | list, tree, get, create, update, delete                                                                                                                           |
| `ProductService`            | list, getBySlug, getById, create, update, updateStatus, addImage, deleteImage, createVariant                                                                      |
| `CertificateService`        | list, get, create, update, linkToProduct, getProductCertificates                                                                                                  |
| `CartService`               | get, addItem, updateItem, removeItem, clear                                                                                                                       |
| `CheckoutService`           | preview, complete                                                                                                                                                 |
| `OrderService`              | list, getById                                                                                                                                                     |
| `SellerOrderService`        | list, getById, updateStatus, ship, deliver, listSettlements                                                                                                       |
| `SellerPayoutService`       | getAccount, createOnboardingLink                                                                                                                                  |
| `PaymentService`            | createIntent, getStatus                                                                                                                                           |
| `FileService`               | upload, getMetadata, getContentUrl, delete, link, unlink, uploadAndLink                                                                                           |
| `RecommendationService`     | getRecommendations                                                                                                                                                |

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
Admin genehmigt → POST /api/v1/admin/sellers/{id}/approve
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

GET  /api/v1/admin/users                    → PagedResponse<AdminUserListItem>
GET  /api/v1/admin/users/{id}               → AdminUserDetails
POST /api/v1/admin/users/{id}/suspend       → { userId, status }
POST /api/v1/admin/users/{id}/unsuspend     → { userId, status }

GET  /api/v1/admin/sellers                  → PagedResponse<AdminSellerListItem>
GET  /api/v1/admin/sellers/{id}             → AdminSellerDetail
POST /api/v1/admin/sellers/{id}/approve     → SellerProfile
POST /api/v1/admin/sellers/{id}/reject      → SellerProfile
POST /api/v1/admin/sellers/{id}/suspend     → SellerProfile

GET  /api/v1/admin/orders                   → PagedResponse<AdminOrderListItem>
GET  /api/v1/admin/orders/{id}              → AdminOrderDetail

GET  /api/v1/admin/products                 → PagedResponse<AdminProductListItem>
GET  /api/v1/admin/products/{id}            → AdminProductDetail
POST /api/v1/admin/products/{id}/activate   → { id, status }
POST /api/v1/admin/products/{id}/deactivate → { id, status }

GET  /api/v1/admin/payments                 → PagedResponse<AdminPaymentItem>
GET  /api/v1/admin/refunds                  → PagedResponse<AdminRefundItem>
GET  /api/v1/admin/settlements              → PagedResponse<Settlement>
GET  /api/v1/admin/payouts                  → PagedResponse<AdminPayoutItem>

GET  /api/v1/admin/dashboard                → AdminDashboardData

POST /api/v1/admin/maintenance/cleanup-refresh-tokens → { deletedCount }
POST /api/v1/admin/maintenance/expire-pending-orders  → { expiredCount }

GET  /api/v1/products                   → ProductPage (custom pagination: items[], totalItems, page)
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

---

## Plattformgebühr & Auszahlungen (Stripe Connect) — API-Verträge

> **Status (2026-06-01):** Frontend ist gegen diese Verträge implementiert; die
> Backend-Endpoints sind **noch offen** (siehe Backend-Issues). Bis das Backend
> liefert, scheitern die Aufrufe mit 404/501 — die UI fängt das ab.
> Geschäftsregeln: [`MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md) §1.1 / §1.2.

### 1. Plattformgebühr pro Seller (Provision)

- Default für neue Seller: **15 %**, pro Seller vom Admin anpassbar.
- Bezugsgröße: Warenwert pro OrderGroup **exkl. Versand**.
- Stripe-Transaktionsgebühr trägt die Plattform (aus der Provision).

```http
# AdminSellerDetail-Response um commissionRate (Prozent, z. B. 15) erweitern
GET   /api/v1/admin/sellers/{id}            → { ..., commissionRate: number }

# Provision setzen (0–100, max. 2 Nachkommastellen)
PATCH /api/v1/admin/sellers/{id}/commission
      Body: { "commissionRate": number }    → AdminSellerDetail
```

### 2. Seller-Auszahlungskonto (Stripe Connect Express)

```http
GET  /api/v1/seller/payout-account
     → {
         status: "NOT_CONNECTED" | "PENDING" | "ACTIVE" | "RESTRICTED",
         chargesEnabled: boolean,
         payoutsEnabled: boolean,
         detailsSubmitted: boolean,
         requirementsDue?: string[]
       }

POST /api/v1/seller/payout-account/onboarding-link
     → { url: string }   # Stripe Account Link; Frontend leitet dorthin weiter
```

- Nach Abschluss des Connect-Onboardings meldet ein **Stripe-Webhook** das Konto
  serverseitig als `ACTIVE` (`account.updated`).

### 3. Admin-Auszahlungs-Freigabe (monatlich, manuell)

```http
# Pro Seller aggregierte, fällige (DELIVERED, noch nicht ausgezahlte) Settlements
GET  /api/v1/admin/payouts/due
     → PayoutDueItem[] mit {
         sellerId, sellerName,
         payoutAccountStatus: "NOT_CONNECTED" | "PENDING" | "ACTIVE" | "RESTRICTED",
         settlementCount, grossAmount, feeAmount, netAmount,
         currency?, oldestEligibleAt?
       }

# Fällige Settlements eines Sellers freigeben → löst Stripe-Transfer/Payout aus.
# Setzt payoutAccountStatus === "ACTIVE" voraus.
POST /api/v1/admin/payouts/run
     Body: { "sellerId": string }   → AdminPayoutItem
```

- Settlement-Auslöser bleibt **`DELIVERED`** (bestehende Logik).
- Bei Freigabe wird zusätzlich eine **gebrandete Payout-E-Mail** an den Seller versendet.
- `createPayout()` im Backend muss das bestehende `ConflictException`-Stub ersetzen.
