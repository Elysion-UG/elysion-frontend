# Technische Architektur

## Nachhaltigkeits-Zertifikat-Plattform

**Version:** 1.0  
**Datum:** 05.02.2026  
**Basierend auf:** Produktvision v1.0, Funktionale Anforderungen v1.0

---

## Inhaltsverzeichnis

1. [System-Überblick](#1-system-überblick)
2. [Technologie-Stack](#2-technologie-stack)
3. [Architektur-Muster](#3-architektur-muster)
4. [Frontend-Architektur](#4-frontend-architektur)
5. [Backend-Architektur](#5-backend-architektur)
6. [Datenbank-Design](#6-datenbank-design)
7. [API-Design](#7-api-design)
8. [Authentifizierung & Autorisierung](#8-authentifizierung--autorisierung)
9. [Datei-Verwaltung](#9-datei-verwaltung)
10. [Integration Drittanbieter](#10-integration-drittanbieter)
11. [Deployment & Infrastructure](#11-deployment--infrastructure)
12. [Monitoring & Logging](#12-monitoring--logging)

---

## 1. System-Überblick

### 1.1 High-Level Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Admin Panel │  │  Mobile Web  │      │
│  │  (React.js)  │  │  (React.js)  │  │  (Responsive)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / REST API
┌───────────────────────────┴─────────────────────────────────┐
│                    APPLICATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           API Gateway / Load Balancer                 │   │
│  │              (NGINX / AWS ALB)                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Backend API (Node.js / Express)               │ │
│  │                                                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │  Auth    │ │ Products │ │ Orders   │ │ Payments │ │ │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│  │                                                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │ │
│  │  │ Matching │ │  Certs   │ │  Users   │              │ │
│  │  │ Service  │ │ Service  │ │ Service  │              │ │
│  │  └──────────┘ └──────────┘ └──────────┘              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │  S3 Storage  │      │
│  │  (Primary DB)│  │   (Cache)    │  │  (Files)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Stripe    │  │  SendGrid    │  │ Elasticsearch│      │
│  │  (Payments)  │  │   (Email)    │  │   (Search)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Systemkomponenten

| Komponente          | Zweck                         | Technologie           |
| ------------------- | ----------------------------- | --------------------- |
| **Web Frontend**    | Käufer- & Verkäufer-Interface | React.js, Next.js     |
| **Admin Dashboard** | Plattform-Verwaltung          | React.js, Material-UI |
| **API Gateway**     | Load Balancing, Rate Limiting | NGINX / AWS ALB       |
| **Backend API**     | Business Logic                | Node.js, Express.js   |
| **Datenbank**       | Persistente Daten             | PostgreSQL 14+        |
| **Cache**           | Session, Match-Scores         | Redis 7+              |
| **File Storage**    | Bilder, PDFs                  | AWS S3 / MinIO        |
| **Search Engine**   | Produktsuche                  | Elasticsearch 8+      |
| **Payment Gateway** | Zahlungsabwicklung            | Stripe                |
| **Email Service**   | Transaktions-E-Mails          | SendGrid / AWS SES    |

---

## 2. Technologie-Stack

### 2.1 Frontend

#### 2.1.1 Kern-Technologien

**Framework: React.js 18+ mit Next.js 14+**

- **Begründung:**
  - Server-Side Rendering (SSR) für SEO
  - File-based Routing
  - Image Optimization
  - API Routes für BFF-Pattern
  - Große Community & Ecosystem

**Styling: Tailwind CSS 3+**

- **Begründung:**
  - Utility-First → schnelle Entwicklung
  - Geringe Bundle-Size (PurgeCSS)
  - Responsive Design einfach
  - Konsistentes Design-System

**State Management: Zustand oder React Context**

- **Begründung:**
  - Zustand: Leichtgewichtig, weniger Boilerplate als Redux
  - React Context: Für einfache globale States (User, Theme)

**Form Handling: React Hook Form**

- **Begründung:**
  - Performance (uncontrolled components)
  - Einfache Validierung (mit Yup/Zod)
  - Geringe Bundle-Size

**UI Components: Headless UI + Custom**

- **Begründung:**
  - Headless UI: Unstyled, accessible Components
  - Custom: Volle Kontrolle über Design
  - Alternativ: shadcn/ui (Tailwind-basiert)

#### 2.1.2 Weitere Libraries

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "axios": "^1.6.0",
    "swr": "^2.2.4",
    "@stripe/stripe-js": "^2.2.0",
    "@headlessui/react": "^1.7.0",
    "react-dropzone": "^14.2.0",
    "date-fns": "^2.30.0",
    "react-hot-toast": "^2.4.1",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tailwindcss": "^3.3.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### 2.2 Backend

#### 2.2.1 Kern-Technologien

**Runtime: Node.js 20 LTS**

- **Begründung:**
  - Gleiche Sprache wie Frontend (TypeScript)
  - Non-blocking I/O (gut für API-Server)
  - Große Package-Ecosystem (npm)
  - Performance für I/O-intensive Tasks

**Framework: Express.js 4+**

- **Begründung:**
  - Minimalistisch, flexibel
  - Große Community
  - Middleware-Architektur
  - Bewährt für REST APIs
  - **Alternative:** Fastify (schneller, aber weniger Middleware)

**Sprache: TypeScript 5+**

- **Begründung:**
  - Type Safety → weniger Runtime-Fehler
  - Bessere IDE-Unterstützung
  - Refactoring einfacher
  - Dokumentation durch Types

**ORM: Prisma 5+**

- **Begründung:**
  - Type-Safe Database Client
  - Migrationen integriert
  - Gute Developer Experience
  - Auto-Completion für Queries
  - **Alternative:** TypeORM (mehr Features, komplexer)

**Validierung: Zod**

- **Begründung:**
  - TypeScript-first
  - Schema-Validierung für API-Input
  - Inferenz von Types aus Schemas

#### 2.2.2 Package-Übersicht

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.0",
    "multer": "^1.4.5-lts.1",
    "stripe": "^14.9.0",
    "nodemailer": "^6.9.7",
    "redis": "^4.6.11",
    "zod": "^3.22.4",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11"
  }
}
```

### 2.3 Datenbank

**PostgreSQL 14+**

- **Begründung:**
  - Relational (passt zu Datenmodell: Bestellungen, Produkte, Zertifikate)
  - ACID-Compliant (wichtig für Transaktionen)
  - JSON-Support (flexible Felder wie Werteprofil)
  - Performance (Indexing, Partitioning)
  - Open Source

**Redis 7+** (Caching)

- **Begründung:**
  - In-Memory → extrem schnell
  - Key-Value Store für Session-Daten
  - Cache für Match-Scores (häufige Berechnung)
  - Pub/Sub für Echtzeit-Features (Phase 3)

### 2.4 File Storage

**AWS S3 / Google Cloud Storage**

- **Begründung:**
  - Unbegrenzte Skalierung
  - CDN-Integration
  - Versionierung
  - Zugriffskontrolle (IAM)
  - **Dev-Alternative:** MinIO (lokales S3-kompatibles Storage)

### 2.5 Search Engine

**Elasticsearch 8+ oder Algolia**

- **Begründung:**
  - Volltextsuche mit Fuzzy-Matching
  - Faceted Search (Filter)
  - Schnelle Response-Zeiten
  - **Elasticsearch:** Self-Hosted, flexibel
  - **Algolia:** Managed Service, einfacher Setup (teurer)

**Empfehlung für MVP:** Algolia (schneller Start)  
**Später:** Migration zu Elasticsearch (Kosteneinsparung bei Skalierung)

### 2.6 Drittanbieter-Services

| Service        | Zweck                | Alternative       |
| -------------- | -------------------- | ----------------- |
| **Stripe**     | Zahlungsabwicklung   | PayPal, Adyen     |
| **SendGrid**   | Transaktions-E-Mails | AWS SES, Postmark |
| **Sentry**     | Error Tracking       | Rollbar, Bugsnag  |
| **Cloudflare** | CDN, DDoS-Schutz     | AWS CloudFront    |

---

## 3. Architektur-Muster

### 3.1 Monolithic Architecture (Phase 1)

**Entscheidung:** Initial als Monolith  
**Begründung:**

- Schnellere Entwicklung (keine Service-Grenzen)
- Einfacheres Deployment
- Weniger Overhead (keine Inter-Service-Kommunikation)
- Ausreichend für 100 Verkäufer, 10.000 Produkte

**Struktur:**

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validators.ts
│   │   ├── products/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── certificates/
│   │   ├── users/
│   │   └── matching/
│   ├── shared/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── types/
│   ├── prisma/
│   │   └── schema.prisma
│   └── app.ts
└── tests/
```

### 3.2 Migration zu Microservices (Phase 3, optional)

**Bei Skalierung:** Aufteilung in Services

- **User Service:** Authentifizierung, Nutzer-Verwaltung
- **Product Service:** Produkte, Kategorien
- **Order Service:** Bestellungen, Warenkorb
- **Payment Service:** Zahlungen, Auszahlungen
- **Matching Service:** Algorithmus (rechenintensiv)
- **Certificate Service:** Zertifikats-Verwaltung

**Kommunikation:** REST APIs oder Message Queue (RabbitMQ/Kafka)

### 3.3 Design Patterns

#### 3.3.1 Backend-Patterns

**1. Repository Pattern**

- Abstrahierung der Datenbank-Zugriffe
- Testbarkeit (Mock Repositories)

```typescript
// product.repository.ts
export class ProductRepository {
  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } })
  }

  async findAll(filters: ProductFilters): Promise<Product[]> {
    return prisma.product.findMany({
      where: this.buildWhereClause(filters),
      include: { certificates: true },
    })
  }
}
```

**2. Service Layer Pattern**

- Business Logic in Services
- Controllers sind dünn (nur Request/Response-Handling)

```typescript
// product.service.ts
export class ProductService {
  constructor(
    private productRepo: ProductRepository,
    private matchingService: MatchingService
  ) {}

  async getRecommendedProducts(userId: string): Promise<Product[]> {
    const userProfile = await this.getUserProfile(userId)
    const products = await this.productRepo.findAll({ active: true })

    return products
      .map((p) => ({
        ...p,
        matchScore: this.matchingService.calculate(userProfile, p),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 12)
  }
}
```

**3. Middleware Pattern**

- Authentifizierung, Validierung, Logging als Middleware

```typescript
// auth.middleware.ts
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ error: "Unauthorized" })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: "Invalid token" })
  }
}
```

#### 3.3.2 Frontend-Patterns

**1. Component Composition**

- Kleine, wiederverwendbare Components
- Container/Presentational Trennung

**2. Custom Hooks**

- Wiederverwendbare Logic

```typescript
// useProducts.ts
export const useProducts = (filters: ProductFilters) => {
  const { data, error, isLoading } = useSWR(["/api/products", filters], ([url, filters]) =>
    fetchProducts(url, filters)
  )

  return { products: data, error, isLoading }
}
```

**3. Render Props / HOCs** (sparsam)

- Für komplexe Zugriffskontrolle (ProtectedRoute)

---

## 4. Frontend-Architektur

### 4.1 Projektstruktur

```
frontend/
├── public/
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (shop)/
│   │   │   ├── products/
│   │   │   │   └── [id]/
│   │   │   ├── cart/
│   │   │   └── checkout/
│   │   ├── (seller)/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   └── orders/
│   │   ├── api/                # API Routes (BFF)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # Basis-Components (Button, Input, ...)
│   │   ├── layout/             # Header, Footer, Sidebar
│   │   ├── products/           # ProductCard, ProductGrid, ...
│   │   ├── cart/
│   │   └── forms/
│   ├── hooks/                  # Custom Hooks
│   ├── lib/                    # Utilities, API Client
│   ├── store/                  # Zustand Stores
│   ├── types/                  # TypeScript Types
│   └── styles/
│       └── globals.css
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

### 4.2 Routing-Strategie

**Next.js App Router** (Next.js 13+)

- File-based Routing
- Server Components (default)
- Client Components (opt-in mit `"use client"`)

**Route-Gruppen:**

```
app/
├── (auth)/              # Gruppe für Auth-Pages (ohne Layout)
│   ├── login/
│   └── register/
├── (shop)/              # Käufer-Bereich (Shop-Layout)
│   ├── layout.tsx
│   ├── page.tsx         # Startseite
│   ├── products/
│   └── checkout/
├── (seller)/            # Verkäufer-Bereich (Dashboard-Layout)
│   ├── layout.tsx
│   ├── dashboard/
│   └── products/
└── (admin)/             # Admin-Bereich
    └── ...
```

### 4.3 State Management

#### 4.3.1 Server State (SWR)

**Für Daten vom Backend:**

```typescript
import useSWR from "swr"

const { data: products, error, isLoading } = useSWR("/api/products", fetcher)
```

**Vorteile:**

- Automatisches Caching
- Revalidation (Background-Updates)
- Deduplication (gleiche Requests werden zusammengefasst)
- Pagination/Infinite Loading Support

#### 4.3.2 Client State (Zustand)

**Für UI-State & globale App-States:**

```typescript
// store/cartStore.ts
import create from "zustand"

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
  clearCart: () => set({ items: [] }),
}))
```

**Verwendung:**

```typescript
const { items, addItem } = useCartStore()
```

#### 4.3.3 Form State (React Hook Form)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data) => { /* ... */ };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      {/* ... */}
    </form>
  );
};
```

### 4.4 API-Kommunikation

**Axios Client mit Interceptors:**

```typescript
// lib/api.ts
import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
})

// Request Interceptor (JWT Token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response Interceptor (Error Handling)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token abgelaufen → Refresh
      const newToken = await refreshToken()
      error.config.headers.Authorization = `Bearer ${newToken}`
      return api(error.config)
    }
    return Promise.reject(error)
  }
)

export default api
```

**Typed API Functions:**

```typescript
// lib/api/products.ts
export const productApi = {
  getAll: (filters?: ProductFilters) => api.get<Product[]>("/products", { params: filters }),

  getById: (id: string) => api.get<Product>(`/products/${id}`),

  create: (data: CreateProductDto) => api.post<Product>("/products", data),
}
```

---

## 5. Backend-Architektur

### 5.1 Projektstruktur

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.middleware.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   └── user.routes.ts
│   │   ├── products/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── certificates/
│   │   └── matching/
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── rateLimiter.middleware.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── email.ts
│   │   │   └── fileUpload.ts
│   │   ├── types/
│   │   └── constants/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── stripe.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
└── tsconfig.json
```

### 5.2 Module-Struktur (Beispiel: Products)

```
products/
├── products.controller.ts       # HTTP Request Handling
├── products.service.ts          # Business Logic
├── products.repository.ts       # Database Access
├── products.routes.ts           # Route Definitions
├── dto/
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   └── product-filters.dto.ts
└── validators/
    └── product.validators.ts
```

**Controller (HTTP Layer):**

```typescript
// products.controller.ts
export class ProductsController {
  constructor(private productService: ProductsService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query as ProductFiltersDto
      const products = await this.productService.findAll(filters)
      res.json(products)
    } catch (error) {
      next(error)
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as CreateProductDto
      const product = await this.productService.create(dto, req.user.id)
      res.status(201).json(product)
    } catch (error) {
      next(error)
    }
  }
}
```

**Service (Business Logic):**

```typescript
// products.service.ts
export class ProductsService {
  constructor(
    private productRepo: ProductRepository,
    private certService: CertificatesService,
    private cacheService: CacheService
  ) {}

  async findAll(filters: ProductFiltersDto): Promise<Product[]> {
    const cacheKey = `products:${JSON.stringify(filters)}`

    // Check Cache
    const cached = await this.cacheService.get(cacheKey)
    if (cached) return cached

    // Fetch from DB
    const products = await this.productRepo.findAll(filters)

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, products, 300)

    return products
  }

  async create(dto: CreateProductDto, sellerId: string): Promise<Product> {
    // Validate certificate
    const cert = await this.certService.findById(dto.certificateId)
    if (!cert || cert.status !== "VERIFIED") {
      throw new BadRequestError("Certificate must be verified")
    }

    // Create product
    const product = await this.productRepo.create({
      ...dto,
      sellerId,
      status: cert ? "ACTIVE" : "DRAFT",
    })

    // Invalidate cache
    await this.cacheService.invalidatePattern("products:*")

    return product
  }
}
```

**Repository (Data Access):**

```typescript
// products.repository.ts
export class ProductRepository {
  async findAll(filters: ProductFiltersDto): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      ...(filters.category && { categoryId: filters.category }),
      ...(filters.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
      ...(filters.sellerId && { sellerId: filters.sellerId }),
    }

    return prisma.product.findMany({
      where,
      include: {
        certificates: true,
        images: true,
        seller: { select: { name: true, shopName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    })
  }

  async create(data: CreateProductData): Promise<Product> {
    return prisma.product.create({ data })
  }
}
```

**Routes:**

```typescript
// products.routes.ts
import { Router } from "express"
import { authenticate, authorize } from "../shared/middleware/auth.middleware"
import { validate } from "../shared/middleware/validation.middleware"
import { createProductSchema } from "./validators/product.validators"

const router = Router()
const controller = new ProductsController(new ProductsService(/*...*/))

router.get("/", controller.getAll.bind(controller))
router.get("/:id", controller.getById.bind(controller))

router.post(
  "/",
  authenticate,
  authorize(["SELLER"]),
  validate(createProductSchema),
  controller.create.bind(controller)
)

router.patch("/:id", authenticate, authorize(["SELLER"]), controller.update.bind(controller))

export default router
```

### 5.3 Error Handling

**Custom Error Classes:**

```typescript
// shared/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message)
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message)
  }
}
```

**Error Middleware:**

```typescript
// shared/middleware/error.middleware.ts
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    })
  }

  // Log unexpected errors
  logger.error("Unexpected error:", err)

  // Don't leak error details in production
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message

  res.status(500).json({
    status: "error",
    message,
  })
}
```

### 5.4 Validation

**Zod Schemas:**

```typescript
// dto/create-product.dto.ts
import { z } from "zod"

