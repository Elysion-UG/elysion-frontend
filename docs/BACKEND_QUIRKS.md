# Backend API Quirks

Known discrepancies between what the frontend types suggest and what the backend actually returns. These must be handled explicitly — do not assume generic response shapes apply everywhere.

---

## Product List — Spring Page response

**Endpoint:** `GET /api/v1/products`

The backend returns a raw Spring `Page<>` object, **not** the generic `ApiResponse` wrapper.

```typescript
// WRONG — do not use
const data = await apiRequest<PagedResponse<Product>>("/api/v1/products")

// CORRECT — use ProductPage
const data = await apiRequest<ProductPage>("/api/v1/products")
```

`ProductPage` shape:

```typescript
interface ProductPage {
  content: Product[]
  totalElements: number
  totalPages: number
  size: number
  number: number // current page index (0-based)
}
```

---

## Product Detail — internal vs. public endpoint

Two different endpoints return product details with different field names and response wrappers:

| Endpoint                               | Wrapper                  | name field | Auth required       | Notes                         |
| -------------------------------------- | ------------------------ | ---------- | ------------------- | ----------------------------- |
| `GET /api/v1/products/by-id/{id}`      | No `ApiResponse` wrapper | `title`    | ADMIN, SELLER (own) | Used for seller/admin views   |
| `GET /api/v1/products/{slug}` (public) | Standard `ApiResponse`   | `name`     | No                  | Used for public product pages |

**Breaking change (2026-03-28):** The internal endpoint path changed from `/api/v1/products/{id}` to `/api/v1/products/by-id/{id}` to eliminate an ambiguous handler conflict with `/{slug}`. UUID-based public navigation is no longer supported — always use `slug` for storefront links.

```typescript
// Internal — no wrapper, field is "title" — authenticated only
const product = await apiRequest<ProductInternalDetail>(`/api/v1/products/by-id/${id}`)

// Public — standard wrapper, field is "name"
const product = await apiRequest<Product>(`/api/v1/products/${slug}`)
// apiRequest unwraps { status, message, data } automatically → returns Product
```

**Navigation rule:** Always use `slug` for product page links. `ProductListItemDto` now includes `slug`.

```typescript
// CORRECT — use Next.js router.push, always prefer slug
router.push(`/product?slug=${product.slug}`)
// WRONG — UUID no longer routable on public endpoint; also avoid window.location.href
window.location.href = `/product?id=${product.id}`
```

---

## Auth — resend verification endpoint not yet implemented

`POST /api/v1/auth/resend-verification` is not yet implemented in the backend (verified as of 2026-03-28). The frontend UI exists but the service call is currently mocked/no-op. Do not wire it to a real call without confirming backend availability.

---

## Stripe — backend is production-ready, frontend still uses mock

The backend has a real Stripe integration (`StripeHttpApiClient`) as of the payment hardening release (2026-03-23). The frontend `PaymentService` still uses a mock flow.

**Do not activate the real Stripe path** without implementing the full frontend flow:

- Stripe Payment Intent creation
- Client-side confirmation (Stripe.js / Elements)
- Webhook-based status updates (backend already handles these)

Until then, keep `PaymentService` as-is and leave the mock in Checkout.

---

## Order expiry — orders can be auto-cancelled

A scheduled job (`PendingOrderExpiryJob`) runs every 5 minutes on the backend and cancels unpaid `PENDING` orders, releasing stock reservations. This means an order the frontend created can transition to `CANCELLED` without any user action.

Frontend implications:

- The Orders list/detail UI already handles `CANCELLED` — verify the state is rendered correctly for this case
- No new `OrderGroupStatus` value was added; expiry maps to the existing `CANCELLED` status
- `PaymentStatus` values: `PENDING | SUCCEEDED | FAILED | REFUNDED | PARTIALLY_REFUNDED` — no new values

---

## Admin — new maintenance endpoints

Two new endpoints are available under `/api/v1/admin/maintenance` (ADMIN role required):

| Endpoint                                                | Description                               |
| ------------------------------------------------------- | ----------------------------------------- |
| `POST /api/v1/admin/maintenance/pending-orders/expire`  | Manually trigger pending order expiry job |
| `POST /api/v1/admin/maintenance/refresh-tokens/cleanup` | Clean up expired refresh tokens           |

Not yet surfaced in the Admin UI.

---

## Email service — fully automated, no frontend action needed

Backend now sends transactional emails automatically (as of Module 10, 2026-03-22):

- Order confirmation (on order creation)
- Payment success
- Refund confirmation

No frontend involvement needed. The `resend-verification` email remains unimplemented (see above).

---

## Product List — sort parameter values

The `sort` query param uses **enum-style values**, not Spring's `field,direction` format.

| Frontend intent  | Correct `sort` value |
| ---------------- | -------------------- |
| Newest first     | `newest`             |
| Price ascending  | `price_asc`          |
| Price descending | `price_desc`         |
| Match score      | `match_score`        |

Sending `createdAt,desc` or `price,asc` returns `400 Unsupported sort`.

---

## Checkout — response shape mismatches

**Endpoint:** `POST /api/v1/checkout`

The `CheckoutStartResponse` does **not** contain `productName`, `shippingCost`, or `total`. Field names differ from earlier frontend assumptions:

| Frontend assumed      | Actual backend field | Notes                                       |
| --------------------- | -------------------- | ------------------------------------------- |
| `items[].productName` | ❌ absent            | Resolve from cart context by `productId`    |
| `items[].totalPrice`  | `items[].lineTotal`  | Euro decimal (e.g. `29.99`)                 |
| `shippingCost`        | ❌ absent            | No separate shipping cost; show "Kostenlos" |
| `total`               | ❌ absent            | Use `subtotal` as the grand total           |

`subtotal` is returned as a euro decimal (BigDecimal, e.g. `29.99`), **not cents**.
`lineTotal` per item is likewise a euro decimal.

---

## General

- All other endpoints follow the standard `{ status, message, data }` envelope and can use the generic `apiRequest<T>()` call.
- `204 No Content` responses return `null` from `apiRequest`.
- HTTP errors throw `ApiError(status, message)` — catch with `error instanceof ApiError`.
