> **ARCHIVIERT** — Dieses Dokument stammt aus der Planungsphase (Februar 2026) und beschreibt Jest/Supertest für ein nie realisiertes Node.js-Backend. Das Frontend nutzt Vitest. Aktuelle Dokumentation: [README.md](../../README.md)

# Testing-Strategie

## Nachhaltigkeits-Zertifikat-Plattform

**Version:** 1.0  
**Datum:** 05.02.2026  
**Ziel:** 80%+ Code Coverage für Production

---

## Test-Pyramide

```
                    /\
                   /  \
                  / E2E \              10% (End-to-End Tests)
                 /______\
                /        \
               /Integration\           30% (Integration Tests)
              /____________\
             /              \
            /  Unit Tests    \         60% (Unit Tests)
           /__________________\
```

---

## 1. Unit Tests

### 1.1 Frameworks

**Backend (Node.js):**

- **Jest:** Test-Runner & Assertions
- **ts-jest:** TypeScript-Support
- **@types/jest:** Type Definitions

```bash
npm install --save-dev jest ts-jest @types/jest
```

**Frontend (React):**

- **Jest:** Test-Runner
- **React Testing Library:** Component-Tests
- **@testing-library/jest-dom:** Custom Matchers

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### 1.2 Was testen?

**Backend:**

- ✅ Services (Business Logic)
- ✅ Repositories (Database Queries)
- ✅ Utilities (Helper Functions)
- ✅ Validators (Zod Schemas)
- ✅ Matching-Algorithmus

**Frontend:**

- ✅ Utilities & Hooks
- ✅ Complex Components (Forms, Checkout)
- ✅ State-Management (Zustand Stores)

**Nicht testen:**

- ❌ Triviale Getter/Setter
- ❌ Third-Party Libraries
- ❌ Simple React Components (nur Markup)

### 1.3 Beispiele

#### Backend: Service-Test

```typescript
// tests/unit/products/products.service.test.ts
import { ProductsService } from "../../../src/modules/products/products.service"
import { ProductRepository } from "../../../src/modules/products/products.repository"
import { CertificatesService } from "../../../src/modules/certificates/certificates.service"

// Mocks
jest.mock("../../../src/modules/products/products.repository")
jest.mock("../../../src/modules/certificates/certificates.service")

describe("ProductsService", () => {
  let service: ProductsService
  let mockProductRepo: jest.Mocked<ProductRepository>
  let mockCertService: jest.Mocked<CertificatesService>

  beforeEach(() => {
    mockProductRepo = new ProductRepository() as jest.Mocked<ProductRepository>
    mockCertService = new CertificatesService() as jest.Mocked<CertificatesService>
    service = new ProductsService(mockProductRepo, mockCertService)
  })

  describe("create", () => {
    it("should create product with ACTIVE status if certificate is verified", async () => {
      // Arrange
      const dto = {
        name: "Test Product",
        description: "A test product description that is long enough",
        price: 29.99,
        categoryId: "cat-123",
        certificateId: "cert-123",
      }

      const mockCert = { id: "cert-123", status: "VERIFIED" }
      mockCertService.findById.mockResolvedValue(mockCert as any)

      const expectedProduct = { ...dto, status: "ACTIVE", id: "prod-123" }
      mockProductRepo.create.mockResolvedValue(expectedProduct as any)

      // Act
      const result = await service.create(dto, "seller-123")

      // Assert
      expect(mockCertService.findById).toHaveBeenCalledWith("cert-123")
      expect(mockProductRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: "ACTIVE" })
      )
      expect(result.status).toBe("ACTIVE")
    })

    it("should create product with DRAFT status if certificate is pending", async () => {
      const dto = {
        /* ... */
      }
      const mockCert = { id: "cert-123", status: "PENDING" }
      mockCertService.findById.mockResolvedValue(mockCert as any)

      const result = await service.create(dto, "seller-123")

      expect(result.status).toBe("DRAFT")
    })

    it("should throw error if certificate does not exist", async () => {
      const dto = {
        /* ... */
      }
      mockCertService.findById.mockResolvedValue(null)

      await expect(service.create(dto, "seller-123")).rejects.toThrow("Certificate not found")
    })
  })
})
```

#### Backend: Matching-Algorithmus-Test