export const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(50).max(2000),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
  certificateId: z.string().uuid(),
  shopId: z.string().uuid().optional(),
  sku: z.string().optional(),
  weight: z.number().positive().optional(),
  variants: z
    .array(
      z.object({
        type: z.enum(["SIZE", "COLOR", "CUSTOM"]),
        value: z.string(),
        price: z.number().positive().optional(),
        stock: z.number().int().min(0),
      })
    )
    .optional(),
})

export type CreateProductDto = z.infer<typeof createProductSchema>
```

**Validation Middleware:**

```typescript
// shared/middleware/validation.middleware.ts
import { ZodSchema } from "zod"

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: error.errors,
        })
      }
      next(error)
    }
  }
}
```

---

## 6. Datenbank-Design

### 6.1 ER-Diagramm (Vereinfacht)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │         │   Product   │         │Certificate  │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)     │         │ id (PK)     │
│ email       │         │ name        │    ┌────│ sellerId(FK)│
│ role        │         │ description │    │    │ type        │
│ ...         │         │ price       │    │    │ number      │
└──────┬──────┘         │ sellerId(FK)├────┘    │ status      │
       │                │ categoryId  │         │ ...         │
       │                │ ...         │         └─────────────┘
       │                └──────┬──────┘
       │                       │
       │                ┌──────┴────────┐
       │                │               │
       │         ┌──────▼─────┐  ┌──────▼─────┐
       │         │ProductImage│  │ProductCert │
       │         ├────────────┤  ├────────────┤
       │         │ id (PK)    │  │ productId  │
       │         │ productId  │  │ certId     │
       │         │ url        │  └────────────┘
       │         │ order      │
       │         └────────────┘
       │
       │         ┌─────────────┐
       └─────────►  Order      │
                 ├─────────────┤
                 │ id (PK)     │
                 │ buyerId(FK) │
                 │ number      │
                 │ status      │
                 │ total       │
                 │ ...         │
                 └──────┬──────┘
                        │
                 ┌──────▼──────┐
                 │ OrderItem   │
                 ├─────────────┤
                 │ id (PK)     │
                 │ orderId(FK) │
                 │ productId   │
                 │ quantity    │
                 │ price       │
                 └─────────────┘
```

