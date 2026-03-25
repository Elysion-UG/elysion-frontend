# API-Dokumentation (OpenAPI 3.0)
## Nachhaltigkeits-Zertifikat-Plattform

**Version:** 1.0  
**Basis-URL:** `https://api.yourplatform.com/v1`

---

## OpenAPI Specification (Swagger)

Dieses Dokument dient als Template. Die vollständige OpenAPI-Spezifikation sollte mit Tools wie Swagger Editor erstellt und automatisch aus dem Code generiert werden.

### Quick Start

```yaml
openapi: 3.0.0
info:
  title: Sustainability Platform API
  version: 1.0.0
  description: API für Nachhaltigkeits-Zertifikat-Plattform
  contact:
    email: dev@yourplatform.com

servers:
  - url: https://api.yourplatform.com/v1
    description: Production
  - url: https://staging-api.yourplatform.com/v1
    description: Staging
  - url: http://localhost:3000/api/v1
    description: Development

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        role:
          type: string
          enum: [BUYER, SELLER, ADMIN]
        firstName:
          type: string
        lastName:
          type: string
        createdAt:
          type: string
          format: date-time

    Product:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          minLength: 3
          maxLength: 200
        description:
          type: string
          minLength: 50
          maxLength: 2000
        price:
          type: number
          format: decimal
          minimum: 0
        categoryId:
          type: string
          format: uuid
        sellerId:
          type: string
          format: uuid
        status:
          type: string
          enum: [DRAFT, ACTIVE, DELETED]
        matchScore:
          type: number
          format: float
          minimum: 0
          maximum: 100
          description: "Match-Score für aktuellen Nutzer (nur wenn authenticated)"
        images:
          type: array
          items:
            $ref: '#/components/schemas/ProductImage'
        certificates:
          type: array
          items:
            $ref: '#/components/schemas/Certificate'

    ProductImage:
      type: object
      properties:
        id:
          type: string
          format: uuid
        url:
          type: string
          format: uri
        order:
          type: integer
        alt:
          type: string

    Certificate:
      type: object
      properties:
        id:
          type: string
          format: uuid
        type:
          type: string
          enum: [IVN_BEST, IVN_NATURLEDER, GOTS]
        number:
          type: string
        issueDate:
          type: string
          format: date
        expiryDate:
          type: string
          format: date
        status:
          type: string
          enum: [PENDING, VERIFIED, REJECTED, EXPIRED]
        documentUrl:
          type: string
          format: uri

    Order:
      type: object
      properties:
        id:
          type: string
          format: uuid
        number:
          type: string
          example: "2026-000001"
        status:
          type: string
          enum: [PENDING, PAID, SHIPPED, DELIVERED, CANCELLED, REFUNDED]
        subtotal:
          type: number
          format: decimal
        shippingCost:
          type: number
          format: decimal
        tax:
          type: number
          format: decimal
        total:
          type: number
          format: decimal
        items:
          type: array
          items:
            $ref: '#/components/schemas/OrderItem'

    OrderItem:
      type: object
      properties:
        id:
          type: string
          format: uuid
        productId:
          type: string
          format: uuid
        name:
          type: string
        price:
          type: number
          format: decimal
        quantity:
          type: integer
          minimum: 1
        subtotal:
          type: number
          format: decimal

    Error:
      type: object
      properties:
        status:
          type: string
          example: "error"
        message:
          type: string
        errors:
          type: array
          items:
            type: object

paths:
  # ========== AUTHENTICATION ==========
  
  /auth/register:
    post:
      tags:
        - Authentication
      summary: Registrierung neuer Nutzer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
                - firstName
                - lastName
                - role
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                firstName:
                  type: string
                lastName:
                  type: string
                role:
                  type: string
                  enum: [BUYER, SELLER]
                # Seller-spezifisch (nur wenn role=SELLER):
                companyName:
                  type: string
                taxId:
                  type: string
                iban:
                  type: string
      responses:
        '201':
          description: Registrierung erfolgreich
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "success"
                  message:
                    type: string
                    example: "Bitte E-Mail bestätigen"
        '400':
          description: Validierungsfehler
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/login:
    post:
      tags:
        - Authentication
      summary: Login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
      responses:
        '200':
          description: Login erfolgreich
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  accessToken:
                    type: string
                  refreshToken:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Ungültige Credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/refresh:
    post:
      tags:
        - Authentication
      summary: Access Token erneuern
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                refreshToken:
                  type: string
      responses:
        '200':
          description: Token erneuert
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string

  # ========== PRODUCTS ==========

  /products:
    get:
      tags:
        - Products
      summary: Produktliste abrufen
      parameters:
        - name: category
          in: query
          schema:
            type: string
            format: uuid
        - name: minPrice
          in: query
          schema:
            type: number
        - name: maxPrice
          in: query
          schema:
            type: number
        - name: search
          in: query
          schema:
            type: string
        - name: sort
          in: query
          schema:
            type: string
            enum: [newest, price_asc, price_desc, match_score]
        - name: matchMin
          in: query
          schema:
            type: number
            minimum: 0
            maximum: 100
          description: "Nur Produkte mit Match-Score >= X (nur für authenticated Users)"
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 50
      responses:
        '200':
          description: Produktliste
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Product'
                  meta:
                    type: object
                    properties:
                      total:
                        type: integer
                      page:
                        type: integer
                      limit:
                        type: integer
                      totalPages:
                        type: integer

    post:
      tags:
        - Products
      summary: Neues Produkt erstellen (Seller only)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
                - description
                - price
                - categoryId
                - certificateId
              properties:
                name:
                  type: string
                description:
                  type: string
                shortDesc:
                  type: string
                price:
                  type: number
                taxRate:
                  type: number
                  default: 19
                categoryId:
                  type: string
                  format: uuid
                certificateId:
                  type: string
                  format: uuid
                shopId:
                  type: string
                  format: uuid
                sku:
                  type: string
                weight:
                  type: number
      responses:
        '201':
          description: Produkt erstellt
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  data:
                    $ref: '#/components/schemas/Product'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden (not a seller)

  /products/{id}:
    get:
      tags:
        - Products
      summary: Produktdetails
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Produkt gefunden
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  data:
                    $ref: '#/components/schemas/Product'
        '404':
          description: Produkt nicht gefunden

    patch:
      tags:
        - Products
      summary: Produkt bearbeiten (Seller only, eigene Produkte)
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                description:
                  type: string
                price:
                  type: number
                # ... weitere Felder
      responses:
        '200':
          description: Produkt aktualisiert

  # ========== CERTIFICATES ==========

  /certificates:
    get:
      tags:
        - Certificates
      summary: Zertifikate auflisten
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Zertifikatsliste (Seller sieht nur eigene, Admin alle)

    post:
      tags:
        - Certificates
      summary: Zertifikat hochladen (Seller only)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                type:
                  type: string
                  enum: [IVN_BEST, IVN_NATURLEDER, GOTS]
                number:
                  type: string
                issueDate:
                  type: string
                  format: date
                expiryDate:
                  type: string
                  format: date
                document:
                  type: string
                  format: binary
                  description: "PDF-Datei (max 10MB)"
                productIds:
                  type: array
                  items:
                    type: string
                    format: uuid
      responses:
        '201':
          description: Zertifikat hochgeladen, Status PENDING

  /certificates/{id}/verify:
    patch:
      tags:
        - Certificates
      summary: Zertifikat verifizieren (Admin only)
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Zertifikat verifiziert, Produkte aktiviert

  # ========== ORDERS ==========

  /orders:
    get:
      tags:
        - Orders
      summary: Bestellhistorie (User)
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Bestellliste

    post:
      tags:
        - Orders
      summary: Bestellung erstellen (Checkout)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                items:
                  type: array
                  items:
                    type: object
                    properties:
                      productId:
                        type: string
                        format: uuid
                      variantId:
                        type: string
                        format: uuid
                      quantity:
                        type: integer
                shippingAddress:
                  type: object
                billingAddress:
                  type: object
                paymentMethodId:
                  type: string
                  description: "Stripe Payment Method ID"
      responses:
        '201':
          description: Bestellung erstellt, Payment Intent returned

  # ========== PAYMENTS ==========

  /payments/intent:
    post:
      tags:
        - Payments
      summary: Payment Intent erstellen
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                orderId:
                  type: string
                  format: uuid
      responses:
        '200':
          description: Payment Intent erstellt
          content:
            application/json:
              schema:
                type: object
                properties:
                  clientSecret:
                    type: string

  # ========== SELLER ENDPOINTS ==========

  /seller/orders:
    get:
      tags:
        - Seller
      summary: Bestellungen für Verkäufer
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Bestellliste (nur Bestellungen mit eigenen Produkten)

  /seller/analytics:
    get:
      tags:
        - Seller
      summary: Verkaufs-Analytics
      security:
        - bearerAuth: []
      parameters:
        - name: period
          in: query
          schema:
            type: string
            enum: [7d, 30d, 90d, 1y]
            default: 30d
      responses:
        '200':
          description: Analytics-Daten

  # ========== ADMIN ENDPOINTS ==========

  /admin/users:
    get:
      tags:
        - Admin
      summary: Alle Nutzer auflisten
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Nutzerliste (Admin only)

  /admin/users/{id}/suspend:
    patch:
      tags:
        - Admin
      summary: Nutzer suspendieren
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
      responses:
        '200':
          description: Nutzer suspendiert
```

