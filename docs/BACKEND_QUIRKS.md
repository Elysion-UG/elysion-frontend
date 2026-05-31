# Backend API Quirks

Known discrepancies between what the frontend types suggest and what the backend actually returns. These must be handled explicitly — do not assume generic response shapes apply everywhere.

---

## Product List — custom pagination response

**Endpoint:** `GET /api/v1/products`

The backend returns a **wrapped** `ApiResponse` with a custom pagination shape — **not** a Spring `Page<>` object and not the generic `PagedResponse<T>`.

```typescript
// WRONG — Spring Page shape doesn't apply here
const data = await apiRequest<{ content: Product[]; totalElements: number }>("/api/v1/products")

// CORRECT — use ProductPage (normalized by ProductService.list())
const data = await ProductService.list(params)
```

Raw backend response shape (before normalization):

```typescript
{
  items: ProductListItem[]   // not "content"
  totalItems: number         // not "totalElements"
  page: number               // not "number"
  totalPages: number
  size: number
}
```

`ProductService.list()` normalizes this internally to `ProductPage`. Each item contains `primaryImage: string | null` (mapped to `imageUrls: [primaryImage]`) and `seller.id` (mapped to `seller.userId`). There is no `basePrice` — only `price`.

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

## Auth — resend verification (implemented)

`POST /api/v1/auth/resend-verification` is implemented on the backend and wired in the frontend
(`AuthService.resendVerification()` → `auth.service.ts:103`, used by `EmailVerification.tsx`).
This is a real call now — the earlier mock/no-op note is obsolete.

---

## Stripe — fully integrated front-to-back

Both sides are integrated as of 2026-05. The backend has a real Stripe integration
(`StripeHttpApiClient`, idempotent webhook processing, settlement tracking). The frontend uses
Stripe Elements via `@stripe/react-stripe-js` in `src/components/features/checkout/PaymentStep.tsx`:

- Payment Intent creation (`PaymentService.createIntent`)
- Client-side confirmation with `<PaymentElement>`
- Post-payment status polling (`PaymentService.getStatus`)
- Webhook-based finalization handled by the backend

**Only remaining gap:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must be set in the environment.
Without it, `stripePromise` is `null` and the payment step is disabled. See `LAUNCH_READINESS.md` (B1).

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