```typescript
// tests/unit/matching/matching.service.test.ts
import { MatchingService } from "../../../src/modules/matching/matching.service"

describe("MatchingService", () => {
  let service: MatchingService

  beforeEach(() => {
    service = new MatchingService()
  })

  describe("calculateMatchScore", () => {
    it("should return 100% if all user preferences are met", () => {
      const userProfile = {
        "Faire Arbeitsbedingungen": 100,
        "Umweltfreundliche Produktion": 80,
      }

      const product = {
        certificates: [
          {
            type: "IVN_BEST",
            criteria: ["Faire Arbeitsbedingungen", "Umweltfreundliche Produktion"],
          },
        ],
      }

      const score = service.calculateMatchScore(userProfile, product)

      expect(score).toBe(100)
    })

    it("should return 0% if no preferences are met", () => {
      const userProfile = {
        Tierwohl: 100,
      }

      const product = {
        certificates: [{ type: "IVN_BEST", criteria: ["Faire Arbeitsbedingungen"] }],
      }

      const score = service.calculateMatchScore(userProfile, product)

      expect(score).toBe(0)
    })

    it("should calculate partial match correctly", () => {
      const userProfile = {
        "Faire Arbeitsbedingungen": 90, // Erfüllt (90)
        Umweltfreundlich: 80, // Erfüllt (80)
        Tierwohl: 70, // Nicht erfüllt (0)
        Lokal: 60, // Nicht erfüllt (0)
      }
      // Summe Gewichtungen: 300
      // Erfüllt: 170

      const product = {
        certificates: [
          { type: "IVN_BEST", criteria: ["Faire Arbeitsbedingungen", "Umweltfreundlich"] },
        ],
      }

      const score = service.calculateMatchScore(userProfile, product)

      expect(score).toBeCloseTo(56.67, 2) // 170/300 * 100
    })
  })
})
```

#### Frontend: Component-Test

```typescript
// tests/unit/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../../../src/components/products/ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: 'prod-123',
    name: 'Bio T-Shirt',
    price: 29.99,
    images: [{ url: '/image.jpg', alt: 'T-Shirt' }],
    matchScore: 87.5
  };

  it('should render product name and price', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Bio T-Shirt')).toBeInTheDocument();
    expect(screen.getByText('29,99 €')).toBeInTheDocument();
  });

  it('should display match score if provided', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('88% Match')).toBeInTheDocument();
  });

  it('should not display match score if not provided', () => {
    const productWithoutScore = { ...mockProduct, matchScore: undefined };
    render(<ProductCard product={productWithoutScore} />);

    expect(screen.queryByText(/Match/)).not.toBeInTheDocument();
  });

  it('should call onClick when "In den Warenkorb" is clicked', () => {
    const handleAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={handleAddToCart} />);

    fireEvent.click(screen.getByText('In den Warenkorb'));

    expect(handleAddToCart).toHaveBeenCalledWith(mockProduct.id);
  });
});
```

#### Frontend: Hook-Test

```typescript
// tests/unit/hooks/useProducts.test.ts
import { renderHook, waitFor } from "@testing-library/react"
import { useProducts } from "../../../src/hooks/useProducts"
import * as api from "../../../src/lib/api/products"

jest.mock("../../../src/lib/api/products")

describe("useProducts", () => {
  it("should fetch products on mount", async () => {
    const mockProducts = [
      { id: "1", name: "Product 1" },
      { id: "2", name: "Product 2" },
    ]

    ;(api.getProducts as jest.Mock).mockResolvedValue({ data: mockProducts })

    const { result } = renderHook(() => useProducts())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.products).toEqual(mockProducts)
    expect(result.current.error).toBeNull()
  })

  it("should handle errors", async () => {
    const mockError = new Error("Network error")
    ;(api.getProducts as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.products).toEqual([])
    expect(result.current.error).toBe(mockError)
  })
})
```

### 1.4 Coverage-Ziele

**Minimum:**

- Services: 80%
- Repositories: 70%
- Utilities: 90%
- Components: 60%

**Command:**

```bash
npm test -- --coverage
```

---

## 2. Integration Tests

### 2.1 Frameworks

**Backend:**

- **Supertest:** HTTP-Assertions
- **@testcontainers/postgresql:** Echte DB für Tests

