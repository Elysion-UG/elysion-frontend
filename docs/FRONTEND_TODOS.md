# Frontend TODO — Backend Integration Backlog

> **Goal:** Bring the frontend fully in sync with the backend API so all implemented backend modules have working UI.
> **Backend base URL:** `/api/v1`
> **Work order:** Phase 1 → 2 → 3 → 4 → 5 (each phase unlocks the next)

---

## Phase 1 — Foundations (Fix Broken Contracts)
> **~3–4h | No new UI — fix what silently breaks at runtime**

### P1-1 · Fix `src/types/index.ts` — Type Mismatches

| Type | Problem | Fix |
|------|---------|-----|
| `CheckoutDTO` | Missing required `paymentMethod: string` — backend rejects every checkout request | Add `paymentMethod: string`, `billingSameAsShipping?: boolean`, `billingAddress?: CheckoutAddressDTO`. Remove `note?: string` (no such backend field). |
| `CheckoutPreview` | Fields `subtotalCents/shippingCents/totalCents` don't match backend which returns euro decimals `subtotal/shippingCost/total` | Rename fields, add `readyToProceed: boolean`, `cartId: string`, `ownershipType: string`, `totalQuantity: number`. Rename type to `CheckoutStartResponse`. |
| `CheckoutPreviewItem` | `unitPriceCents/totalPriceCents` — confirm cents vs euros with backend DTO | Likely rename to `unitPrice: number`, `totalPrice: number`. Add `variantOptions?: CartItemOption[]`. |
| `CheckoutCompleteResponse` | Shape mismatch: frontend expects `{totalAmountCents, paymentIntentClientSecret}` but backend returns `{completionId, status, paymentStatus, paymentMethod, completedAt, checkout}` | Replace with: `{ completionId, orderId, orderNumber, status, paymentStatus, paymentMethod, completedAt, checkout: CheckoutStartResponse }` |
| `Order` | `totalAmountCents: number` — backend returns `total: number` (euros). `orderGroups` field may differ | Change to `total: number`, add `subtotal: number`, `shippingCost: number`. Remove `orderGroups` — list endpoint doesn't include groups. |
| `OrderDetail` | Has `items: OrderItemSnapshot[]` at root — backend nests items inside `groups[].items` | Remove root `items`. Add `groups: OrderGroupDetail[]`, `subtotal`, `shippingCost`, `tax`, `total`, `billingAddress?`. |
| `OrdersPage` | Typed as Spring `Page<>` but `GET /api/v1/orders` returns `Order[]` (plain array) | Change `OrderService.list()` return type to `Order[]`. Delete or repurpose `OrdersPage`. |
| `Recommendation` | `basePriceCents: number` — backend likely uses euros | Verify against backend `RecommendationItemDto`; likely rename to `basePrice: number`. |

### P1-2 · Fix `src/services/user.service.ts` — Remove Dead Stubs

- Delete `getValuesProfile()` (returns `{ type: "none" }` — stub)
- Delete `saveValuesProfile()` (returns input unchanged — stub)
- Real replacement: `BuyerValueProfileService` already calls `/api/v1/users/me/profile` correctly

### P1-3 · Fix `src/services/index.ts` — Add Missing Exports

These services exist but are not exported:
```ts
export { CartService } from "./cart.service"
export { CheckoutService } from "./checkout.service"
export { OrderService } from "./order.service"
export { PaymentService } from "./payment.service"
export { SellerOrderService } from "./seller-order.service"
```

### P1-4 · Fix `src/lib/api-client.ts` — Support Multipart File Uploads

- Current `apiRequest()` always sets `Content-Type: application/json` — breaks multipart uploads
- Add `apiUpload<T>(path: string, formData: FormData): Promise<T>` that omits Content-Type header (browser sets correct boundary automatically)

### P1-5 · Fix `src/services/checkout.service.ts` — Update Type References

After P1-1 renames `CheckoutPreview` → `CheckoutStartResponse`:
- Update import and return type of `preview()`

---

## Phase 2 — Wire Existing Services to UI
> **~12–16h | Services exist — need pages and context**

### P2-1 · Create `src/context/CartContext.tsx`

Global cart state (needed by header, product pages, cart page, checkout).

**Exposes:** `cart`, `itemCount`, `addItem(dto)`, `updateItem(id, dto)`, `removeItem(id)`, `refetch()`, `isLoading`

