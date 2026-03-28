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

---

## Open Questions

1. **ProductListItem images:** Does `GET /api/v1/products` list response include image data per item? → Verify with live backend whether `ProductDetail.images` is populated in the page content.
2. **Recommendation DTO shape:** Does `RecommendationItemDto.basePrice` match `Recommendation` type in `index.ts`? → Read Java service.
