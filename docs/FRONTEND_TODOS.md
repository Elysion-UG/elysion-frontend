# Frontend TODO — Backend Integration Backlog

> **Goal:** Bring the frontend fully in sync with the backend API so all implemented backend modules have working UI.
> **Backend base URL:** `/api/v1`
> **Work order:** Phase 1 → 2 → 3 → 4 → 5 (each phase unlocks the next)

---

## Phase 1 — Foundations (Fix Broken Contracts)

> **No new UI — fix what silently breaks at runtime**

### P1-1 · Fix `src/types/index.ts` — Remaining Type Mismatches

| Type                       | Problem                                                                                                                                                             | Fix                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `CheckoutDTO`              | Missing `billingSameAsShipping?: boolean`, `billingAddress?: CheckoutAddressDTO`. Has `note?: string` (no such backend field).                                      | Add missing optional fields. Remove `note?: string`.                                                                                       |
| `CheckoutCompleteResponse` | Shape mismatch: frontend expects `{orderId, orderNumber, status}` but backend returns `{completionId, status, paymentStatus, paymentMethod, completedAt, checkout}` | Replace with: `{ completionId, orderId, orderNumber, status, paymentStatus, paymentMethod, completedAt, checkout: CheckoutStartResponse }` |
| `Recommendation`           | `basePrice: number` — verify against backend `RecommendationItemDto`; confirm field name matches                                                                    | Verify against backend DTO; adjust if needed.                                                                                              |

### P1-2 · Fix `src/services/user.service.ts` — Replace Remaining Stubs

The core methods (`getCurrentUser`, `updateProfile`, `deleteAccount`, `getUsers`, etc.) still use mock data. The real service should call:

- `getCurrentUser()` → `GET /api/v1/users/me`
- `updateProfile()` → `PATCH /api/v1/users/me`
- `deleteAccount()` → `DELETE /api/v1/users/me`
- `getUsers()` / `getUserById()` / `updateUserStatus()` / `updateSellerStatus()` → delegated to `AdminService` (already implemented)

Consider splitting into a clean `UserService` (profile only) and removing the admin-related mock methods that duplicate `AdminService`.

### P1-3 · Fix `src/services/checkout.service.ts` — Update Type References

After P1-1 updates to `CheckoutCompleteResponse`:

- Update import and return type of `complete()`

---

## Phase 2 — Wire Existing Services to UI

> Services exist — need pages and context wiring

### P2-1 · Wrap App with `CartProvider`

**File:** `src/App.tsx`

- Verify `<CartProvider>` is inside `<AuthProvider>` (needs auth state to react to login/logout)

### P2-2 · Add Cart Icon to `src/components/PageLayout.tsx`

- Read `itemCount` from `useCart()`
- Cart icon button in header with item count badge
- Navigate to `/cart` on click

### P2-3 · Register `/cart` in `src/App.tsx`

```ts
case "/cart":
  return <PageLayout><Cart /></PageLayout>
```

### P2-4 · Fix `src/components/ProductDetail.tsx` — Replace Mock Data

1. Read slug from URL: `useSearchParams().get("slug")`
2. `ProductService.getBySlug(slug)` on mount
3. Render real fields: name, description, images, variants, seller, category, price
4. Variant selector sets `selectedVariantId`
5. "In den Warenkorb" → `CartContext.addItem({ variantId, quantity })`
6. Load certificates: `CertificateService.getProductCertificates(productId)` → display badges
7. Loading skeleton while fetching

### P2-5 · Create `src/components/Checkout.tsx`

3-step checkout:

**Step 1 — Adresse:** Load `AddressService.getAll()`, radio select or inline new address form

**Step 2 — Vorschau:** `CheckoutService.preview({ shippingAddressId, paymentMethod: "MOCK" })` → show items, totals. "Bestellung aufgeben" → `CheckoutService.complete(dto)`

**Step 3 — Erfolg:** Show `orderNumber`, link to `/orders`, clear cart

### P2-6 · Register `/checkout` in `src/App.tsx`

```ts
case "/checkout":
  return <PageLayout><AuthGuard><Checkout /></AuthGuard></PageLayout>
```

### P2-7 · Register `/orders` and `/orders/:id` in `src/App.tsx`

```ts
case "/orders":
  return <PageLayout><AuthGuard><Orders /></AuthGuard></PageLayout>

// before default:
if (currentPage.startsWith("/orders/"))
  return <PageLayout><AuthGuard><OrderDetail /></AuthGuard></PageLayout>
```

### P2-8 · Add Nav Links to `src/components/PageLayout.tsx`

Add to authenticated user dropdown:

- "Meine Bestellungen" → `/orders`
- Verify "Präferenzen" → `/praeferenzen` is present

---

## Phase 3 — Missing Services

> Export new services and wire widgets

### P3-1 · Add `RecommendationsWidget` to `src/components/SustainableShop.tsx`

- Import and render above main product grid (auth-gated, buyers only)

