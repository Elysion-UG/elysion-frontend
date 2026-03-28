# Elysion — Sustainable Online Shop (Frontend)

Next.js 16 frontend for **Elysion**, a marketplace for sustainably certified textile products. Buyers discover and purchase certified products matched to their personal value profile. Sellers manage their catalogue and orders. Admins oversee the platform.

**Backend:** Spring Boot REST API → `https://marketplace-backend-1-1w30.onrender.com`
**Backend repo:** `../marketplace-backend/`

---

## Tech Stack

| Layer      | Technology               | Version |
| ---------- | ------------------------ | ------- |
| Framework  | Next.js (App Router)     | ^16.2.1 |
| UI Library | React                    | ^18.2.0 |
| Language   | TypeScript               | ^5      |
| Styling    | Tailwind CSS             | ^3.4    |
| Components | shadcn/ui + Radix UI     | latest  |
| Icons      | lucide-react             | ^0.454  |
| Toasts     | sonner                   | ^2      |
| Testing    | Vitest + Testing Library | ^4      |
| Linting    | ESLint 9 + Prettier 3    | —       |
| Git Hooks  | Husky + lint-staged      | —       |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL

# 3. Start dev server
npm run dev
# → http://localhost:3000
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080                               # local backend
# NEXT_PUBLIC_API_URL=https://marketplace-backend-1-1w30.onrender.com  # production
```

---

## Scripts

| Command                 | Description                  |
| ----------------------- | ---------------------------- |
| `npm run dev`           | Dev server (localhost:3000)  |
| `npm run build`         | Production build             |
| `npm run lint`          | ESLint                       |
| `npm run format:check`  | Prettier check               |
| `npm run typecheck`     | TypeScript type check        |
| `npm run test`          | Unit tests (Vitest)          |
| `npm run test:coverage` | Unit tests + coverage report |

---

## Project Structure

```
src/
  app/                    — Next.js App Router
    (admin)/              — Admin routes (/admin/*)
    (auth)/               — Auth routes (/login/*, /verify-email, /reset-password)
    (buyer)/              — Buyer routes (/cart, /checkout, /orders, /profil, ...)
    (public)/             — Public routes (/, /product, /about, /contact, /producer)
    (seller)/             — Seller routes (/seller-dashboard)
    dev/                  — Development playground (/dev/*)
    layout.tsx            — Root layout (fonts, metadata, Providers)
    providers.tsx         — Client providers (AuthProvider, CartProvider, Toaster)
  components/
    features/             — Feature components grouped by domain
      admin/              — AdminUsers, AdminSellers, AdminProducts, AdminOrders, ...
      auth/               — LoginModal, AdminLogin, SellerLogin, EmailVerification, ...
      cart/               — Cart
      checkout/           — Checkout (3-step: address → preview → confirm)
      orders/             — Orders, OrderDetail
      products/           — SustainableShop, ProductDetail, ProductForm, RecommendationsWidget
      profile/            — Profil, AddressForm, Praeferenzen
      seller/             — SellerDashboard
    layout/               — PageLayout (sticky header, nav, cart badge)
    shared/               — About, Contact, ProducerPage
    ui/                   — shadcn/ui base components (Button, Dialog, Card, ...)
  context/
    AuthContext.tsx        — Auth state (user, token, role, isAuthenticated)
    CartContext.tsx        — Cart state with optimistic updates + backend sync
  hooks/                  — Custom React hooks (useAuth, useCart, ...)
  lib/
    api-client.ts          — Central HTTP client (fetch, token handling, error handling)
    currency.ts            — Euro formatting utilities
    validation.ts          — Input validation helpers
    utils.ts               — shadcn cn() utility
  services/               — Backend API service layer (one file per domain)
  types/
    index.ts               — All TypeScript types and DTOs
docs/                     — Project documentation
public/                   — Static assets (icon.svg, placeholder.svg)
```

---

## Architecture

### API Client

All backend requests go through `src/lib/api-client.ts`:

- Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8080`)
- Access token held **in memory** — not localStorage, XSS-safe
- `credentials: 'include'` always set for the HttpOnly refresh-token cookie
- Automatic 401 → refresh → retry cycle
- Response envelope `{ status, message, data }` — returns `data` directly
- Errors throw `ApiError(status, message)`

### Auth Flow

1. Login → `AuthService.login()` → access token stored in memory via `setAccessToken()`
2. All requests → `api-client` attaches `Authorization: Bearer <token>`
3. Token expired (401) → `AuthService.refresh()` → cookie sent automatically → new token issued
4. Logout → `AuthService.logout()` → cookie cleared, token nulled

### Cart

`CartContext` manages cart state with **optimistic updates**: the UI updates immediately on user action, then syncs with the backend. If the backend returns a valid response, the server state replaces the optimistic state. On failure, the optimistic state is retained.

### Route Protection

`middleware.ts` checks for the refresh-token cookie on protected routes (`/cart`, `/checkout`, `/orders/*`, `/profil`, `/praeferenzen`, `/seller-dashboard`, `/admin/*`). Unauthenticated users are redirected to `/`.

---

## Implemented Modules

All backend modules are fully integrated:

| Module                                                      | Service                                       | UI Components                                                                         |
| ----------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Auth (Login / Register / Logout / Refresh / Verify / Reset) | `auth.service.ts`                             | LoginModal, AdminLogin, SellerLogin, EmailVerification, ResetPassword, Onboarding     |
| User Profile (GET / PATCH / DELETE)                         | `user.service.ts`                             | Profil                                                                                |
| Addresses (CRUD + Default)                                  | `address.service.ts`                          | AddressForm                                                                           |
| Buyer Value Profile                                         | `buyer-value-profile.service.ts`              | Praeferenzen                                                                          |
| Seller Profile                                              | `seller-profile.service.ts`                   | SellerDashboard                                                                       |
| Seller Value Profile                                        | `seller-value-profile.service.ts`             | SellerDashboard                                                                       |
| Admin (User + Seller management)                            | `admin.service.ts`                            | AdminUsers, AdminSellers, AdminProducts, AdminOrders, AdminCertificates, AdminFinance |
| Products (CRUD + Status + Images + Variants)                | `product.service.ts`                          | SustainableShop, ProductDetail, ProductForm                                           |
| Categories                                                  | `category.service.ts`                         | ProductForm                                                                           |
| Certificates                                                | `certificate.service.ts`                      | SellerDashboard                                                                       |
| Cart                                                        | `cart.service.ts`                             | Cart                                                                                  |
| Checkout                                                    | `checkout.service.ts`                         | Checkout                                                                              |
| Orders (Buyer + Seller)                                     | `order.service.ts`, `seller-order.service.ts` | Orders, OrderDetail, SellerDashboard                                                  |
| Matching / Recommendations                                  | `recommendation.service.ts`                   | RecommendationsWidget                                                                 |
| File Upload                                                 | `file.service.ts`                             | ProductForm, SellerDashboard                                                          |
| Payments (Mock)                                             | `payment.service.ts`                          | Checkout                                                                              |

---

## Testing

```bash
npm run test             # run all tests
npm run test:coverage    # with coverage report
```

- **Framework:** Vitest + @testing-library/react
- **Coverage:** ~97% (266 tests)
- **Test files:** `*.test.ts` / `*.test.tsx` co-located with source files
- Services, contexts, hooks, and lib utilities are covered

---

## Known Open Items

| Item                                                          | Status                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------- |
| `POST /api/v1/auth/resend-verification`                       | Backend endpoint not yet implemented — UI built, call is mocked |
| Skeleton loading states (Cart, Orders, OrderDetail, Checkout) | Planned — P5-2                                                  |
| Toast coverage in SellerDashboard (ship / status update)      | Planned — P5-1                                                  |
| Stripe payment integration                                    | Planned — `PaymentService` ready, Checkout uses MOCK            |
| Guest checkout                                                | Planned — Phase 2                                               |
| Wishlist / favorites                                          | Planned — Phase 2                                               |
| Returns / refund UI                                           | Planned — Phase 2                                               |

---

## Documentation

| File                      | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| `docs/api-integration.md` | Complete API integration reference (all endpoints, DTOs, error handling) |
| `docs/BACKEND_QUIRKS.md`  | Known API response discrepancies (field names, missing wrappers)         |
| `docs/CODE_STANDARDS.md`  | Naming conventions, architecture patterns, code review checklist         |
| `docs/CICD_PIPELINE.md`   | GitHub Actions workflows, quality gates, pre-commit hooks                |
| `docs/ROADMAP.md`         | Development roadmap — Phase 1 status, Phase 2 plans                      |
| `docs/INDEX.md`           | Topic → SSOT reference map for contributors                              |
| `docs/archive/`           | Superseded and planning-phase documents                                  |