```bash
npm install --save-dev supertest @types/supertest @testcontainers/postgresql
```

### 2.2 Was testen?

- ✅ API-Endpoints (Request → Response)
- ✅ Datenbank-Interaktionen
- ✅ Authentifizierung & Authorization
- ✅ File-Upload-Flow
- ✅ Webhook-Handling (Stripe)

### 2.3 Beispiele

#### API-Endpoint-Test

```typescript
// tests/integration/products/products.api.test.ts
import request from "supertest"
import { app } from "../../../src/app"
import { prisma } from "../../../src/config/database"
import { createTestUser, getAuthToken } from "../../helpers/auth"

describe("Products API", () => {
  let authToken: string
  let sellerId: string

  beforeAll(async () => {
    const user = await createTestUser("SELLER")
    sellerId = user.id
    authToken = await getAuthToken(user)
  })

  afterAll(async () => {
    await prisma.product.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe("POST /products", () => {
    it("should create a new product", async () => {
      const productData = {
        name: "Test Product",
        description: "A test product with a long enough description to pass validation",
        price: 29.99,
        categoryId: "cat-123",
        certificateId: "cert-123",
      }

      const response = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send(productData)
        .expect(201)

      expect(response.body.status).toBe("success")
      expect(response.body.data.name).toBe("Test Product")
      expect(response.body.data.price).toBe(29.99)

      // Verify in database
      const product = await prisma.product.findFirst({
        where: { name: "Test Product" },
      })
      expect(product).not.toBeNull()
    })

    it("should return 400 if validation fails", async () => {
      const invalidData = {
        name: "AB", // Too short
        description: "Short", // Too short
        price: -10, // Negative
      }

      const response = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.status).toBe("error")
      expect(response.body.errors).toBeDefined()
    })

    it("should return 401 if not authenticated", async () => {
      await request(app).post("/api/v1/products").send({ name: "Test" }).expect(401)
    })

    it("should return 403 if user is not a seller", async () => {
      const buyer = await createTestUser("BUYER")
      const buyerToken = await getAuthToken(buyer)

      await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({
          /* valid data */
        })
        .expect(403)
    })
  })

  describe("GET /products", () => {
    beforeEach(async () => {
      // Seed test data
      await prisma.product.createMany({
        data: [
          { name: "Product 1", price: 10, status: "ACTIVE", sellerId /* ... */ },
          { name: "Product 2", price: 20, status: "ACTIVE", sellerId /* ... */ },
          { name: "Product 3", price: 30, status: "DRAFT", sellerId /* ... */ },
        ],
      })
    })

    it("should return only active products", async () => {
      const response = await request(app).get("/api/v1/products").expect(200)

      expect(response.body.data).toHaveLength(2)
      expect(response.body.data.every((p) => p.status === "ACTIVE")).toBe(true)
    })

    it("should filter by price range", async () => {
      const response = await request(app)
        .get("/api/v1/products?minPrice=15&maxPrice=25")
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].name).toBe("Product 2")
    })

    it("should paginate results", async () => {
      const response = await request(app).get("/api/v1/products?page=1&limit=1").expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.meta.total).toBe(2)
      expect(response.body.meta.totalPages).toBe(2)
    })
  })
})
```

#### Authentifizierungs-Flow-Test