### 6.2 Prisma Schema (Vollständig)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========== ENUMS ==========

enum UserRole {
  BUYER
  SELLER
  ADMIN
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum CertificateStatus {
  PENDING
  VERIFIED
  REJECTED
  EXPIRED
}

enum ProductStatus {
  DRAFT
  ACTIVE
  DELETED
}

// ========== MODELS ==========

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  role          UserRole  @default(BUYER)
  firstName     String?
  lastName      String?
  phone         String?
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  profile       UserProfile?
  addresses     Address[]
  orders        Order[]       @relation("UserOrders")
  sellerProfile SellerProfile?
  shops         Shop[]

  @@index([email])
}

model UserProfile {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  activeProfileType String   @default("none") // none, simple, extended
  simpleProfile     Json?    // { "category1": 80, "category2": 60, ... }
  extendedProfile   Json?    // { "category1": { "sub1": 90, "sub2": 70 }, ... }

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model SellerProfile {
  id            String   @id @default(uuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  companyName   String
  legalForm     String
  taxId         String   @unique
  iban          String
  logo          String?
  description   String?
  website       String?

  status        String   @default("PENDING") // PENDING, ACTIVE, SUSPENDED
  verifiedAt    DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status])
}

model Address {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  type      String   // SHIPPING, BILLING
  firstName String
  lastName  String
  street    String
  city      String
  zip       String
  country   String   @default("DE")
  phone     String?

  isDefault Boolean  @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model Shop {
  id          String   @id @default(uuid())
  sellerId    String
  seller      User     @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  name        String
  slug        String   @unique
  description String?
  logo        String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  products    Product[]

  @@index([sellerId])
  @@index([slug])
}

model Category {
  id          String     @id @default(uuid())
  name        String
  slug        String     @unique
  description String?
  parentId    String?
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")

  products    Product[]

  @@index([slug])
  @@index([parentId])
}

model Product {
  id              String        @id @default(uuid())
  sellerId        String
  shopId          String
  shop            Shop          @relation(fields: [shopId], references: [id], onDelete: Cascade)
  categoryId      String
  category        Category      @relation(fields: [categoryId], references: [id])

  name            String
  slug            String        @unique
  description     String
  shortDesc       String?
  price           Decimal       @db.Decimal(10, 2)
  taxRate         Decimal       @default(19) @db.Decimal(4, 2)
  sku             String?       @unique
  weight          Decimal?      @db.Decimal(8, 2)

  status          ProductStatus @default(DRAFT)
  availability    String        @default("IN_STOCK") // IN_STOCK, OUT_OF_STOCK, PREORDER

  views           Int           @default(0)
  salesCount      Int           @default(0)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  images          ProductImage[]
  variants        ProductVariant[]
  certificates    ProductCertificate[]
  orderItems      OrderItem[]

  @@index([sellerId])
  @@index([shopId])
  @@index([categoryId])
  @@index([status])
  @@index([slug])
}

model ProductImage {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  url       String
  order     Int      @default(0)
  alt       String?

  createdAt DateTime @default(now())

  @@index([productId])
}

model ProductVariant {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  type      String   // SIZE, COLOR, CUSTOM
  value     String   // "M", "Red", "30cm"
  price     Decimal? @db.Decimal(10, 2) // Override price (optional)
  stock     Int      @default(0)
  sku       String?  @unique

  @@index([productId])
  @@unique([productId, type, value])
}

model Certificate {
  id           String            @id @default(uuid())
  sellerId     String

  type         String            // IVN_BEST, GOTS, etc.
  number       String            @unique
  issueDate    DateTime
  expiryDate   DateTime
  documentUrl  String

  status       CertificateStatus @default(PENDING)
  verifiedAt   DateTime?
  verifiedBy   String?
  rejectedReason String?

  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  products     ProductCertificate[]

  @@index([sellerId])
  @@index([status])
  @@index([expiryDate])
}

model ProductCertificate {
  productId     String
  product       Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  certificateId String
  certificate   Certificate @relation(fields: [certificateId], references: [id], onDelete: Cascade)

  @@id([productId, certificateId])
  @@index([certificateId])
}

model Order {
  id              String      @id @default(uuid())
  number          String      @unique // 2026-000001
  buyerId         String
  buyer           User        @relation("UserOrders", fields: [buyerId], references: [id])

  status          OrderStatus @default(PENDING)

  subtotal        Decimal     @db.Decimal(10, 2)
  shippingCost    Decimal     @db.Decimal(10, 2)
  tax             Decimal     @db.Decimal(10, 2)
  total           Decimal     @db.Decimal(10, 2)

  shippingAddress Json        // { firstName, lastName, street, ... }
  billingAddress  Json?

  paymentMethod   String      // CARD, PAYPAL, SEPA, ...
  paymentIntentId String?     // Stripe Payment Intent ID

  trackingNumber  String?
  trackingUrl     String?
  shippedAt       DateTime?
  deliveredAt     DateTime?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  items           OrderItem[]
  payment         Payment?

  @@index([buyerId])
  @@index([status])
  @@index([number])
  @@index([createdAt])
}

model OrderItem {
  id         String   @id @default(uuid())
  orderId    String
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId  String
  product    Product  @relation(fields: [productId], references: [id])

  variantId  String?  // Reference to ProductVariant (optional)

  name       String   // Snapshot (in case product changes/deleted)
  price      Decimal  @db.Decimal(10, 2)
  taxRate    Decimal  @db.Decimal(4, 2)
  quantity   Int
  subtotal   Decimal  @db.Decimal(10, 2)

  sellerId   String   // For commission calculation

  @@index([orderId])
  @@index([sellerId])
}

model Payment {
  id              String   @id @default(uuid())
  orderId         String   @unique
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  stripePaymentId String   @unique
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("EUR")
  status          String   // PENDING, SUCCEEDED, FAILED, REFUNDED

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status])
}