---

## Verwendung

### 1. Swagger UI Integration

```javascript
// backend/src/app.ts
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const swaggerDocument = YAML.load('./docs/api-spec.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

**Zugriff:** `http://localhost:3000/api-docs`

### 2. Automatische Generierung aus Code

**Mit tsoa (TypeScript):**

```typescript
// product.controller.ts
/**
 * @route GET /products
 * @tags Products
 * @summary Get all products
 */
@Get('/')
public async getProducts(
  @Query() category?: string,
  @Query() minPrice?: number
): Promise<ProductListResponse> {
  // ...
}
```

```bash
npx tsoa spec-and-routes
```

### 3. Testing mit Postman

**Collection exportieren:**
- Swagger → Postman Collection
- Importieren in Postman
- Umgebungsvariablen setzen (BASE_URL, TOKEN)

---

## Response-Format-Standards

### Success Response

```json
{
  "status": "success",
  "data": { /* ... */ }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Paginated Response

```json
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

---

## HTTP Status Codes

| Code | Bedeutung | Verwendung |
|------|-----------|------------|
| 200 | OK | Erfolgreiche GET, PATCH, DELETE Requests |
| 201 | Created | Erfolgreiche POST Requests (Ressource erstellt) |
| 204 | No Content | Erfolgreiche DELETE Requests (keine Rückgabe) |
| 400 | Bad Request | Validierungsfehler, ungültige Eingabe |
| 401 | Unauthorized | Fehlende oder ungültige Authentifizierung |
| 403 | Forbidden | Authentifiziert, aber keine Berechtigung |
| 404 | Not Found | Ressource nicht gefunden |
| 409 | Conflict | Konflikt (z.B. E-Mail bereits registriert) |
| 429 | Too Many Requests | Rate Limit überschritten |
| 500 | Internal Server Error | Unerwarteter Server-Fehler |

---

## Rate Limiting

**Limits:**
- Anonymous: 100 Requests / 15 Min
- Authenticated: 1000 Requests / 15 Min

**Header:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1643731200
```

---

## Versionierung

**URL-basiert:** `/v1/products`, `/v2/products`

**Breaking Changes:**
- Neue Major-Version erstellen
- Alte Version mind. 6 Monate unterstützen
- Deprecation-Warnung in Responses

**Header:**
```
X-API-Version: 1.0.0
X-API-Deprecated: false
```

---

**Nächste Schritte:**
1. Vollständige OpenAPI-Spec in `api-spec.yaml` erstellen
2. Swagger UI integrieren
3. Postman-Collection generieren
4. API-Tests schreiben (Jest + Supertest)
