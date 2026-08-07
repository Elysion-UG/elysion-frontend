# API-Integration — Frontend ↔ Backend

Der HTTP-Vertrag zwischen `elysion-frontend` und `elysion-marketplace-backend`:
Client-Verhalten, alle Endpoints, Fehlerbehandlung.

**API-Prefix:** `/api/v1` · **Backend-URL:** siehe [`INDEX.md`](./INDEX.md#umgebungen)
**Backend-Docs:** `../../elysion-marketplace-backend/docs/api-for-v0.md`

> **Doku-Sync:** Ändert sich der API-Vertrag, werden Backend `docs/api/` und diese
> Datei im selben Arbeitsgang aktualisiert ([`CONTRIBUTING.md`](../CONTRIBUTING.md) §6).

---

## HTTP-Client (`src/lib/api-client.ts`)

Alle Backend-Requests laufen ausnahmslos über diesen Client — nie direkt `fetch()`.

```typescript
import { apiRequest, apiUpload, ApiError } from "@/src/lib/api-client"

const user = await apiRequest<User>("/api/v1/users/me")

const result = await apiRequest<TokensResponse>("/api/v1/auth/customer/login", {
  method: "POST",
  body: JSON.stringify(dto),
})

// Multipart — Content-Type wird automatisch gesetzt
const file = await apiUpload<FileUploadResponse>("/api/v1/files/upload", formData)
```

Verhalten:

- **Envelope:** Das Backend antwortet `{ status, message, data }`; `apiRequest` packt
  aus und gibt `data` direkt zurück.
- **204 No Content** → `null`.
- **Fehler** werfen `ApiError(status, message, body)`.
- **Access-Token** wird automatisch als `Authorization: Bearer …` angehängt. Er liegt
  im Modul-Memory, nicht in `localStorage`/`sessionStorage` (XSS-Schutz).
- **`credentials: "include"`** ist immer gesetzt → der HttpOnly-Refresh-Cookie geht
  automatisch mit. Bei 401 refresht der Client einmal und wiederholt den Request.

### Umgebungsvariablen

`NEXT_PUBLIC_API_URL` bleibt **leer** (empfohlen) → relative Pfade, same-origin über
alle Subdomains. Nur für direkten Backend-Zugriff ohne Next.js-Proxy setzen.
Alle Variablen inkl. der server-seitig **erforderlichen** `API_URL` sind in
[`.env.example`](../.env.example) dokumentiert.

---

## Services (`src/services/`)

Ein Service pro Domäne, re-exportiert über `src/services/index.ts`. Die Services
kapseln ausschließlich die Endpoints unten; eigene Fetch- oder Fehlerbehandlung
haben sie nicht.

`auth` · `user` · `address` · `buyer-value-profile` · `seller-profile` ·
`seller-value-profile` · `admin` · `product` · `category` · `material` ·
`certificate` · `cart` · `checkout` · `order` · `seller-order` · `seller-payout` ·
`payment` · `file` · `recommendation` · `monitoring`

> Die Methodennamen stehen im jeweiligen Service — hier bewusst nicht gespiegelt,
> damit sie nicht auseinanderlaufen.

---

## Endpoints

### Auth (`/api/v1/auth`)

Läuft über den Next.js-Auth-Proxy (`src/app/api/v1/auth/[...path]/route.ts`), der den
Refresh-Cookie durchreicht und den Presence-Marker setzt (siehe
[`ARCHITECTURE.md`](./ARCHITECTURE.md#411-serverseitige-first-line-of-defence-68)).

```
POST /register                  → { userId, email }   — BUYER oder SELLER
POST /customer/login            → TokensResponse
POST /seller/login              → TokensResponse
POST /admin/login               → TokensResponse
POST /refresh                   → TokensResponse      — rotiert den Refresh-Cookie
POST /logout                    → null                — widerruft Token, löscht Cookie
POST /verify-email              → null
GET  /verify-email?token=       → null                — link-freundliche Variante
POST /resend-verification       → null                — immer 200 (keine Enumeration)
POST /forgot-password           → null                — immer 200 (keine Enumeration)
POST /reset-password            → null
POST /reset-password/validate   → null                — prüft Token, ohne ihn zu verbrauchen
```

Es gibt **drei portal-spezifische Login-Endpoints** — kein generisches `/login`.

### User, Adressen, Profile

```
GET    /api/v1/users/me                         → User
PATCH  /api/v1/users/me                         → User
DELETE /api/v1/users/me                         → { userId }

GET    /api/v1/users/me/addresses               → Address[]
POST   /api/v1/users/me/addresses               → Address
PATCH  /api/v1/users/me/addresses/{id}          → Address
PATCH  /api/v1/users/me/addresses/{id}/default  → Address
DELETE /api/v1/users/me/addresses/{id}          → null (204)

GET    /api/v1/users/me/profile                 → BuyerValueProfile
PUT    /api/v1/users/me/profile                 → BuyerValueProfile

GET    /api/v1/users/me/seller-profile          → SellerProfile
PATCH  /api/v1/users/me/seller-profile          → SellerProfile

GET    /api/v1/users/me/seller/value-profile    → SellerValueProfile
PUT    /api/v1/users/me/seller/value-profile    → SellerValueProfile
```

Das Buyer-Werteprofil liegt auf `/users/me/profile` — nicht auf `/users/me/value-profile`.

### Produkte

```
GET    /api/v1/products                              → ProductPage
       Filter: search, categoryId, minPrice, maxPrice, sort, page, size
               sellerId    (wiederholbar: ?sellerId=<uuid>&sellerId=<uuid>)
               material    (wiederholbar: ?material=leinen&material=hanf)
               color       (wiederholbar: ?color=rot&color=blau)
               variantSize (wiederholbar: ?variantSize=m&variantSize=l)
GET    /api/v1/products/facets                       → ProductFacets  — public
GET    /api/v1/sellers/facets                        → SellerFacet[]  — public
GET    /api/v1/products/{slug}                       → ProductDetail   — public
GET    /api/v1/products/by-id/{id}                   → ProductInternalDetail — ADMIN/SELLER
GET    /api/v1/products/{productId}/certificates     → Certificate[]  — public
GET    /api/v1/materials                             → Material[]     — Stammdaten für Filter + Seller-Formular
```

**Schreibrouten liegen unter `/api/v1/seller/products`** — `/api/v1/products/**` ist
GET-only (`ProductQueryController`, `ProductIdQueryController`,
`ProductFacetQueryController`, `ProductCertificatePublicController`). Ein Schreibzugriff
auf das Lese-Präfix stirbt als **405** (#219).

```
GET    /api/v1/seller/products                                  → PagedResponse<SellerProductListItem> — SELLER, alle Status (FE nutzt es noch nicht)
POST   /api/v1/seller/products                                  → ProductCommandResponse  (optional materialIds)
PATCH  /api/v1/seller/products/{id}                             → ProductCommandResponse  (materialIds: null=unverändert, []=leeren)
PATCH  /api/v1/seller/products/{id}/status                      → ProductCommandResponse
POST   /api/v1/seller/products/{productId}/images               → ProductCommandResponse
DELETE /api/v1/seller/products/{productId}/images/{imageId}     → null
PATCH  /api/v1/seller/products/{productId}/images/order         → ProductCommandResponse
POST   /api/v1/seller/products/{productId}/variants             → ProductCommandResponse
PATCH  /api/v1/seller/products/{productId}/variants/{variantId} → ProductCommandResponse
DELETE /api/v1/seller/products/{productId}/variants/{variantId} → null
```

Es gibt **kein** `DELETE /api/v1/seller/products/{id}`; `ProductService` bietet deshalb
bewusst keine `delete()`-Methode an.

`PATCH .../status` ist **kein vollwertiger Ersatz**. Die State Machine des Backends
(BE `../../elysion-marketplace-backend/docs/domain/product-lifecycle.md`)
erlaubt nur `DRAFT → REVIEW`, `REVIEW → ACTIVE`, `REVIEW → REJECTED` und `ACTIVE ⇄ INACTIVE`
— alles andere wird abgelehnt. Stilllegen per `INACTIVE` funktioniert also **nur aus
`ACTIVE`**; für ein Produkt in `DRAFT`, `REVIEW` oder `REJECTED` gibt es derzeit **keinen**
Weg, es zu löschen oder auszublenden. Genau `DRAFT` war der Zustand des entfernten
Papierkorb-Buttons — ein Ersatz braucht eine Backend-Entscheidung (`DELETE` oder ein
zusätzlicher Übergang), keinen Frontend-Workaround. Öffentlich sichtbar sind ohnehin nur
`ACTIVE`-Produkte.

Zu Pagination-Shape, `sort`-Werten und dem Unterschied `{slug}` ↔ `by-id/{id}`:
[`BACKEND_QUIRKS.md`](./BACKEND_QUIRKS.md).

#### Filter & Facetten (#49/#50)

**Wiederholbare Filter** kommen aus `ProductListParams` (`sellerId`, `materials`, `colors`,
`sizes`) und werden von `buildQuery` automatisch als wiederholte Parameter serialisiert.
Innerhalb einer Achse gilt OR, zwischen den Achsen AND.

> ⚠️ Der Größen-Filter heißt in der API **`variantSize`**, nicht `size` — `size` ist bereits
> die Seitengröße der Produktliste. Im Frontend heißt das Feld `ProductListParams.sizes`;
> `ProductService.list()` übersetzt es.

**Filter-Facetten** (beide public, beide über `ProductService` + je einen Hook mit langem
`staleTime`):

- `GET /api/v1/products/facets` → `ProductFacets` = `{ colors, sizes }`, je ein Array aus
  `{ value, productCount }`. Werte sind normalisiert (getrimmt, kleingeschrieben) und werden
  **wortwörtlich** als `color`/`variantSize` zurückgeschickt — Anzeige-Labels (Kapitalisierung,
  Farb-Swatch) macht das Frontend, der Filterwert bleibt das Original.
  Hook: `useProductFacets()`.
- `GET /api/v1/sellers/facets` → `SellerFacet[]` = `{ id, companyName, productCount }`,
  alphabetisch nach `companyName`, nicht paginiert. `id` ist exakt der Wert für `sellerId`.
  Hook: `useSellerFacets()`.

Beide Facetten sind **global**: Sie verengen sich nicht mit den übrigen aktiven Filtern, und
`productCount` zählt Produkte (nicht Varianten) im Status `ACTIVE`. Die UI darf deshalb nicht
suggerieren, die Zahlen seien auf die aktuelle Filterkombination bezogen.

Fällt eine der beiden Facetten aus (HTTP-Fehler oder Schemaverletzung), ist das Ergebnis
dasselbe wie bei einer leeren Facette — die Sidebar-Sektion verschwindet. Die UI muss den
Fehlerzustand deshalb explizit anzeigen (`isError` der Hooks), sonst liest der Nutzer den
Ausfall als „Filter entfernt".

### Kategorien

```
GET    /api/v1/categories                          → Category[]      — flache Liste, aktiv
GET    /api/v1/categories/tree                     → CategoryNode[]  — verschachtelt, aktiv
POST   /api/v1/admin/categories                    → Category        — ADMIN
PATCH  /api/v1/admin/categories/{id}               → Category        — ADMIN
PATCH  /api/v1/admin/categories/{id}/activate      → Category        — ADMIN
PATCH  /api/v1/admin/categories/{id}/deactivate    → Category        — ADMIN
```

Schreib-Operationen liegen unter `/api/v1/admin/categories`. `/api/v1/categories` ist der
öffentliche Lesepfad und kennt **nur `GET`** — ein `POST` dorthin endet als 405 (#178).

**Pflichtfelder bei `POST` und `PATCH`:** `name`, `slug` und `order` sind bei **beiden**
Operationen zwingend. `order` ist `INTEGER NOT NULL DEFAULT 0` — ein fehlendes Feld ergibt
kein Default, sondern `400 "order is required"`; zulässig ist nur eine **ganze Zahl ≥ 0**
(`@Min(0)`, Jackson `Integer`).

**`PATCH` ist ein Voll-Ersatz, kein Sparse-Patch.** Das Backend leitet `level` bei jedem
Update neu aus `parentId` ab: fehlt `parentId`, landet die Kategorie stillschweigend auf
Root/Ebene 1. Der aktuelle Parent muss also bei jedem Update mitgeschickt werden.
`isActive` darf im `PATCH`-Body **nicht** vorkommen — Lifecycle-Wechsel laufen
ausschließlich über `activate`/`deactivate`.

Kategorien werden **deaktiviert, nicht gelöscht** — es gibt kein `DELETE`.

### Zertifikate

Drei getrennte Pfad-Familien für dieselbe Domäne:

```
# Seller (Legacy-Pfad)
POST   /api/v1/certificates                                  → Certificate
GET    /api/v1/certificates                                  → Certificate[]
GET    /api/v1/certificates/{id}                             → Certificate
PATCH  /api/v1/certificates/{id}                             → Certificate  — nur im Status PENDING
POST   /api/v1/certificates/{certId}/products/{productId}    → null
DELETE /api/v1/certificates/{certId}/products/{productId}    → null

# Seller (portal-spezifisch)
GET    /api/v1/seller/certificates                           → Certificate[]
GET    /api/v1/seller/certificates/{id}                      → Certificate
POST   /api/v1/seller/certificates                           → Certificate
POST   /api/v1/seller/certificates/{certId}/products/{productId}   → null
DELETE /api/v1/seller/certificates/{certId}/products/{productId}   → null

# Admin
GET    /api/v1/admin/certificates                            → PagedResponse<Certificate>
GET    /api/v1/admin/certificates/{id}                       → Certificate
PATCH  /api/v1/admin/certificates/{id}/verify                → Certificate
PATCH  /api/v1/admin/certificates/{id}/reject                → Certificate
```

`verify`/`reject` sind zusätzlich über `AdminService` erreichbar — identischer Endpoint.

### Warenkorb & Checkout

```
GET    /api/v1/cart                     → Cart
POST   /api/v1/cart/items               → Cart
PATCH  /api/v1/cart/items/{id}          → Cart
DELETE /api/v1/cart/items/{id}          → Cart (204)

POST   /api/v1/checkout                 → CheckoutStartResponse
POST   /api/v1/checkout/complete        → CheckoutCompleteResponse
```

Zu den Feldabweichungen in `CheckoutStartResponse` (kein `total`, kein `shippingCost`):
[`BACKEND_QUIRKS.md`](./BACKEND_QUIRKS.md).

### Bestellungen

```
GET    /api/v1/orders                          → Order[]
GET    /api/v1/orders/{id}                     → OrderDetail

GET    /api/v1/seller/orders                   → OrderGroupsPage
GET    /api/v1/seller/orders/{id}              → OrderGroupDetail
PATCH  /api/v1/seller/orders/{id}/status       → OrderGroupDetail
POST   /api/v1/seller/orders/{id}/ship         → OrderGroupDetail
POST   /api/v1/seller/orders/{id}/deliver      → OrderGroupDetail
GET    /api/v1/seller/settlements              → Settlement[]
```

Settlements liegen auf `/seller/settlements` — **nicht** unter `/seller/orders/`.

#### Versandfrist (`shippingSla`) — nur Seller-Reads

Alle Seller-Order-Reads liefern die Versandfrist als **reinen Lesezustand** (Backend #143).
Es gibt **keine** Aktion dazu: eine Überschreitung löst der Verkäufer durch Versenden auf.

```
shippingSla: {
  status:     "NOT_APPLICABLE" | "PENDING" | "BREACHED" | "MET" | "MISSED"
  deadlineAt: ISO-Timestamp | null   // eingefrorene Frist, null vor dem Zahlungseinzug
  breachedAt: ISO-Timestamp | null   // Zeitpunkt der Eskalation an den Verkäufer
}
```

- `NOT_APPLICABLE` — kein Versand geschuldet (nicht captured, storniert) → **nichts anzeigen**
- `PENDING` — Frist läuft · `BREACHED` — abgelaufen, nichts versandt
- `MET` / `MISSED` — versandt vor bzw. nach der Frist
- Das Zeitfenster (Default 48 h) ist Server-Konfiguration — im Frontend steht **keine**
  48h-Konstante mehr; die Frist wird nie clientseitig berechnet.
- Das Feld fehlt bei Bestellungen aus der Zeit vor #143; der Normalizer behandelt es als
  „nicht vorhanden" und rendert nichts.
- Frontend: `src/lib/shipping-sla.ts` (Formatierung), `shippingSlaLabel`/`shippingSlaColor`
  in `sellerDashboard.constants.ts`.

`OrderGroupDetail` trägt neben `total` zusätzlich `subtotal` und `shipping`.

### Zahlungen

```
POST   /api/v1/payments/create-intent   → PaymentIntent
GET    /api/v1/payments/{paymentId}     → PaymentStatusResponse
```

### Dateien

```
POST   /api/v1/files/upload             → FileUploadResponse
GET    /api/v1/files/{id}               → FileMetadata
GET    /api/v1/files/{id}/content       → binär — direkt als <img src> nutzbar, kein Auth
POST   /api/v1/files/{id}/link          → null
POST   /api/v1/files/{id}/unlink        → null
PUT    /api/v1/files/{id}/replace       → FileUploadResponse
DELETE /api/v1/files/{id}               → null
```

### Empfehlungen

```
GET    /api/v1/recommendations?limit=   → Recommendation[]
```

### Admin

Alle Endpoints erfordern die Rolle ADMIN.

```
GET    /api/v1/admin/dashboard                       → AdminDashboardData

GET    /api/v1/admin/users                           → PagedResponse<AdminUserListItem>
GET    /api/v1/admin/users/{id}                      → AdminUserDetails
POST   /api/v1/admin/users/{id}/suspend              → { userId, status }
POST   /api/v1/admin/users/{id}/unsuspend            → { userId, status }

GET    /api/v1/admin/sellers                         → PagedResponse<AdminSellerListItem>
GET    /api/v1/admin/sellers/{id}                    → AdminSellerDetail
POST   /api/v1/admin/sellers/{id}/approve            → SellerProfile
POST   /api/v1/admin/sellers/{id}/reject             → SellerProfile
POST   /api/v1/admin/sellers/{id}/suspend            → SellerProfile
PATCH  /api/v1/admin/sellers/{id}/commission         → AdminSellerDetail

GET    /api/v1/admin/orders                          → PagedResponse<AdminOrderListItem>
GET    /api/v1/admin/orders/{id}                     → AdminOrderDetail

GET    /api/v1/admin/products                        → PagedResponse<AdminProductListItem>
GET    /api/v1/admin/products/{id}                   → AdminProductDetail
POST   /api/v1/admin/products/{id}/activate          → { id, status }
POST   /api/v1/admin/products/{id}/deactivate        → { id, status }

GET    /api/v1/admin/payments                        → PagedResponse<AdminPaymentItem>
GET    /api/v1/admin/refunds                         → PagedResponse<AdminRefundItem>
GET    /api/v1/admin/settlements                     → PagedResponse<Settlement>
GET    /api/v1/admin/payouts                         → PagedResponse<AdminPayoutItem>

GET    /api/v1/admin/monitoring/errors               → PagedResponse<PersistedErrorEvent>
GET    /api/v1/admin/monitoring/errors/stats         → ErrorStats

POST   /api/v1/admin/maintenance/expire-pending-orders   → { expiredCount }
POST   /api/v1/admin/maintenance/cleanup-refresh-tokens  → { deletedCount }

POST   /api/v1/admin/imports/products                → ProductImportReport
```

**Produktimport (multipart).** `POST /api/v1/admin/imports/products` erwartet
`multipart/form-data` mit `file` (CSV) und `sellerId`. Antwort ist ein zeilengenauer Report:

```ts
type ProductImportReport = {
  totalRows: number
  totalProducts: number
  created: number
  updated: number
  skipped: number
  failed: number
  rows: Array<{
    line: number // Zeilennummer wie im Tabellenprogramm (Kopfzeile = 1)
    productRef: string
    sku: string | null
    status: "CREATED" | "UPDATED" | "SKIPPED_DUPLICATE" | "ERROR"
    message: string | null
  }>
}
```

Wichtig für die UI: Der Import liefert **HTTP 200 auch dann, wenn einzelne Zeilen scheitern** —
eine abgewiesene Zeile kippt den Lauf nicht. `failed > 0` muss also aus dem Body gelesen und
angezeigt werden, nicht aus dem Statuscode. Importierte Produkte bleiben in `DRAFT`; Bilder und
der Übergang nach `REVIEW` laufen weiter über das Verkäufer-Portal. Format und Regeln:
Backend-Doku `docs/backend/product-csv-import.md`.

Monitoring-Ingestion (`POST /api/v1/monitoring/errors`, public) ist backend-seitig
offen — Spec: [`monitoring-api.md`](./monitoring-api.md).

---

## Fehlerbehandlung

```typescript
import { ApiError } from "@/src/lib/api-client"

try {
  await SomeService.doSomething()
} catch (e) {
  if (e instanceof ApiError) {
    // Feld-Fehler bei 400:
    const fields = e.body?.data?.fields
  }
}
```

Projektspezifisch ist nur zweierlei: Feld-Fehler einer 400 stehen in
`e.body.data.fields`, und eine 429 liefert `Retry-After`. Die übrigen Status-Codes
haben ihre gewohnte HTTP-Bedeutung.

Regeln: Fehler nie still schlucken, dem Nutzer nie rohe Error-Objekte oder
Stack-Traces zeigen (`sonner`-Toast mit lesbarer Meldung).

### Checkout- & Payment-Fehler (Kommunikationsprinzip §1.9)

Für den Checkout-/Payment-Pfad gilt zusätzlich das Kommunikationsprinzip aus
`MANAGEMENT_DECISIONS.md` §1.9:

- **Nur** kommunizieren, wenn dem Kunden ein Nachteil über unsere Versprechen
  hinaus entsteht. Interne/transiente Fehler **ohne** Kundennachteil werden still
  behandelt/retryt — z. B. ein Status-Check-Fehler **nach** erfolgreicher
  Stripe-Bestätigung wird als Erfolg behandelt (das Webhook finalisiert), nicht
  als Fehler gesurfacet.
- Wird kommuniziert, dann mit **Instanz** (Kunde / Elysion / Seller /
  Zahlungsdienstleister) **+ konkreter Konsequenz** (was ist passiert, was ist zu
  tun). Die Meldungen liegen zentral in
  `src/components/features/checkout/checkout-error-messages.ts` (bis die
  Backend-Fehler-Attribution aus backend#147 verfügbar ist, mappt das Frontend die
  bekannten Fälle).

---

## Auth-Flow: Seller-Registrierung

```
Registrierung als SELLER
        ↓
User.role = "BUYER" (!) — noch nicht SELLER
User.sellerProfile.status = "PENDING"
        ↓
Admin genehmigt → POST /api/v1/admin/sellers/{id}/approve
        ↓
User.role = "SELLER"
User.sellerProfile.status = "APPROVED"
```

Ein User mit `role: "BUYER"` **und** `sellerProfile.status: "PENDING"` ist ein
wartender Seller — die UI muss diesen Zustand kennen.

---

## Plattformgebühr & Auszahlungen (Stripe Connect)

> **Status:** Frontend ist gegen diese Verträge implementiert, die Backend-Endpoints
> sind offen — bis dahin scheitern die Aufrufe mit 404/501, die UI fängt das ab.
> Geschäftsregeln: [`MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md) §1.1/§1.2.

Provision: Default 15 %, pro Seller vom Admin anpassbar, auf den Warenwert pro
OrderGroup exkl. Versand. Die Stripe-Transaktionsgebühr trägt der **Seller** und wird
pro Transaktion separat ausgewiesen (§1.1).

```http
GET   /api/v1/admin/sellers/{id}            → { …, commissionRate: number }
PATCH /api/v1/admin/sellers/{id}/commission
      Body: { "commissionRate": number }    → AdminSellerDetail   # 0–100, max. 2 Nachkommastellen
```

### Seller-Auszahlungskonto

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

Nach Abschluss des Connect-Onboardings meldet ein Stripe-Webhook (`account.updated`)
das Konto serverseitig als `ACTIVE`. **Backend-seitig umgesetzt** (BE #110).

Was das für die UI bedeutet:

- **Den Link nicht cachen.** Stripe Account Links sind kurzlebig und einmal verwendbar. Bei
  jedem Klick auf „Konto verbinden" neu anfordern — auch wenn schon ein Konto existiert.
- **Rücksprung landet auf `/seller-dashboard?tab=settlements&onboarding=return`** (bzw.
  `…&onboarding=refresh`, wenn der Seller abbricht). Der Auszahlungen-Tab sollte den
  Kontostatus beim Betreten neu laden — direkt nach dem Rücksprung kann noch `PENDING`
  stehen, weil der Webhook Sekunden später eintrifft.
- **`ACTIVE` kommt nie synchron.** `POST …/onboarding-link` liefert nur die URL; den Status
  setzt ausschließlich der Webhook. Ein Polling nach dem Rücksprung ist der zuverlässige Weg.
- **`RESTRICTED` ist kein Fehlerzustand der UI, sondern eine Aufgabe für den Seller** —
  `requirementsDue` nennt die offenen Stripe-Anforderungen und sollte angezeigt werden. Das
  Feld fehlt in der Antwort, wenn nichts offen ist.
- `NOT_CONNECTED` ist der Normalzustand vor dem Onboarding, kein Fehler.

### Admin-Auszahlungs-Freigabe (monatlich, manuell)

```http
GET  /api/v1/admin/payouts/due
     → PayoutDueItem[] mit {
         sellerId, sellerName,
         payoutAccountStatus: "NOT_CONNECTED" | "PENDING" | "ACTIVE" | "RESTRICTED",
         settlementCount, grossAmount, feeAmount, netAmount,
         currency?, oldestEligibleAt?
       }

POST /api/v1/admin/payouts/run
     Body: { "sellerId": string }   → AdminPayoutItem
```

Setzt `payoutAccountStatus === "ACTIVE"` voraus. Settlement-Auslöser bleibt
`DELIVERED`. Bei Freigabe geht eine gebrandete Payout-Mail an den Seller.
Backend-seitig muss `createPayout()` das bestehende `ConflictException`-Stub ersetzen.
