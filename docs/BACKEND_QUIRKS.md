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

`POST /api/v1/auth/resend-verification` is not yet implemented in the backend. The frontend UI exists but the service call is currently mocked/no-op. Do not wire it to a real call without confirming backend availability.

---

## General

- All other endpoints follow the standard `{ status, message, data }` envelope and can use the generic `apiRequest<T>()` call.
- `204 No Content` responses return `null` from `apiRequest`.
- HTTP errors throw `ApiError(status, message)` — catch with `error instanceof ApiError`.
