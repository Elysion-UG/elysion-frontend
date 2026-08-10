# Backend-Abweichungen

Stellen, an denen das Backend etwas anderes liefert, als die Frontend-Typen vermuten
lassen. Diese Fälle müssen explizit behandelt werden — die generischen Annahmen aus
[`api-integration.md`](./api-integration.md) gelten hier **nicht**.

---

## Produktliste — eigene Pagination

**Endpoint:** `GET /api/v1/products`

Die Antwort ist ein normaler `ApiResponse`-Envelope, die Pagination darin aber eine
Eigenkonstruktion — **kein** Spring-`Page<>` und **nicht** das generische
`PagedResponse<T>`:

```typescript
{
  items: ProductListItem[]   // nicht "content"
  totalItems: number         // nicht "totalElements"
  page: number               // nicht "number"
  totalPages: number
  size: number
}
```

`ProductService.list()` normalisiert das intern auf `ProductPage` — also immer den
Service verwenden, nie den Endpoint direkt ansprechen.

Die Normalisierung deckt zusätzlich ab:

- `primaryImage: string | null` → `imageUrls: [primaryImage]`
- `seller.id` → `seller.userId`
- kein `basePrice` — nur `price`
- `inStock: boolean` (verkäuflich = mindestens eine Variante mit `stock − reserved > 0`;
  Produkte ohne Varianten-Bestandsführung melden `true`). Fehlt das Feld in älteren
  API-Antworten, wird es zu `true` normalisiert.

## Produktliste — `sort` ist ein Enum

Der `sort`-Parameter erwartet Enum-Werte, **nicht** Springs `field,direction`:

| Gemeint           | Wert          |
| ----------------- | ------------- |
| Neueste zuerst    | `newest`      |
| Preis aufsteigend | `price_asc`   |
| Preis absteigend  | `price_desc`  |
| Match-Score       | `match_score` |

`createdAt,desc` oder `price,asc` liefern `400 Unsupported sort`.

---

## Produktdetail — zwei Endpoints, zwei Feldnamen

| Endpoint                          | Wrapper       | Namensfeld | Auth                   | Verwendung                |
| --------------------------------- | ------------- | ---------- | ---------------------- | ------------------------- |
| `GET /api/v1/products/{slug}`     | `ApiResponse` | `name`     | nein                   | öffentliche Produktseiten |
| `GET /api/v1/products/by-id/{id}` | `ApiResponse` | `title`    | ADMIN, SELLER (eigene) | Seller-/Admin-Ansichten   |

**Navigationsregel:** Für Storefront-Links immer den `slug` verwenden —
`ProductListItemDto` enthält ihn. UUID-basierte öffentliche Navigation wird nicht
mehr unterstützt.

```typescript
// richtig
router.push(`/product?slug=${product.slug}`)

// falsch — UUID ist auf dem öffentlichen Endpoint nicht routebar,
// außerdem kein window.location.href verwenden
window.location.href = `/product?id=${product.id}`
```

> **Breaking Change (2026-03-28):** Der interne Pfad war früher
> `/api/v1/products/{id}` und wurde zu `/api/v1/products/by-id/{id}`, weil er sich
> mit `/{slug}` überschnitten hat.

---

## Checkout — fehlende und umbenannte Felder

**Endpoint:** `POST /api/v1/checkout`

`CheckoutStartResponse` enthält **kein** `shippingCost` oder `total`:

| Erwartet             | Tatsächlich         | Behandlung                                  |
| -------------------- | ------------------- | ------------------------------------------- |
| `items[].totalPrice` | `items[].lineTotal` | Euro-Dezimalwert (z. B. `29.99`)            |
| `shippingCost`       | ❌ nicht vorhanden  | keine separaten Versandkosten → „Kostenlos" |
| `total`              | ❌ nicht vorhanden  | `subtotal` ist die Gesamtsumme              |

`subtotal` und `lineTotal` sind Euro-Dezimalwerte (BigDecimal), **keine Cent**.

**Erledigt (#188):** Der Eintrag „`items[].productName` nicht vorhanden — über
`productId` aus dem Cart-Context lösen" ist weg. Die Checkout-Zeilen tragen
`product.name`, `product.primaryImage` und `variant.options`, genau wie die
Cart-Zeilen; `PreviewStep` rendert direkt daraus und lädt keine Produkte mehr nach.

---

## Bestellungen können von selbst storniert werden

Ein Job (`PendingOrderExpiryJob`) läuft backend-seitig alle 5 Minuten und storniert
unbezahlte `PENDING`-Bestellungen; die Bestandsreservierung wird freigegeben. Eine
vom Frontend angelegte Bestellung kann also **ohne Nutzeraktion** auf `CANCELLED`
wechseln.

Es gibt dafür keinen eigenen Status — Ablauf mappt auf das vorhandene `CANCELLED`.
`PaymentStatus` bleibt `PENDING | SUCCEEDED | FAILED | REFUNDED | PARTIALLY_REFUNDED`.

---

## Transaktionsmails laufen ohne Frontend

Das Backend versendet Bestellbestätigung, Zahlungsbestätigung und
Erstattungsbestätigung automatisch. Das Frontend muss dafür nichts tun.

`POST /api/v1/auth/resend-verification` ist dagegen ein echter Aufruf des Frontends
(`AuthService.resendVerification()`, verwendet in `EmailVerification.tsx`).