**Behavior:**
- On mount: call `CartService.get()` (works for both auth + guest via cookie)
- After each mutation: refetch cart
- Re-fetch when auth state changes (login/logout merge)

### P2-2 · Wrap App with `CartProvider`

**File:** `src/App.tsx`
- Add `<CartProvider>` inside `<AuthProvider>` (needs auth state to react to login/logout)

### P2-3 · Add Cart Icon to `src/components/PageLayout.tsx`

- Read `itemCount` from `useCart()`
- Cart icon button in header with item count badge
- Navigate to `/cart` on click

### P2-4 · Create `src/components/Cart.tsx`

- Loading skeleton / empty state / item list
- Item rows: image, name, variant options, qty selector, unit price, remove button
- Calls `CartContext.updateItem()` and `CartContext.removeItem()`
- Order summary sidebar with subtotal + "Zur Kasse" → `/checkout`
- No `AuthGuard` — guest cart supported

### P2-5 · Register `/cart` in `src/App.tsx`

```ts
case "/cart":
  return <PageLayout><Cart /></PageLayout>
```

### P2-6 · Fix `src/components/ProductDetail.tsx` — Replace Mock Data

1. Read slug from URL: `useSearchParams().get("slug")`
2. `ProductService.getBySlug(slug)` on mount
3. Render real fields: name, description, images, variants, seller, category, price
4. Variant selector sets `selectedVariantId`
5. "In den Warenkorb" → `CartContext.addItem({ variantId, quantity })`
6. Load certificates: `CertificateService.getProductCertificates(productId)` → display badges
7. Loading skeleton while fetching

### P2-7 · Create `src/components/Checkout.tsx`

3-step checkout:

**Step 1 — Adresse:** Load `AddressService.getAll()`, radio select or inline new address form

**Step 2 — Vorschau:** `CheckoutService.preview({ shippingAddressId, paymentMethod: "MOCK" })` → show items, totals. "Bestellung aufgeben" → `CheckoutService.complete(dto)`

**Step 3 — Erfolg:** Show `orderNumber`, link to `/orders`, clear cart

### P2-8 · Register `/checkout` in `src/App.tsx`

```ts
case "/checkout":
  return <PageLayout><AuthGuard><Checkout /></AuthGuard></PageLayout>
```

### P2-9 · Create `src/components/Orders.tsx`

- `OrderService.list()` → `Order[]` (plain array after P1-1)
- Table: order number, date, status badge, payment status, total, "Details" link
- Empty state

### P2-10 · Create `src/components/OrderDetail.tsx`

- Read ID from pathname: `pathname.split("/orders/")[1]`
- `OrderService.getById(id)` → render groups → items hierarchy
- Address block, shipping tracking, total breakdown

### P2-11 · Register `/orders` and `/orders/:id` in `src/App.tsx`

```ts
case "/orders":
  return <PageLayout><AuthGuard><Orders /></AuthGuard></PageLayout>

// before default:
if (currentPage.startsWith("/orders/"))
  return <PageLayout><AuthGuard><OrderDetail /></AuthGuard></PageLayout>
```

### P2-12 · Add Nav Links to `src/components/PageLayout.tsx`

Add to authenticated user dropdown:
- "Meine Bestellungen" → `/orders`
- Verify "Präferenzen" → `/praeferenzen` is present

---

## Phase 3 — Missing Services
> **~6–8h | Create FileService + RecommendationService**

### P3-1 · Create `src/services/file.service.ts`

```ts
export const FileService = {
  upload(file, category, relatedEntityType?, relatedEntityId?): Promise<FileUploadResponse>
  // POST /api/v1/files/upload  (multipart — needs P1-4)

  getMetadata(fileId): Promise<FileMetadata>
  // GET /api/v1/files/{fileId}

  getContentUrl(fileId): string
  // Returns "/api/v1/files/{fileId}/content" — use as <img src>

  delete(fileId): Promise<void>
  // DELETE /api/v1/files/{fileId}

  link(fileId, target, targetId): Promise<void>
  // POST /api/v1/files/{fileId}/link  body: { target, targetId }

  unlink(fileId, target, targetId): Promise<void>
  // POST /api/v1/files/{fileId}/unlink

  uploadAndLink(file, category, target, targetId): Promise<FileUploadResponse>
  // Convenience: upload() then link()
}
```

### P3-2 · Create `src/services/recommendation.service.ts`

```ts
export const RecommendationService = {
  getRecommendations(limit = 6): Promise<Recommendation[]>
  // GET /api/v1/recommendations?limit={limit}
}
```