model Payout {
  id              String   @id @default(uuid())
  sellerId        String

  period          String   // "2026-W05" (Week 5 of 2026)
  totalRevenue    Decimal  @db.Decimal(10, 2)
  commission      Decimal  @db.Decimal(10, 2)
  commissionRate  Decimal  @db.Decimal(4, 2)
  netPayout       Decimal  @db.Decimal(10, 2)

  status          String   @default("PENDING") // PENDING, PROCESSING, PAID
  paidAt          DateTime?

  orderCount      Int

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([sellerId])
  @@index([status])
}

// ========== INDEXES ==========

// Additional composite indexes for performance
// (already defined above via @@index)

```

### 6.3 Migrations

**Erstellen einer Migration:**

```bash
npx prisma migrate dev --name init
```

**Apply Migrations in Production:**

```bash
npx prisma migrate deploy
```

**Reset Database (Dev only):**

```bash
npx prisma migrate reset
```

---

## 7. API-Design

### 7.1 REST API Konventionen

**Base URL:**

```
Development: http://localhost:3000/api/v1
Production:  https://api.yourplatform.com/v1
```

**HTTP Methods:**

- `GET` - Abrufen von Daten
- `POST` - Erstellen neuer Ressourcen
- `PATCH` - Teilweises Update
- `DELETE` - Löschen

**Response Format (JSON):**

```json
// Success
{
  "status": "success",
  "data": { /* ... */ }
}