```typescript
// tests/integration/auth/auth.api.test.ts
import request from "supertest"
import { app } from "../../../src/app"
import { prisma } from "../../../src/config/database"

describe("Authentication API", () => {
  const testUser = {
    email: "test@example.com",
    password: "Test1234!",
    firstName: "Test",
    lastName: "User",
  }

  afterAll(async () => {
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({ ...testUser, role: "BUYER" })
        .expect(201)

      expect(response.body.status).toBe("success")
      expect(response.body.message).toContain("E-Mail")

      // Verify user in DB
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      })
      expect(user).not.toBeNull()
      expect(user!.emailVerified).toBe(false)
    })

    it("should reject duplicate email", async () => {
      // First registration
      await request(app)
        .post("/api/v1/auth/register")
        .send({ ...testUser, role: "BUYER" })

      // Duplicate attempt
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({ ...testUser, role: "BUYER" })
        .expect(409)

      expect(response.body.message).toContain("already exists")
    })
  })

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Create verified user
      await request(app)
        .post("/api/v1/auth/register")
        .send({ ...testUser, role: "BUYER" })

      // Manually verify (in real scenario, click email link)
      await prisma.user.update({
        where: { email: testUser.email },
        data: { emailVerified: true },
      })
    })

    it("should login with correct credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      expect(response.body.accessToken).toBeDefined()
      expect(response.body.refreshToken).toBeDefined()
      expect(response.body.user.email).toBe(testUser.email)
    })

    it("should reject incorrect password", async () => {
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword123!",
        })
        .expect(401)
    })

    it("should reject non-existent user", async () => {
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "Test1234!",
        })
        .expect(401)
    })
  })

  describe("POST /auth/refresh", () => {
    it("should refresh access token with valid refresh token", async () => {
      // Login to get tokens
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: testUser.email, password: testUser.password })

      const { refreshToken } = loginRes.body

      // Refresh
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(200)

      expect(response.body.accessToken).toBeDefined()
      expect(response.body.accessToken).not.toBe(loginRes.body.accessToken)
    })

    it("should reject invalid refresh token", async () => {
      await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "invalid-token" })
        .expect(401)
    })
  })
})
```

---

## 3. End-to-End (E2E) Tests

### 3.1 Frameworks

**Playwright** (empfohlen für moderne Web-Apps)

```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Alternativ: Cypress**

```bash
npm install --save-dev cypress
npx cypress open
```

### 3.2 Was testen?

- ✅ Kritische User-Flows (Registration → Login → Checkout)
- ✅ Cross-Browser-Kompatibilität
- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Performance (Page Load Times)

### 3.3 Beispiele (Playwright)

#### Käufer-Journey: Registration → Produkt kaufen

```typescript
// tests/e2e/buyer-checkout.spec.ts
import { test, expect } from "@playwright/test"

test.describe("Buyer Checkout Flow", () => {
  test("should complete full checkout as new user", async ({ page }) => {
    // 1. Homepage besuchen
    await page.goto("https://yourplatform.com")
    await expect(page).toHaveTitle(/Sustainability Platform/)

    // 2. Registrieren
    await page.click("text=Registrieren")
    await page.fill('input[name="email"]', "e2e-test@example.com")
    await page.fill('input[name="password"]', "Test1234!")
    await page.fill('input[name="firstName"]', "E2E")
    await page.fill('input[name="lastName"]', "Test")
    await page.check('input[name="acceptTerms"]')
    await page.click('button[type="submit"]')

    // 3. E-Mail-Verifizierung (in E2E: manuell in DB setzen oder Mock)
    // await verifyEmail('e2e-test@example.com');

    // 4. Login
    await page.goto("https://yourplatform.com/login")
    await page.fill('input[name="email"]', "e2e-test@example.com")
    await page.fill('input[name="password"]', "Test1234!")
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)

    // 5. Produkt suchen
    await page.fill('input[placeholder="Suchen..."]', "Bio T-Shirt")
    await page.keyboard.press("Enter")
    await page.waitForSelector(".product-card")

    // 6. Produkt öffnen
    await page.click(".product-card:first-child")
    await expect(page).toHaveURL(/\/products\//)

    // 7. Variante wählen & in Warenkorb
    await page.selectOption('select[name="size"]', "M")
    await page.selectOption('select[name="color"]', "Weiß")
    await page.click('button:has-text("In den Warenkorb")')

    await expect(page.locator(".cart-count")).toHaveText("1")

    // 8. Warenkorb öffnen
    await page.click(".cart-icon")
    await expect(page).toHaveURL(/\/cart/)
    await expect(page.locator(".cart-item")).toHaveCount(1)

    // 9. Checkout starten
    await page.click('button:has-text("Zur Kasse")')

    // 10. Lieferadresse eingeben
    await page.fill('input[name="street"]', "Teststraße 123")
    await page.fill('input[name="zip"]', "10115")
    await page.fill('input[name="city"]', "Berlin")
    await page.click('button:has-text("Weiter")')

    // 11. Versandart wählen
    await page.check('input[value="standard"]')
    await page.click('button:has-text("Weiter")')

    // 12. Zahlungsdaten (Stripe Test-Card)
    await page
      .frameLocator('iframe[name^="__privateStripeFrame"]')
      .locator('input[name="cardnumber"]')
      .fill("4242424242424242")
    await page
      .frameLocator('iframe[name^="__privateStripeFrame"]')
      .locator('input[name="exp-date"]')
      .fill("12/30")
    await page
      .frameLocator('iframe[name^="__privateStripeFrame"]')
      .locator('input[name="cvc"]')
      .fill("123")
    await page.click('button:has-text("Weiter")')

    // 13. Bestellung abschließen
    await page.check('input[name="acceptTerms"]')
    await page.click('button:has-text("Zahlungspflichtig bestellen")')

    // 14. Erfolgsseite
    await expect(page).toHaveURL(/\/order\/success/, { timeout: 10000 })
    await expect(page.locator("h1")).toContainText("Vielen Dank")

    const orderNumber = await page.locator(".order-number").textContent()
    expect(orderNumber).toMatch(/2026-\d{6}/)
  })

  test("should show match score for products when profile is set", async ({ page }) => {
    // Login as user with profile
    await loginWithProfile(page)

    // Visit product page
    await page.goto("https://yourplatform.com/products")

    // Verify match scores are displayed
    const products = page.locator(".product-card")
    const firstProduct = products.first()

    await expect(firstProduct.locator(".match-score")).toBeVisible()
    await expect(firstProduct.locator(".match-score")).toHaveText(/\d+% Match/)
  })
})
```

#### Verkäufer-Journey: Produkt anlegen

```typescript
// tests/e2e/seller-product-creation.spec.ts
import { test, expect } from "@playwright/test"