> ⚠️ Before implementing: verify actual backend `RecommendationItemDto` field names match `Recommendation` type in `index.ts`. Especially `basePriceCents` vs `basePrice`.

### P3-3 · Export new services from `src/services/index.ts`

```ts
export { FileService } from "./file.service"
export { RecommendationService } from "./recommendation.service"
```

### P3-4 · Create `src/components/RecommendationsWidget.tsx`

- Only render for authenticated buyers with a value profile
- `RecommendationService.getRecommendations(6)` on mount
- Silently hide if empty or error
- Card grid: image, name, price, match score badge (e.g. "94% Match")
- Card click → `/product?slug={slug}`
- Loading skeleton

### P3-5 · Add `RecommendationsWidget` to `src/components/SustainableShop.tsx`

- Import and render above main product grid (auth-gated)

---

## Phase 4 — Real Shop + Seller Dashboard Overhaul
> **~16–24h | Replace all mock data**

### P4-1 · Replace Mock Products in `src/components/SustainableShop.tsx`

1. State: `products: ProductListItem[]`, `isLoading`, `totalPages`, `currentPage`
2. `ProductService.list(params)` on mount + on filter/sort/page change
3. Filter panel: load from `CategoryService.tree()` → dynamic category tree (remove hardcoded keys)
4. Wire sort dropdown → `params.sort`
5. Wire search input → `params.search` (debounced 300ms)
6. Pagination controls at bottom

> ⚠️ `ProductListItem` has no `imageUrl`. Confirm with backend if list endpoint returns images, or use placeholder.

### P4-2 · Create `src/lib/currency.ts` — Price Utilities

```ts
export function formatEuro(amount: number): string   // 29.99 → "€ 29,99"
export function centsToEuro(cents: number): number   // 2999 → 29.99
export function euroToCents(euro: number): number    // 29.99 → 2999
export function bpsToPercent(bps: number): number    // 1900 → 19
export function percentToBps(pct: number): number    // 19 → 1900
```

Use everywhere prices are displayed — no inline `/ 100` in components.

### P4-3 · Create `src/components/ProductForm.tsx`

Reusable create/edit form (used inside SellerDashboard dialog):

**Fields:** name, description, shortDesc, categoryId (select), basePrice (EUR), currency, taxRate (% input → bps on submit)

**Variants section:** add/remove rows — sku, stock, price (optional), option pairs (type + value)

**Images section:** file picker → `FileService.uploadAndLink(file, "PRODUCT_IMAGE", "PRODUCT", productId)` → show preview grid → drag-reorder → delete

**Submit:**
- Create: `ProductService.create(dto)`
- Edit: `ProductService.update(id, dto)`

### P4-4 · Overhaul `src/components/SellerDashboard.tsx` — Products Tab

Replace hardcoded array:

1. `ProductService.list({ sellerId: currentUser.id })` on mount
2. Table: name, status badge (all 5: `DRAFT/REVIEW/ACTIVE/INACTIVE/REJECTED`), price, actions
3. "Neues Produkt" → open `ProductForm` dialog (create mode)
4. "Bearbeiten" → open `ProductForm` dialog (edit mode, pre-filled)
5. Status transition buttons per state machine:
   - `DRAFT` → "Zur Prüfung" → `updateStatus("REVIEW")`
   - `ACTIVE` → "Deaktivieren" → `updateStatus("INACTIVE")`
   - `INACTIVE` → "Aktivieren" → `updateStatus("ACTIVE")`
   - (No delete — use INACTIVE)

### P4-5 · Add Orders Tab to `src/components/SellerDashboard.tsx`

New tab "Bestellungen":

1. `SellerOrderService.list()` on tab mount
2. Table: order number, buyer city, status, item count, subtotal, date
3. Action buttons:
   - `CONFIRMED` → "In Bearbeitung" → `updateStatus("PROCESSING")`
   - `PROCESSING` → "Versandt" → ship modal (trackingNumber + carrier) → `SellerOrderService.ship()`
   - `SHIPPED` → "Geliefert" → `SellerOrderService.deliver()`

### P4-6 · Add Settlements Tab to `src/components/SellerDashboard.tsx`

New tab "Auszahlungen":

1. `SellerOrderService.listSettlements()` on tab mount
2. Table: period, gross, platform fee, net, status badge, paid date
3. All amounts via `centsToEuro()` from P4-2