// Error
{
  "status": "error",
  "message": "Error description",
  "errors": [ /* validation errors */ ]
}

// Paginated
{
  "status": "success",
  "data": [ /* items */ ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### 7.2 API Endpoints (Übersicht)

**Authentifizierung:**

```
POST   /auth/register          - Registrierung
POST   /auth/login             - Login
POST   /auth/refresh           - Token erneuern
POST   /auth/forgot-password   - Passwort vergessen
POST   /auth/reset-password    - Passwort zurücksetzen
POST   /auth/verify-email      - E-Mail verifizieren
```

**Nutzer:**

```
GET    /users/me               - Eigenes Profil
PATCH  /users/me               - Profil bearbeiten
DELETE /users/me               - Account löschen

GET    /users/me/profile       - Werteprofil abrufen
PATCH  /users/me/profile       - Werteprofil bearbeiten

GET    /users/me/addresses     - Adressen auflisten
POST   /users/me/addresses     - Adresse hinzufügen
PATCH  /users/me/addresses/:id - Adresse bearbeiten
DELETE /users/me/addresses/:id - Adresse löschen
```

**Produkte:**

```
GET    /products               - Alle Produkte (mit Filtern)
GET    /products/:id           - Produkt-Details
POST   /products               - Produkt erstellen (Seller)
PATCH  /products/:id           - Produkt bearbeiten (Seller)
DELETE /products/:id           - Produkt löschen (Seller)

GET    /products/:id/recommendations - Ähnliche Produkte
GET    /products/:id/match-score     - Match-Score für User
```

**Kategorien:**

```
GET    /categories             - Alle Kategorien (Baum)
GET    /categories/:id         - Kategorie-Details
```

**Zertifikate:**

```
GET    /certificates           - Alle Zertifikate (Seller: nur eigene)
GET    /certificates/:id       - Zertifikat-Details
POST   /certificates           - Zertifikat hochladen (Seller)
PATCH  /certificates/:id       - Zertifikat bearbeiten (Seller)
DELETE /certificates/:id       - Zertifikat löschen (Seller)

PATCH  /certificates/:id/verify - Verifizieren (Admin)
PATCH  /certificates/:id/reject - Ablehnen (Admin)
```

**Warenkorb:**

```
GET    /cart                   - Warenkorb abrufen
POST   /cart/items             - Artikel hinzufügen
PATCH  /cart/items/:id         - Menge ändern
DELETE /cart/items/:id         - Artikel entfernen
DELETE /cart                   - Warenkorb leeren
```

**Bestellungen:**

```
GET    /orders                 - Alle Bestellungen (User)
GET    /orders/:id             - Bestelldetails
POST   /orders                 - Bestellung erstellen
PATCH  /orders/:id/cancel      - Stornieren (Buyer)

PATCH  /orders/:id/ship        - Als versendet markieren (Seller)
GET    /orders/:id/invoice     - Rechnung herunterladen

// Seller-spezifisch
GET    /seller/orders          - Bestellungen für Verkäufer
GET    /seller/analytics       - Verkaufs-Analytics
```

**Zahlungen:**

```
POST   /payments/intent        - Payment Intent erstellen (Stripe)
POST   /payments/confirm       - Zahlung bestätigen
POST   /payments/webhook       - Stripe Webhook
```

**Auszahlungen:**

```
GET    /seller/payouts         - Auszahlungs-Historie (Seller)
GET    /seller/payouts/:id     - Auszahlungs-Details
```

**Admin:**

```
GET    /admin/users            - Alle Nutzer
PATCH  /admin/users/:id/suspend - Nutzer suspendieren
PATCH  /admin/users/:id/activate - Nutzer aktivieren

GET    /admin/dashboard        - Dashboard-Statistiken
```

### 7.3 Beispiel: Product Endpoints (Detailliert)

**GET /products**

_Query Parameters:_

```
?category=uuid          - Filter nach Kategorie
&minPrice=20           - Min. Preis
&maxPrice=100          - Max. Preis
&seller=uuid           - Filter nach Verkäufer
&search=bio baumwolle  - Volltextsuche
&sort=price_asc        - Sortierung (price_asc, price_desc, newest, match_score)
&page=1                - Pagination
&limit=20              - Items pro Seite
&matchMin=70           - Nur Produkte mit Match-Score >= 70%
```

_Response:_

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "Bio Baumwoll T-Shirt",
      "slug": "bio-baumwoll-t-shirt",
      "shortDesc": "Weiches T-Shirt aus 100% Bio-Baumwolle",
      "price": 29.9,
      "images": [{ "url": "https://cdn.../image1.jpg", "alt": "Vorderansicht" }],
      "matchScore": 87.5,
      "seller": {
        "id": "uuid",
        "name": "EcoFashion GmbH",
        "shopName": "EcoKids"
      },
      "certificates": [{ "type": "IVN_BEST", "logo": "https://..." }]
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**POST /products** (Seller only)

_Request Body:_

```json
{
  "name": "Bio Baumwoll T-Shirt",
  "description": "Sehr langer Beschreibungstext...",
  "shortDesc": "Kurzbeschreibung",
  "price": 29.9,
  "taxRate": 19,
  "categoryId": "uuid",
  "certificateId": "uuid",
  "shopId": "uuid",
  "sku": "ECO-TS-001",
  "weight": 0.2,
  "variants": [
    { "type": "SIZE", "value": "S", "stock": 10 },
    { "type": "SIZE", "value": "M", "stock": 15 },
    { "type": "COLOR", "value": "Weiß", "stock": 20 }
  ]
}
```

_Response:_

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "Bio Baumwoll T-Shirt",
    "status": "ACTIVE", // or DRAFT if certificate not verified
    "createdAt": "2026-02-05T10:30:00Z"
    // ... all fields
  }
}
```

---

## 8. Authentifizierung & Autorisierung

### 8.1 JWT-basierte Authentifizierung

**Tokens:**

- **Access Token:** Kurze Lebensdauer (1 Stunde), für API-Zugriff
- **Refresh Token:** Lange Lebensdauer (30 Tage), zum Erneuern des Access Tokens

**Token-Struktur:**

```json
// Access Token Payload
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "BUYER",
  "type": "access",
  "iat": 1706789000,
  "exp": 1706792600
}

