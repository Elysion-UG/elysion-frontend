# Frontend TODO — Backend Integration Backlog

> **Goal:** Bring the frontend fully in sync with the backend API so all implemented backend modules have working UI.
> **Backend base URL:** `/api/v1`

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

Applies to: `Cart`, `Checkout`, `Orders`, `OrderDetail` (loading states already done in `SustainableShop`, `SellerDashboard`, `ProductDetail`)

### P5-3 · Confirm Cart Price Field Format

Backend `CartItemResponse` sends `priceSnapshot` (unit price, euro decimal) and `lineTotal` (line total, euro decimal).
Frontend `CartItem` type now has both fields. `Cart.tsx` still uses `unitPriceCents`/`unitPrice` fallback chain — update to also check `priceSnapshot` and `lineTotal`.

---

## Open Questions

1. **Cart price display in Cart.tsx:** Wire `priceSnapshot` and `lineTotal` fields to the display logic (currently falls back to `unitPriceCents`/`unitPrice` which are empty for server-side carts).
2. **ProductListItem images:** Does `GET /api/v1/products` list response include `imageUrl` per item? → Check if `ProductDetail` in page content includes images.
3. **Recommendation DTO shape:** Does `RecommendationItemDto.basePrice` match `Recommendation` type in `index.ts`? → Read Java service.