test("should create product with certificate", async ({ page }) => {
  // 1. Login als Verkäufer
  await page.goto("https://yourplatform.com/login")
  await page.fill('input[name="email"]', "seller@example.com")
  await page.fill('input[name="password"]', "SellerPass123!")
  await page.click('button[type="submit"]')

  // 2. Dashboard
  await expect(page).toHaveURL(/\/seller\/dashboard/)

  // 3. Zertifikat hochladen
  await page.click("text=Zertifikate")
  await page.click('button:has-text("Neues Zertifikat")')

  await page.selectOption('select[name="type"]', "IVN_BEST")
  await page.fill('input[name="number"]', "IVN-TEST-2026-001")
  await page.fill('input[name="issueDate"]', "2026-01-01")
  await page.fill('input[name="expiryDate"]', "2027-01-01")

  await page.setInputFiles('input[type="file"]', "tests/fixtures/certificate.pdf")

  await page.click('button:has-text("Hochladen")')

  await expect(page.locator(".certificate-status")).toHaveText("Ausstehend")

  // 4. Als Admin verifizieren (separater Test oder Mock)
  // await verifyAs Admin(certificateId);

  // 5. Produkt anlegen
  await page.click("text=Produkte")
  await page.click('button:has-text("Neues Produkt")')

  await page.fill('input[name="name"]', "E2E Test Bio T-Shirt")
  await page.fill(
    'textarea[name="description"]',
    "Dies ist ein Test-Produkt für E2E-Tests. Es enthält eine ausreichend lange Beschreibung."
  )
  await page.fill('input[name="price"]', "29.99")
  await page.selectOption('select[name="categoryId"]', { label: "Oberteile" })
  await page.selectOption('select[name="certificateId"]', { label: "IVN-TEST-2026-001" })

  // Bilder hochladen
  await page.setInputFiles('input[type="file"][name="images"]', [
    "tests/fixtures/product-image-1.jpg",
    "tests/fixtures/product-image-2.jpg",
  ])

  // Varianten hinzufügen
  await page.click('button:has-text("Variante hinzufügen")')
  await page.selectOption('select[name="variants[0].type"]', "SIZE")
  await page.fill('input[name="variants[0].value"]', "M")
  await page.fill('input[name="variants[0].stock"]', "10")

  await page.click('button:has-text("Produkt erstellen")')

  // Verify success
  await expect(page.locator(".success-message")).toBeVisible()
  await expect(page.locator(".product-list")).toContainText("E2E Test Bio T-Shirt")
})
```

---

## 4. Performance Tests

### 4.1 Tools

**k6** (Load Testing)

```bash
brew install k6  # macOS
# oder
wget https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz
```

### 4.2 Load Test Script

```javascript
// tests/performance/load-test.js
import http from "k6/http"
import { check, sleep } from "k6"

