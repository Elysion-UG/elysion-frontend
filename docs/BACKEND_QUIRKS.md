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

| Endpoint                               | Wrapper                  | `name` field | Notes                         |
| -------------------------------------- | ------------------------ | ------------ | ----------------------------- |
| `GET /api/v1/products/{id}` (internal) | No `ApiResponse` wrapper | `title`      | Used for seller/admin views   |
| `GET /api/v1/products/{slug}` (public) | Standard `ApiResponse`   | `name`       | Used for public product pages |

```typescript
// Internal — no wrapper, field is "title"
const product = await apiRequest<{ title: string; ... }>(`/api/v1/products/${id}`)

// Public — standard wrapper, field is "name"
const product = await apiRequest<Product>(`/api/v1/products/${slug}`)
// apiRequest unwraps { status, message, data } automatically → returns Product
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

## General

- All other endpoints follow the standard `{ status, message, data }` envelope and can use the generic `apiRequest<T>()` call.
- `204 No Content` responses return `null` from `apiRequest`.
- HTTP errors throw `ApiError(status, message)` — catch with `error instanceof ApiError`.
