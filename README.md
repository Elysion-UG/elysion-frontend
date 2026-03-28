# Sustainable Online Shop — Frontend

Next.js 15 frontend for a marketplace for sustainably certified textile products.

**Backend:** Spring Boot REST API → `https://marketplace-backend-1-1w30.onrender.com`

## Tech Stack

- **Next.js 15** (App Router) · **React 18** · **TypeScript 5**
- **Tailwind CSS** · **shadcn/ui** · **Radix UI**
- **Vitest** for unit tests · **Playwright** for E2E (planned)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL

# 3. Start dev server
npm run dev
```

## Scripts

| Command                 | Description                       |
| ----------------------- | --------------------------------- |
| `npm run dev`           | Start dev server (localhost:3000) |
| `npm run build`         | Production build                  |
| `npm run lint`          | ESLint                            |
| `npm run format:check`  | Prettier check                    |
| `npm run typecheck`     | TypeScript type check             |
| `npm run test`          | Unit tests                        |
| `npm run test:coverage` | Unit tests + coverage report      |

## Project Structure

```
src/
  app/          — Next.js App Router pages
  components/   — UI components (feature-based)
  context/      — React Context (AuthContext, CartContext)
  hooks/        — Custom React hooks
  lib/          — API client, utilities (currency, validation)
  services/     — Backend API service layer
  types/        — TypeScript types & DTOs
docs/
  api-integration.md    — API integration reference
  backend-gap-analysis.md — Backend gap tracking
```

## Documentation

- **API integration:** `docs/api-integration.md`
- **Architecture & conventions:** `CLAUDE.md`
- **Backend repo:** `../marketplace-backend/`