export const options = {
  stages: [
    { duration: "1m", target: 50 }, // Ramp-up zu 50 Users
    { duration: "3m", target: 50 }, // Bleib bei 50 Users
    { duration: "1m", target: 100 }, // Ramp-up zu 100
    { duration: "3m", target: 100 }, // Bleib bei 100
    { duration: "1m", target: 0 }, // Ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% der Requests < 500ms
    http_req_failed: ["rate<0.01"], // Fehlerrate < 1%
  },
}

const BASE_URL = "https://api.yourplatform.com/v1"

export default function () {
  // 1. Homepage-Aufruf (Produktliste)
  const productsRes = http.get(`${BASE_URL}/products?limit=20`)
  check(productsRes, {
    "products status is 200": (r) => r.status === 200,
    "products response time < 500ms": (r) => r.timings.duration < 500,
  })

  sleep(1)

  // 2. Produktdetails
  const productId = JSON.parse(productsRes.body).data[0].id
  const productRes = http.get(`${BASE_URL}/products/${productId}`)
  check(productRes, {
    "product details status is 200": (r) => r.status === 200,
  })

  sleep(2)

  // 3. Suche
  const searchRes = http.get(`${BASE_URL}/products?search=bio`)
  check(searchRes, {
    "search status is 200": (r) => r.status === 200,
    "search response time < 300ms": (r) => r.timings.duration < 300,
  })

  sleep(1)
}
```

**Run:**

```bash
k6 run tests/performance/load-test.js
```

---

## 5. Security Tests

### 5.1 OWASP ZAP (Automated Security Scan)

```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://yourplatform.com
```

### 5.2 Manual Checks

- [ ] SQL Injection (via Parameterized Queries/ORM)
- [ ] XSS (via Output Escaping)
- [ ] CSRF (via CSRF Tokens)
- [ ] Authentication (JWT, bcrypt)
- [ ] Authorization (Role-based Access Control)
- [ ] Secrets (nie in Git, Secrets Manager)
- [ ] HTTPS (SSL/TLS 1.2+)
- [ ] Rate Limiting
- [ ] Input Validation (Zod)

---

## 6. CI/CD Integration

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci
        working-directory: ./backend

      - name: Run unit tests
        run: npm test -- --coverage
        working-directory: ./backend

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
      - name: Run migrations
        run: npx prisma migrate deploy
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      - name: Run integration tests
        run: npm run test:integration
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: ./frontend
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## 7. Test-Daten-Management

### 7.1 Fixtures

```typescript
// tests/fixtures/products.ts
export const mockProducts = [
  {
    id: "prod-123",
    name: "Bio T-Shirt",
    description: "A beautiful organic cotton t-shirt",
    price: 29.99,
    categoryId: "cat-123",
    sellerId: "seller-123",
    status: "ACTIVE",
  },
  // ... more
]
```

### 7.2 Factory-Pattern

```typescript
// tests/factories/user.factory.ts
import { faker } from "@faker-js/faker"
import { prisma } from "../../src/config/database"
import bcrypt from "bcrypt"

export const createTestUser = async (role: "BUYER" | "SELLER" | "ADMIN" = "BUYER") => {
  const password = await bcrypt.hash("Test1234!", 10)

  return prisma.user.create({
    data: {
      email: faker.internet.email(),
      password,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role,
      emailVerified: true,
    },
  })
}
```

---

## 8. Test-Checkliste vor Production

- [ ] **Unit Tests:** 80%+ Coverage
- [ ] **Integration Tests:** Alle kritischen Endpoints
- [ ] **E2E Tests:** 5+ User-Flows
- [ ] **Performance:** Load-Test mit 100+ concurrent users
- [ ] **Security:** OWASP ZAP Scan ohne kritische Findings
- [ ] **Cross-Browser:** Chrome, Firefox, Safari, Edge
- [ ] **Mobile:** iOS Safari, Android Chrome
- [ ] **Accessibility:** WCAG 2.1 AA
- [ ] **Smoke-Tests:** Production-Umgebung

---

**Testing ist kein Overhead, sondern Investment in Qualität!** 🧪✅