---

## Phase 5 — Polish & Hardening
> **~6–8h | Error handling, auth flow, UX completeness**

### P5-1 · Global 401 Retry in `src/lib/api-client.ts`

- On 401: call `AuthService.refresh()` → retry original request once
- If refresh fails: logout + redirect home + `toast.error("Sitzung abgelaufen")`

### P5-2 · Toast Notifications for All Mutations

Use `sonner` toast for:
- Add to cart → "Zum Warenkorb hinzugefügt"
- Remove from cart → "Artikel entfernt"
- Checkout complete → "Bestellung aufgegeben! 🎉"
- Seller status update → "Status aktualisiert"
- Ship → "Als versandt markiert"
- All errors → `toast.error(message)`

### P5-3 · Loading States for All New Components

Every component calling an API must have:
- `Skeleton` placeholder while loading (shadcn/ui)
- Buttons disabled while mutation in progress (`isLoading` state)
- Error state with retry option

Applies to: `Cart`, `Checkout`, `Orders`, `OrderDetail`, `ProductDetail`, `SustainableShop`, `SellerDashboard` (all tabs), `RecommendationsWidget`

### P5-4 · Verify `Praeferenzen.tsx` End-to-End

- Confirm it uses `BuyerValueProfileService`, not dead `UserService` stubs
- Test: 404 from backend (no profile yet) → show default/empty form, not error screen
- Search for any remaining stale calls:
  ```bash
  grep -r "getValuesProfile\|saveValuesProfile" src/
  ```

### P5-5 · Confirm Cart Price Field Format

Before building cart UI: read Java `CartItemResponse` DTO in backend to confirm if `unitPriceCents`/`totalPriceCents` are:
- Integer cents → use `centsToEuro()` from P4-2
- Euro decimals → rename types to `unitPrice`/`totalPrice` and remove "Cents" suffix

Same for `Settlement` amount fields.

---

## New Files to Create

| File | Phase |
|------|-------|
| `src/context/CartContext.tsx` | P2-1 |
| `src/components/Cart.tsx` | P2-4 |
| `src/components/Checkout.tsx` | P2-7 |
| `src/components/Orders.tsx` | P2-9 |
| `src/components/OrderDetail.tsx` | P2-10 |
| `src/services/file.service.ts` | P3-1 |
| `src/services/recommendation.service.ts` | P3-2 |
| `src/components/RecommendationsWidget.tsx` | P3-4 |
| `src/components/ProductForm.tsx` | P4-3 |
| `src/lib/currency.ts` | P4-2 |

## Files to Modify

| File | Phase | Change |
|------|-------|--------|
| `src/types/index.ts` | P1-1 | Fix 8 type mismatches |
| `src/services/user.service.ts` | P1-2 | Remove 2 dead stubs |
| `src/services/index.ts` | P1-3 + P3-3 | Add 7 missing exports |
| `src/lib/api-client.ts` | P1-4 + P5-1 | `apiUpload()`, global 401 retry |
| `src/services/checkout.service.ts` | P1-5 | Update type references |
| `src/App.tsx` | P2-2 + P2-5 + P2-8 + P2-11 | CartProvider, 4 new routes |
| `src/components/PageLayout.tsx` | P2-3 + P2-12 | Cart icon, nav links |
| `src/components/ProductDetail.tsx` | P2-6 | Replace mock with real API |
| `src/components/SustainableShop.tsx` | P3-5 + P4-1 | Recommendations widget, real products |
| `src/components/SellerDashboard.tsx` | P4-4 + P4-5 + P4-6 | Replace mock, add 2 tabs |
| `src/components/Praeferenzen.tsx` | P5-4 | Verify BuyerValueProfile calls |

---

## Open Questions (Verify Before Implementing)

1. **Cart price format:** Are `CartItem.unitPriceCents/totalPriceCents` integer cents or euro decimals? → Read Java `CartItemResponse` DTO.
2. **ProductListItem images:** Does `GET /api/v1/products` list response include `imageUrl`? → Check `ProductQueryService` in backend.
3. **Recommendation DTO shape:** Does `RecommendationItemDto.basePriceCents` match `Recommendation` type in `index.ts`? → Read Java service.
4. **OrderSummaryResponse fields:** What does `GET /api/v1/orders` actually return per item? → Read Java `OrderSummaryResponse`.
5. **Guest checkout scope:** Should `/checkout` support unauthenticated users in this phase, or auth-only for now?