// Refresh Token Payload
{
  "userId": "uuid",
  "type": "refresh",
  "iat": 1706789000,
  "exp": 1709467400
}
```

**Login-Flow:**

```
1. POST /auth/login { email, password }
2. Server validates credentials
3. Server generates Access + Refresh Token
4. Response: { accessToken, refreshToken, user }
5. Client stores tokens (localStorage / httpOnly cookie)
6. Client includes Access Token in Authorization header
```

**Token-Refresh-Flow:**

```
1. Access Token expires
2. Client sends POST /auth/refresh { refreshToken }
3. Server validates Refresh Token
4. Server generates new Access Token
5. Response: { accessToken }
```

**Implementation:**

```typescript
// auth.service.ts
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new UnauthorizedError("Invalid credentials")

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new UnauthorizedError("Invalid credentials")

    const accessToken = this.generateAccessToken(user)
    const refreshToken = this.generateRefreshToken(user)

    return { accessToken, refreshToken, user }
  }

  generateAccessToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: "access",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    )
  }

  generateRefreshToken(user: User): string {
    return jwt.sign({ userId: user.id, type: "refresh" }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: "30d",
    })
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any
      if (decoded.type !== "refresh") throw new Error()

      const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
      if (!user) throw new Error()

      const accessToken = this.generateAccessToken(user)
      return { accessToken }
    } catch {
      throw new UnauthorizedError("Invalid refresh token")
    }
  }
}
```

### 8.2 Authorization Middleware

```typescript
// auth.middleware.ts
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ error: "No token provided" })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (decoded.type !== "access") throw new Error()

    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: "Invalid token" })
  }
}

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" })

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    next()
  }
}

