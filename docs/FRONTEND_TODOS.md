# Frontend TODO — Backend Integration Backlog

> **Goal:** Bring the frontend fully in sync with the backend API so all implemented backend modules have working UI.
> **Backend base URL:** `/api/v1`

---

## Phase 4 — Seller Dashboard Overhaul

> Replace mock data in SellerDashboard

### P4-1 · Overhaul `src/components/SellerDashboard.tsx` — Products Tab

Replace hardcoded array:

1. `ProductService.list({ sellerId: currentUser.id })` on mount
2. Table: name, status badge (all 5: `DRAFT/REVIEW/ACTIVE/INACTIVE/REJECTED`), price, actions
3. "Neues Produkt" → open `ProductForm` dialog (create mode)
4. "Bearbeiten" → open `ProductForm` dialog (edit mode, pre-filled)
5. Status transition buttons per state machine:
   - `DRAFT` → "Zur Prüfung" → `updateStatus("REVIEW")`
   - `ACTIVE` → "Deaktivieren" → `updateStatus("INACTIVE")`
   - `INACTIVE` → "Aktivieren" → `updateStatus("ACTIVE")`

### P4-2 · Add Orders Tab to `src/components/SellerDashboard.tsx`

New tab "Bestellungen":

1. `SellerOrderService.list()` on tab mount
2. Table: order number, buyer city, status, item count, subtotal, date
3. Action buttons:
   - `CONFIRMED` → "In Bearbeitung" → `updateStatus("PROCESSING")`
   - `PROCESSING` → "Versandt" → ship modal (trackingNumber + carrier) → `SellerOrderService.ship()`
   - `SHIPPED` → "Geliefert" → `SellerOrderService.deliver()`

### P4-3 · Add Settlements Tab to `src/components/SellerDashboard.tsx`

New tab "Auszahlungen":

1. `SellerOrderService.listSettlements()` on tab mount
2. Table: period, gross, platform fee, net, status badge, paid date
3. All amounts via `centsToEuro()` from `src/lib/currency.ts`

---

## Phase 5 — Polish & Hardening

### P5-1 · Toast Notifications for All Mutations

Use `sonner` toast for:

- Add to cart → "Zum Warenkorb hinzugefügt" ✅ (ProductDetail)
- Remove from cart → "Artikel entfernt"
- Checkout complete → "Bestellung aufgegeben!"
- Seller status update → "Status aktualisiert"
- Ship → "Als versandt markiert"
- All errors → `toast.error(message)`

### P5-2 · Loading States for All Components

Every component calling an API must have:

- `Skeleton` placeholder while loading (shadcn/ui)
- Buttons disabled while mutation in progress (`isLoading` state)
- Error state with retry option

Applies to: `Cart`, `Checkout`, `Orders`, `OrderDetail`, `SustainableShop`, `SellerDashboard` (all tabs)

### P5-3 · Confirm Cart Price Field Format

Before finalizing cart UI: read Java `CartItemResponse` DTO in backend to confirm if `unitPriceCents`/`totalPriceCents` are:

- Integer cents → use `centsToEuro()` from `src/lib/currency.ts`
- Euro decimals → rename types to `unitPrice`/`totalPrice` and remove "Cents" suffix

Same for `Settlement` amount fields.

---

## Open Questions

1. **Cart price format:** Are `CartItem.unitPriceCents/totalPriceCents` integer cents or euro decimals? → Read Java `CartItemResponse` DTO.
2. **ProductListItem images:** Does `GET /api/v1/products` list response include `imageUrl`? → Check `ProductQueryService` in backend.
3. **Recommendation DTO shape:** Does `RecommendationItemDto.basePrice` match `Recommendation` type in `index.ts`? → Read Java service.