---

## Phase 4 — Real Shop + Seller Dashboard Overhaul

> Replace all mock data

### P4-1 · Replace Mock Products in `src/components/SustainableShop.tsx`

1. State: `products: ProductListItem[]`, `isLoading`, `totalPages`, `currentPage`
2. `ProductService.list(params)` on mount + on filter/sort/page change
3. Filter panel: load from `CategoryService.tree()` → dynamic category tree (remove hardcoded keys)
4. Wire sort dropdown → `params.sort`
5. Wire search input → `params.search` (debounced 300ms)
6. Pagination controls at bottom

> ⚠️ `ProductListItem` has no `imageUrl`. Confirm with backend if list endpoint returns images, or use placeholder.

### P4-2 · Overhaul `src/components/SellerDashboard.tsx` — Products Tab

Replace hardcoded array:

1. `ProductService.list({ sellerId: currentUser.id })` on mount
2. Table: name, status badge (all 5: `DRAFT/REVIEW/ACTIVE/INACTIVE/REJECTED`), price, actions
3. "Neues Produkt" → open `ProductForm` dialog (create mode)
4. "Bearbeiten" → open `ProductForm` dialog (edit mode, pre-filled)
5. Status transition buttons per state machine:
   - `DRAFT` → "Zur Prüfung" → `updateStatus("REVIEW")`
   - `ACTIVE` → "Deaktivieren" → `updateStatus("INACTIVE")`
   - `INACTIVE` → "Aktivieren" → `updateStatus("ACTIVE")`

### P4-3 · Add Orders Tab to `src/components/SellerDashboard.tsx`

New tab "Bestellungen":

1. `SellerOrderService.list()` on tab mount
2. Table: order number, buyer city, status, item count, subtotal, date
3. Action buttons:
   - `CONFIRMED` → "In Bearbeitung" → `updateStatus("PROCESSING")`
   - `PROCESSING` → "Versandt" → ship modal (trackingNumber + carrier) → `SellerOrderService.ship()`
   - `SHIPPED` → "Geliefert" → `SellerOrderService.deliver()`

### P4-4 · Add Settlements Tab to `src/components/SellerDashboard.tsx`

New tab "Auszahlungen":

1. `SellerOrderService.listSettlements()` on tab mount
2. Table: period, gross, platform fee, net, status badge, paid date
3. All amounts via `centsToEuro()` from `src/lib/currency.ts`

---

## Phase 5 — Polish & Hardening

### P5-1 · Global 401 Retry in `src/lib/api-client.ts`

- On 401: call `AuthService.refresh()` → retry original request once
- If refresh fails: logout + redirect home + `toast.error("Sitzung abgelaufen")`

### P5-2 · Toast Notifications for All Mutations

Use `sonner` toast for:

- Add to cart → "Zum Warenkorb hinzugefügt"
- Remove from cart → "Artikel entfernt"
- Checkout complete → "Bestellung aufgegeben!"
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

- Integer cents → use `centsToEuro()` from `src/lib/currency.ts`
- Euro decimals → rename types to `unitPrice`/`totalPrice` and remove "Cents" suffix

Same for `Settlement` amount fields.

---

## Files Still to Modify

| File                                 | Phase      | Change                                   |
| ------------------------------------ | ---------- | ---------------------------------------- |
| `src/types/index.ts`                 | P1-1       | Fix remaining type mismatches            |
| `src/services/user.service.ts`       | P1-2       | Replace mock methods with real API calls |
| `src/services/checkout.service.ts`   | P1-3       | Update type references after P1-1        |
| `src/App.tsx`                        | P2-1/3/6/7 | CartProvider, 3 new routes               |
| `src/components/PageLayout.tsx`      | P2-2/8     | Cart icon, nav links                     |
| `src/components/ProductDetail.tsx`   | P2-4       | Replace mock with real API               |
| `src/components/SustainableShop.tsx` | P3-1/P4-1  | Recommendations widget, real products    |
| `src/components/SellerDashboard.tsx` | P4-2/3/4   | Replace mock, add 2 tabs                 |
| `src/components/Praeferenzen.tsx`    | P5-4       | Verify BuyerValueProfile calls           |

---

## Open Questions (Verify Before Implementing)

1. **Cart price format:** Are `CartItem.unitPriceCents/totalPriceCents` integer cents or euro decimals? → Read Java `CartItemResponse` DTO.
2. **ProductListItem images:** Does `GET /api/v1/products` list response include `imageUrl`? → Check `ProductQueryService` in backend.
3. **Recommendation DTO shape:** Does `RecommendationItemDto.basePrice` match `Recommendation` type in `index.ts`? → Read Java service.
4. **OrderSummaryResponse fields:** What does `GET /api/v1/orders` actually return per item? → Read Java `OrderSummaryResponse`.
5. **Guest checkout scope:** Should `/checkout` support unauthenticated users in this phase, or auth-only for now?