// Usage:
router.post("/products", authenticate, authorize(["SELLER", "ADMIN"]), createProduct)
```

### 8.3 Passwort-Hashing

```typescript
import bcrypt from "bcrypt"

const SALT_ROUNDS = 10

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}
```

---

## 9. Datei-Verwaltung

### 9.1 File Upload (Backend)

**Multer für Multipart/Form-Data:**

```typescript
// middleware/upload.middleware.ts
import multer from "multer"
import path from "path"

// Memory Storage (files bleiben im RAM, für direkte S3-Upload)
const storage = multer.memoryStorage()

// File Filter (nur Bilder erlauben)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error("Only images are allowed"))
  }
}

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
})
```

**Upload Route:**

```typescript
router.post(
  "/products/:id/images",
  authenticate,
  authorize(["SELLER"]),
  upload.array("images", 10), // max 10 images
  uploadProductImages
)

async function uploadProductImages(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[]
  const productId = req.params.id

  const uploadPromises = files.map(async (file, index) => {
    const key = `products/${productId}/${Date.now()}-${index}.${file.originalname.split(".").pop()}`
    const url = await s3Service.upload(file.buffer, key, file.mimetype)

    return prisma.productImage.create({
      data: {
        productId,
        url,
        order: index,
        alt: file.originalname,
      },
    })
  })

  const images = await Promise.all(uploadPromises)
  res.json({ status: "success", data: images })
}
```

### 9.2 S3 Integration

```typescript
// services/s3.service.ts
import AWS from "aws-sdk"

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
})

export class S3Service {
  private bucket = process.env.AWS_BUCKET!

  async upload(buffer: Buffer, key: string, contentType: string): Promise<string> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read", // or use CloudFront for CDN
    }

    const result = await s3.upload(params).promise()
    return result.Location
  }

  async delete(key: string): Promise<void> {
    await s3
      .deleteObject({
        Bucket: this.bucket,
        Key: key,
      })
      .promise()
  }

  getSignedUrl(key: string, expiresIn = 3600): string {
    return s3.getSignedUrl("getObject", {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresIn,
    })
  }
}
```

### 9.3 Image Optimization (Frontend)

**Next.js Image Component:**

```tsx
import Image from "next/image"
;<Image
  src={product.images[0].url}
  alt={product.name}
  width={400}
  height={500}
  sizes="(max-width: 768px) 100vw, 400px"
  priority={false} // true for above-the-fold
/>
```

**Vorteile:**

- Automatische Lazy Loading
- Responsive Images (srcset)
- Automatische Optimierung (WebP wenn unterstützt)
- Blur-Placeholder

---

## 10. Integration Drittanbieter

### 10.1 Stripe (Zahlungen)

**Installation:**

```bash
npm install stripe @stripe/stripe-js
```

**Backend Integration:**

```typescript
// config/stripe.ts
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})
```

**Payment Intent erstellen:**

```typescript
// payments.service.ts
export class PaymentsService {
  async createPaymentIntent(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order) throw new NotFoundError("Order not found")

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total.toNumber() * 100), // Cents
      currency: "eur",
      metadata: {
        orderId: order.id,
        orderNumber: order.number,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    await prisma.payment.create({
      data: {
        orderId,
        stripePaymentId: paymentIntent.id,
        amount: order.total,
        currency: "EUR",
        status: "PENDING",
      },
    })

    return { clientSecret: paymentIntent.client_secret }
  }
}
```

**Webhook Handler:**

```typescript
// webhooks/stripe.webhook.ts
import { buffer } from "micro"

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"]!
  const rawBody = await buffer(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object
      await handlePaymentSuccess(paymentIntent)
      break

    case "payment_intent.payment_failed":
      const failedIntent = event.data.object
      await handlePaymentFailed(failedIntent)
      break
  }

  res.json({ received: true })
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentId: paymentIntent.id },
  })

  if (!payment) return

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCEEDED" },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "PAID" },
    }),
  ])

  // Send confirmation email
  await emailService.sendOrderConfirmation(payment.orderId)
}
```

**Frontend Integration (React):**

```tsx
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/success`,
      },
    })

    if (error) {
      alert(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>
        Bezahlen
      </button>
    </form>
  )
}

function CheckoutPage() {
  const { clientSecret } = useCheckout() // Fetch from API

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  )
}
```

### 10.2 SendGrid (E-Mail)

**Installation:**

```bash
npm install @sendgrid/mail
```

**Service:**

```typescript
// services/email.service.ts
import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export class EmailService {
  async sendOrderConfirmation(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true, items: { include: { product: true } } },
    })

    if (!order) return

    const msg = {
      to: order.buyer.email,
      from: "noreply@yourplatform.com",
      subject: `Bestellbestätigung #${order.number}`,
      html: this.renderOrderConfirmationTemplate(order),
    }

    await sgMail.send(msg)
  }

  private renderOrderConfirmationTemplate(order: Order) {
    return `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Vielen Dank für Ihre Bestellung!</h1>
          <p>Bestellnummer: ${order.number}</p>
          <h2>Artikel:</h2>
          <ul>
            ${order.items
              .map(
                (item) => `
              <li>${item.name} - ${item.quantity}x - ${item.price} EUR</li>
            `
              )
              .join("")}
          </ul>
          <p><strong>Gesamtsumme: ${order.total} EUR</strong></p>
        </body>
      </html>
    `
  }
}
```

### 10.3 Elasticsearch (Suche)

**Installation:**

```bash
npm install @elastic/elasticsearch
```

**Client Setup:**

```typescript
// config/elasticsearch.ts
import { Client } from "@elastic/elasticsearch"

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
})
```

**Indexing:**

```typescript
// services/search.service.ts
export class SearchService {
  private index = "products"

  async indexProduct(product: Product) {
    await esClient.index({
      index: this.index,
      id: product.id,
      document: {
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.categoryId,
        sellerId: product.sellerId,
        certificateIds: product.certificates.map((c) => c.certificateId),
        status: product.status,
        createdAt: product.createdAt,
      },
    })
  }

  async search(query: string, filters: SearchFilters) {
    const response = await esClient.search({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ["name^3", "description"],
                fuzziness: "AUTO",
              },
            },
          ],
          filter: [
            { term: { status: "ACTIVE" } },
            ...(filters.category ? [{ term: { categoryId: filters.category } }] : []),
            ...(filters.minPrice ? [{ range: { price: { gte: filters.minPrice } } }] : []),
            ...(filters.maxPrice ? [{ range: { price: { lte: filters.maxPrice } } }] : []),
          ],
        },
      },
      size: filters.limit || 20,
      from: filters.offset || 0,
    })

    return response.hits.hits.map((hit) => hit._source)
  }
}
```

---

## 11. Deployment & Infrastructure

### 11.1 Cloud Provider: AWS

**Dienste:**

- **EC2 / ECS (Fargate):** Backend API Container
- **RDS PostgreSQL:** Managed Database
- **ElastiCache Redis:** Managed Redis
- **S3:** File Storage
- **CloudFront:** CDN für Frontend & Assets
- **Route 53:** DNS
- **ALB (Application Load Balancer):** Load Balancing
- **ACM:** SSL/TLS Zertifikate

**Architektur-Diagramm:**

```
Internet
   │
   ▼
[Route 53] → [CloudFront (CDN)]
   │              │
   ▼              ▼
[ALB]         [S3 (Frontend)]
   │
   ▼
[ECS Fargate]
  ├── API Container 1
  ├── API Container 2
  └── API Container 3
   │
   ├─────► [RDS PostgreSQL]
   └─────► [ElastiCache Redis]
```

### 11.2 Docker Setup

**Dockerfile (Backend):**

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

**docker-compose.yml (Development):**

```yaml
version: "3.8"

services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend/src:/app/src

  frontend:
    build: ./frontend
    ports:
      - "3001:3000"
    env_file:
      - ./frontend/.env.local
    volumes:
      - ./frontend/src:/app/src

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: sustainability_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

volumes:
  postgres_data:
```

### 11.3 CI/CD Pipeline (GitHub Actions)

**.github/workflows/deploy.yml:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci
        working-directory: ./backend

      - name: Run tests
        run: npm test
        working-directory: ./backend

      - name: Run linter
        run: npm run lint
        working-directory: ./backend

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-central-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: sustainability-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Update ECS Service
        run: |
          aws ecs update-service \
            --cluster sustainability-cluster \
            --service api-service \
            --force-new-deployment
```

### 11.4 Environment Variables

**.env.example (Backend):**

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret"

# AWS
AWS_ACCESS_KEY="your-aws-key"
AWS_SECRET_KEY="your-aws-secret"
AWS_REGION="eu-central-1"
AWS_BUCKET="your-bucket-name"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# SendGrid
SENDGRID_API_KEY="SG...."

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# App
NODE_ENV="production"
PORT=3000
API_URL="https://api.yourplatform.com"
FRONTEND_URL="https://yourplatform.com"
```

---

## 12. Monitoring & Logging

### 12.1 Logging (Winston)

```typescript
// utils/logger.ts
import winston from "winston"

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
})

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  )
}

export default logger
```

**Usage:**

```typescript
logger.info("User logged in", { userId: user.id })
logger.error("Payment failed", { orderId, error: err.message })
```

### 12.2 Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})

// In error middleware:
Sentry.captureException(err)
```

### 12.3 Performance Monitoring

**Prometheus + Grafana (Optional, Phase 2/3):**

- Metriken: Request Rate, Response Time, Error Rate
- Dashboards für Visualisierung

**CloudWatch (AWS):**

- Automatisch für ECS/RDS/Redis
- Custom Metrics via SDK

---

**Ende Technische Architektur**

Diese Architektur ist skalierbar, wartbar und folgt Best Practices für moderne Web-Anwendungen. Sie ist bereit für die Umsetzung in einem Entwicklerteam.
