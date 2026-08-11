# API-Integration — Frontend ↔ Backend

Der HTTP-Vertrag zwischen `elysion-frontend` und `elysion-marketplace-backend`:
Client-Verhalten, alle Endpoints, Fehlerbehandlung.

**API-Prefix:** `/api/v1` · **Backend-URL:** siehe [`INDEX.md`](./INDEX.md#umgebungen)
**Backend-Docs:** `../../elysion-marketplace-backend/docs/api-for-v0.md`

> **Doku-Sync:** Ändert sich der API-Vertrag, werden Backend `docs/api/` und diese
> Datei im selben Arbeitsgang aktualisiert ([`CONTRIBUTING.md`](../CONTRIBUTING.md) §6).

---

## HTTP-Client (`src/lib/api-client.ts`)

Alle Backend-Requests laufen ausnahmslos über diesen Client — nie direkt `fetch()`.

```typescript
import { apiRequest, apiUpload, ApiError } from "@/src/lib/api-client"

const user = await apiRequest<User>("/api/v1/users/me")

const result = await apiRequest<TokensResponse>("/api/v1/auth/customer/login", {
  method: "POST",
  body: JSON.stringify(dto),
})

// Multipart — Content-Type wird automatisch gesetzt
const file = await apiUpload<FileUploadResponse>("/api/v1/files/upload", formData)
```

Verhalten:

- **Envelope:** Das Backend antwortet `{ status, message, data }`; `apiRequest` packt
  aus und gibt `data` direkt zurück.
- **204 No Content** → `null`.
- **Fehler** werfen `ApiError(status, message, body)`.
- **Access-Token** wird automatisch als `Authorization: Bearer …` angehängt. Er liegt
  im Modul-Memory, nicht in `localStorage`/`sessionStorage` (XSS-Schutz).
- **`credentials: "include"`** ist immer gesetzt → der HttpOnly-Refresh-Cookie geht
  automatisch mit. Bei 401 refresht der Client einmal und wiederholt den Request.

### Umgebungsvariablen

`NEXT_PUBLIC_API_URL` bleibt **leer** (empfohlen) → relative Pfade, same-origin über
alle Subdomains. Nur für direkten Backend-Zugriff ohne Next.js-Proxy setzen.
Alle Variablen inkl. der server-seitig **erforderlichen** `API_URL` sind in
[`.env.example`](../.env.example) dokumentiert.

---

## Services (`src/services/`)

Ein Service pro Domäne, re-exportiert über `src/services/index.ts`. Die Services
kapseln ausschließlich die Endpoints unten; eigene Fetch- oder Fehlerbehandlung
haben sie nicht.

`auth` · `user` · `address` · `buyer-value-profile` · `seller-profile` ·
`seller-value-profile` · `admin` · `product` · `seller-product` · `category` ·
`material` · `certificate` · `cart` · `checkout` · `order` · `seller-order` ·
`seller-payout` · `payment` · `file` · `recommendation` · `monitoring` ·
`contact` · `seller`

> Die Methodennamen stehen im jeweiligen Service — hier bewusst nicht gespiegelt,
> damit sie nicht auseinanderlaufen.

---

## Endpoints

### Auth (`/api/v1/auth`)

Läuft über den Next.js-Auth-Proxy (`src/app/api/v1/auth/[...path]/route.ts`), der den
Refresh-Cookie durchreicht und den Presence-Marker setzt (siehe
[`ARCHITECTURE.md`](./ARCHITECTURE.md#411-serverseitige-first-line-of-defence-68)).

```
POST /register                  → { userId, email }   — BUYER oder SELLER
POST /customer/login            → TokensResponse
POST /seller/login              → TokensResponse
POST /admin/login               → TokensResponse
POST /refresh                   → TokensResponse      — rotiert den Refresh-Cookie
POST /logout                    → null                — widerruft Token, löscht Cookie
POST /verify-email              → null
GET  /verify-email?token=       → null                — link-freundliche Variante
POST /resend-verification       → null                — immer 200 (keine Enumeration)
POST /forgot-password           → null                — immer 200 (keine Enumeration)
POST /reset-password            → null
POST /reset-password/validate   → null                — prüft Token, ohne ihn zu verbrauchen
```

Es gibt **drei portal-spezifische Login-Endpoints** — kein generisches `/login`.

### User, Adressen, Profile

```
GET    /api/v1/users/me                         → User
PATCH  /api/v1/users/me                         → User
DELETE /api/v1/users/me                         → { userId }

GET    /api/v1/users/me/addresses               → Address[]
POST   /api/v1/users/me/addresses               → Address
PATCH  /api/v1/users/me/addresses/{id}          → Address
PATCH  /api/v1/users/me/addresses/{id}/default  → Address
DELETE /api/v1/users/me/addresses/{id}          → null (204)

GET    /api/v1/users/me/profile                 → BuyerValueProfile
PUT    /api/v1/users/me/profile                 → BuyerValueProfile

GET    /api/v1/users/me/seller-profile          → SellerProfile
PATCH  /api/v1/users/me/seller-profile          → SellerProfile

GET    /api/v1/users/me/seller/value-profile    → SellerValueProfile
PUT    /api/v1/users/me/seller/value-profile    → SellerValueProfile
```

Das Buyer-Werteprofil liegt auf `/users/me/profile` — nicht auf `/users/me/value-profile`.

`Address.type` ist `SHIPPING | BILLING | BOTH`. **`BOTH`** gehört zum Backend-Enum
(`domain/address/AddressType`) und wird von der Create-Route ungefiltert angenommen, ist im
Adressformular aber nicht wählbar. Gelesen werden muss der Wert trotzdem — Label:
`ADDRESS_TYPE_LABEL` in `src/lib/constants`. `AddressService` validiert alle
Adress-Antworten an der Grenze (`safeParse`, #38).

### Produkte

```
GET    /api/v1/products                              → ProductPage
       Filter: search, categoryId, minPrice, maxPrice, sort, page, size
               sellerId    (wiederholbar: ?sellerId=<uuid>&sellerId=<uuid>)
               material    (wiederholbar: ?material=leinen&material=hanf)
               color       (wiederholbar: ?color=rot&color=blau)
               variantSize (wiederholbar: ?variantSize=m&variantSize=l)
GET    /api/v1/products/facets                       → ProductFacets  — public
GET    /api/v1/sellers/facets                        → SellerFacet[]  — public
GET    /api/v1/products/{slug}                       → ProductDetail   — public
GET    /api/v1/products/by-id/{id}                   → ProductInternalDetail — ADMIN/SELLER
GET    /api/v1/products/{productId}/certificates     → Certificate[]  — public
GET    /api/v1/materials                             → Material[]     — Stammdaten für Filter + Seller-Formular
```

**Schreibrouten liegen unter `/api/v1/seller/products`** — `/api/v1/products/**` ist
GET-only (`ProductQueryController`, `ProductIdQueryController`,
`ProductFacetQueryController`, `ProductCertificatePublicController`). Ein Schreibzugriff
auf das Lese-Präfix stirbt als **405** (#219).

```
GET    /api/v1/seller/products                                  → Page<SellerProductListItem> — SELLER, alle Status
       Filter: status (DRAFT|REVIEW|ACTIVE|INACTIVE|REJECTED), page, size (Default 20, hart auf 100 geklemmt)
POST   /api/v1/seller/products                                  → ProductCommandResponse  (optional materialIds)
PATCH  /api/v1/seller/products/{id}                             → ProductCommandResponse  (materialIds: null=unverändert, []=leeren)
PATCH  /api/v1/seller/products/{id}/status                      → ProductCommandResponse
POST   /api/v1/seller/products/{productId}/images               → ProductCommandResponse
DELETE /api/v1/seller/products/{productId}/images/{imageId}     → null
PATCH  /api/v1/seller/products/{productId}/images/order         → ProductCommandResponse
POST   /api/v1/seller/products/{productId}/variants             → ProductCommandResponse
PATCH  /api/v1/seller/products/{productId}/variants/{variantId} → ProductCommandResponse
DELETE /api/v1/seller/products/{productId}/variants/{variantId} → null
```

Es gibt **kein** `DELETE /api/v1/seller/products/{id}`; `ProductService` bietet deshalb
bewusst keine `delete()`-Methode an.

`PATCH .../status` ist **kein vollwertiger Ersatz**. Die State Machine des Backends
(BE `../../elysion-marketplace-backend/docs/domain/product-lifecycle.md`)
erlaubt nur `DRAFT → REVIEW`, `REVIEW → ACTIVE`, `REVIEW → REJECTED` und `ACTIVE ⇄ INACTIVE`
— alles andere wird abgelehnt. Stilllegen per `INACTIVE` funktioniert also **nur aus
`ACTIVE`**; für ein Produkt in `DRAFT`, `REVIEW` oder `REJECTED` gibt es derzeit **keinen**
Weg, es zu löschen oder auszublenden. Genau `DRAFT` war der Zustand des entfernten
Papierkorb-Buttons — ein Ersatz braucht eine Backend-Entscheidung (`DELETE` oder ein
zusätzlicher Übergang), keinen Frontend-Workaround. Öffentlich sichtbar sind ohnehin nur
`ACTIVE`-Produkte.

Zu Pagination-Shape, `sort`-Werten und dem Unterschied `{slug}` ↔ `by-id/{id}`:
[`BACKEND_QUIRKS.md`](./BACKEND_QUIRKS.md).

#### Produktverwaltung des Verkäufers (`GET /api/v1/seller/products`, #227)

`SellerProductService` (`src/services/seller-product.service.ts`) ist die **einzige**
Leseoperation, über die ein Verkäufer seine eigenen Produkte vollständig sieht.
`ProductService.list()` ist dafür untauglich: der öffentliche Katalog ist backendseitig
hart auf `ACTIVE` gefiltert, `POST /api/v1/seller/products` legt aber in `DRAFT` an — über
den Katalog gelesen war jedes frisch angelegte Produkt unsichtbar.

Der Verkäufer kommt ausschließlich aus dem Token. Der Endpoint kennt **keinen**
`sellerId`-Parameter, und der Service reicht auch keinen durch.

> ⚠️ **Eigenes DTO, nicht das des Katalogs.** Was beim Abschreiben regelmäßig danebengeht:
>
> | Katalog (`GET /api/v1/products`)    | Seller-Liste                   | Anmerkung                        |
> | ----------------------------------- | ------------------------------ | -------------------------------- |
> | `name` + gemapptes `title`          | `name`                         | kein `title`                     |
> | `seller: { id, slug, companyName }` | —                              | **kein** `seller`-Objekt         |
> | `shortDescription` (nur Detail)     | —                              | **keine** `shortDescription`     |
> | `primaryImage: string \| null`      | `primaryImage: string \| null` | einzelne URL, kein `images[]`    |
> | immer `ACTIVE`                      | alle fünf internen Status      | `status` ist hier aussagekräftig |

**Pagination:** `size` wird serverseitig still auf `100` geklemmt — ein „alles laden"
über `size=100` verliert ab dem 101. Produkt Einträge, ohne dass es jemand merkt. Die
Produktverwaltung paginiert deshalb echt (`SELLER_PRODUCTS_PAGE_SIZE = 20`, der Default
des Backends). Sortierung ist fest auf `createdAt desc, id desc`; ein neu angelegter
Entwurf steht damit immer auf Seite 1.

**Statuszahlen der KPI-Kacheln** kommen aus `SellerProductService.countByStatus()`: je
Status eine Anfrage mit `size=1`, ausgewertet wird nur `totalItems`. Über die sichtbare
Seite zu zählen wäre falsch, sobald ein Verkäufer mehr Produkte hat, als auf eine Seite
passen. Einen Aggregat-Endpoint gibt es nicht.

**Statuswechsel in der Oberfläche** entscheidet `src/lib/seller-product-transitions.ts`.
Angeboten werden nur `DRAFT → REVIEW`, `ACTIVE → INACTIVE` und `INACTIVE → ACTIVE`.
Nicht angeboten werden:

- `REVIEW → REJECTED` — Admin-only, das Backend weist einen Verkäufer ab.
- `REVIEW → ACTIVE` — verlangt `verifiedCertificateCount >= 1`. Dieser Zähler steigt
  ausschließlich beim **Verifizieren** eines Zertifikats, und genau dabei hebt das Backend
  verknüpfte `REVIEW`-Produkte bereits selbsttätig auf `ACTIVE`. Ein Knopf dafür wäre
  entweder überflüssig oder ein garantierter `400`; `REVIEW` ist im Portal ein
  Wartezustand.

Die Bedingungen für `DRAFT → REVIEW` (Beschreibung, Kategorie Level 3, mindestens ein
Bild …) prüft nur der Server. Scheitert es, trägt die Meldung des `400` den Grund — die
Oberfläche reicht sie deshalb im Fehler-Toast durch statt sie zu verschlucken.

#### Filter & Facetten (#49/#50)

**Wiederholbare Filter** kommen aus `ProductListParams` (`sellerId`, `materials`, `colors`,
`sizes`) und werden von `buildQuery` automatisch als wiederholte Parameter serialisiert.
Innerhalb einer Achse gilt OR, zwischen den Achsen AND.

> ⚠️ Der Größen-Filter heißt in der API **`variantSize`**, nicht `size` — `size` ist bereits
> die Seitengröße der Produktliste. Im Frontend heißt das Feld `ProductListParams.sizes`;
> `ProductService.list()` übersetzt es.

**Filter-Facetten** (beide public, beide über `ProductService` + je einen Hook mit langem
`staleTime`):

- `GET /api/v1/products/facets` → `ProductFacets` = `{ colors, sizes }`, je ein Array aus
  `{ value, productCount }`. Werte sind normalisiert (getrimmt, kleingeschrieben) und werden
  **wortwörtlich** als `color`/`variantSize` zurückgeschickt — Anzeige-Labels (Kapitalisierung,
  Farb-Swatch) macht das Frontend, der Filterwert bleibt das Original.
  Hook: `useProductFacets()`.
- `GET /api/v1/sellers/facets` → `SellerFacet[]` = `{ id, slug, companyName, productCount }`,
  alphabetisch nach `companyName`, nicht paginiert. `id` ist exakt der Wert für `sellerId`.
  `slug` folgt derselben Null-Regel wie die Seller-Kurzfassung der Produktlisten (siehe
  „Verkäufer (öffentlich)"). Die Sidebar nutzt ihn bewusst **nicht** als Link: die
  Hersteller-Sektion besteht aus Filter-Checkboxen, ein Link darin wäre ein zweites
  Interaktionsziel in derselben Zeile. Hook: `useSellerFacets()`.

Beide Facetten sind **global**: Sie verengen sich nicht mit den übrigen aktiven Filtern, und
`productCount` zählt Produkte (nicht Varianten) im Status `ACTIVE`. Die UI darf deshalb nicht
suggerieren, die Zahlen seien auf die aktuelle Filterkombination bezogen.

Fällt eine der beiden Facetten aus (HTTP-Fehler oder Schemaverletzung), ist das Ergebnis
dasselbe wie bei einer leeren Facette — die Sidebar-Sektion verschwindet. Die UI muss den
Fehlerzustand deshalb explizit anzeigen (`isError` der Hooks), sonst liest der Nutzer den
Ausfall als „Filter entfernt".

### Verkäufer (öffentlich)

```
GET    /api/v1/sellers/{slug}    → PublicSellerProfile    — public
```

`data`: `{ id, slug, companyName, description, location, foundedYear,
sustainabilityScore, certifications[] }`. Die optionalen Felder kommen als `null`
und werden im Service zu `undefined` normalisiert.

- `id` ist die Seller-UUID — exakt der Wert für `GET /api/v1/products?sellerId=<id>`.
  Die Produkte stehen **nicht** im Profil.
- `slug` ist der stabile öffentliche Identifikator; er wird einmalig aus dem Firmennamen
  abgeleitet und folgt einer Umbenennung **nicht**. Lookup case-insensitiv.
- `certifications` enthält ausschließlich Zertifikate im Status `VERIFIED`, neueste
  zuerst, mit `certificateId` (nicht `id`).
- `404` für unbekannte Slugs **und** für Verkäufer, die nicht `APPROVED` sind — beide
  Fälle sind absichtlich nicht unterscheidbar.
- Frontend: `SellerService.getPublicProfile` · `usePublicSellerProfile` ·
  Seite `/producer?slug=<slug>`; `?id=<uuid>` bleibt als Fallback für bereits geteilte
  Links (ohne Profil-Lookup — es gibt keinen Read über die Seller-Id).
- Produzenten-Links entstehen ausschließlich über `producerHref()` in
  `src/lib/seller-url.ts`.

#### Seller-Kurzfassung (`seller`) in den öffentlichen Produkt-Reads

Alle **öffentlichen** Produkt-Reads — Produktliste, Storefront-Detail `/{slug}`,
`by-id/{id}` und die Empfehlungen — tragen im Backend-Vertrag dasselbe kompakte
Seller-Objekt `{ id, slug, companyName }`. Die Seller-Portal-Liste
(`GET /api/v1/seller/products`) und die Admin-Reads nutzen eigene DTOs und sind davon
**nicht** erfasst.

Im Frontend ausmodelliert ist das Objekt in `ProductService.list()`, `getBySlug()` und
— seit #232 — `getById()`. Nicht ausmodelliert ist es allein bei den Empfehlungen:
`Recommendation` kennt gar kein `seller`-Feld (die Empfehlungskacheln zeigen keinen
Hersteller). Wer den Verkäufer aus einer Empfehlung braucht, erweitert erst den Typ.

`ProductService` benennt `id` beim Mappen in `ProductSeller.userId` um; der rohe
API-Name verlässt den Service nicht.

| API                  | Frontend             | Bedeutung                                                 |
| -------------------- | -------------------- | --------------------------------------------------------- |
| `seller.id`          | `seller.userId`      | Seller-UUID, zugleich der Wert für `?sellerId=`           |
| `seller.slug`        | `seller.slug`        | Slug der Produzenten-Seite — **oder `null`**, siehe unten |
| `seller.companyName` | `seller.companyName` | Anzeigename des Herstellers                               |

> **Null-Regel:** `slug` ist `null`, sobald der Verkäufer **nicht `APPROVED`** ist.
> `GET /api/v1/sellers/{slug}` antwortet für jeden anderen Verkäufer-Status mit `404`,
> nicht unterscheidbar von einem unbekannten Slug — und der Produkt-Status hängt nicht am
> Verkäufer-Status, ein `ACTIVE`-Produkt eines `PENDING`-Verkäufers ist also öffentlich
> gelistet. Ein Link aus dessen Slug wäre garantiert tot, deshalb hält das Backend ihn
> zurück. `producerHref()` fällt dann auf `?id=<uuid>` zurück: eingeschränkte Darstellung,
> aber ein funktionierender Link.
>
> `companyName` bleibt in diesem Fall gesetzt — zurückgehalten wird nur der Link, nicht
> der Anzeigename. Ein `seller` ohne `companyName` **und** ohne `slug` hieße, dass gar kein
> Verkäuferprofil existiert; das schließt das Backend per Fremdschlüssel aus, die
> Nullability im Frontend-Typ ist rein defensiv.

Im Zod-Schema ist `slug` `nullish()` und nicht `nullable()`: Ein Backend, das das Feld noch
gar nicht kennt, darf nicht die komplette Produktliste als Schemaverletzung killen — es
landet dann im selben `?id=`-Rückfallweg. In den **Produkt-Reads** (`list`, `getBySlug`)
normalisiert `ProductService` ein fehlendes Feld beim Mappen zu `null`.

`listSellerFacets()` hat dagegen **keinen** Mapper — es reicht das geparste Schema direkt
durch. `SellerFacet.slug` ist deshalb dreiwertig: `string` (verlinkbar), `null` (Verkäufer
nicht `APPROVED`) oder `undefined` (Backend ohne das Feld). Folgenlos, solange die Sidebar
nicht verlinkt; wer den Slug dort nutzt, behandelt `null` und `undefined` gleich — genau das
tut `producerHref()` ohnehin.

#### `by-id/{id}` — eigener, schlankerer DTO

`GET /api/v1/products/by-id/{id}` ist **nicht** das Storefront-Detail unter anderer Adresse.
Das Backend antwortet mit `ProductDetailDto`:

```
id, slug, name, description, shortDescription, price, currency,
seller { id, slug, companyName }, status, materials[], createdAt, updatedAt,
matchScore, matchBreakdown
```

Nicht enthalten sind **`title`, `category`, `taxRate`, `variants` und `images`** — alles
Felder, die `ProductDetail` als optional kennt und die aus dieser Route deshalb dauerhaft
`undefined` sind. `price` ist der Basispreis; `ProductService.getById()` füllt daraus
`price` **und** `basePrice`, und leitet das vom Typ `ProductInternalDetail` geforderte
`title` aus `name` ab.

Seit #232 hat die Route ein eigenes Zod-Schema plus Mapper (vorher: roher, ungeprüfter Cast
— der Rückgabetyp versprach `seller.userId`, geliefert wurde `seller.id`). Der `order` →
`position`-Umbau der Bilder ist im Mapper vorhanden, greift aber nur, falls die Route jemals
`images` liefert. `ProductImageManager` lädt das Produkt nach und fällt deshalb immer auf
seine `initialImages` zurück.

### Kategorien

```
GET    /api/v1/categories                          → Category[]                — flache Liste, nur aktiv
GET    /api/v1/categories/tree                     → CategoryTreeNode[]        — verschachtelt, nur aktiv
GET    /api/v1/admin/categories                    → Category[]                — ADMIN, inkl. deaktivierter
GET    /api/v1/admin/categories/tree               → CategoryTreeNode[]        — ADMIN, inkl. deaktivierter
POST   /api/v1/admin/categories                    → CategoryCommandResult     — ADMIN
PATCH  /api/v1/admin/categories/{id}               → CategoryCommandResult     — ADMIN
PATCH  /api/v1/admin/categories/{id}/activate      → data: null                — ADMIN
PATCH  /api/v1/admin/categories/{id}/deactivate    → data: null                — ADMIN
```

Schreib-Operationen liegen unter `/api/v1/admin/categories`. `/api/v1/categories` ist der
öffentliche Lesepfad und kennt **nur `GET`** — ein `POST` dorthin endet als 405 (#178).

**Zwei Lese-Familien, ein Datenmodell (#226).** Die öffentlichen Reads filtern hart auf
`is_active`; nur die Admin-Reads liefern deaktivierte Kategorien mit. Wer eine Kategorie über
`/deactivate` abschaltet und danach nur den öffentlichen Read liest, verliert sie aus der
Oberfläche und kann sie nicht mehr reaktivieren — genau der Zustand, den `AdminCategories`
bis #226 hatte. `useAdminCategories` liest deshalb ausschließlich `adminTree()` + `adminList()`.

**Statusfeld ist `isActive: boolean`** — auf `Category` **und** auf `CategoryTreeNode`. Das
frühere `status: "ACTIVE" | "INACTIVE"` auf dem FE-Typ hat das Backend nie geliefert; die
`statusMap` der Admin-Oberfläche war dadurch immer leer und jede Kategorie rendete als „Aktiv".
Auf den öffentlichen Reads ist `isActive` immer `true`. Weil das Flag am Baumknoten selbst hängt,
braucht die Admin-UI keinen Join über eine zweite, separat geladene Liste mehr.

**Rückgabetyp der Schreib-Operationen:** `POST` und `PATCH .../{id}` antworten mit
`CategoryCommandResponse` — `{ id, slug, level, isActive }` — und **nicht** mit einem vollen
`Category`. `activate`/`deactivate` antworten mit `data: null`; im Service sind sie
`Promise<void>`.

**Validierung:** alle vier Reads und die beiden Command-Antworten laufen durch
`parseApiResponse` mit Zod-Schema (`category.list`, `category.tree`, `category.adminList`,
`category.adminTree`, `category.create`, `category.update`). Ein fehlendes `isActive` ist damit
ein lauter `ApiSchemaError` statt eines still angenommenen Defaults.

**Kein atomarer Snapshot zwischen Baum und flacher Liste.** `useAdminCategories` holt beide per
`Promise.all` aus **zwei** Requests. `parentId` und `description` gibt es nur in der flachen
Liste — fehlt dort der Eintrag zu einem Baumknoten, sind beide Werte unbekannt. Der Edit-Dialog
unterscheidet das jetzt von „Root": `buildEditFormState()` liefert `null` (Bearbeiten wird
blockiert), während `parentId: ""` in einem zurückgegebenen Formularzustand eine echte
Root-Kategorie meint. Vor #226 bedeutete `""` beides — und ein fehlender Flat-Eintrag hätte die
Kategorie beim Speichern still auf Root verschoben und die Beschreibung geleert.

**Pflichtfelder bei `POST` und `PATCH`:** `name`, `slug` und `order` sind bei **beiden**
Operationen zwingend. `order` ist `INTEGER NOT NULL DEFAULT 0` — ein fehlendes Feld ergibt
kein Default, sondern `400 "order is required"`; zulässig ist nur eine **ganze Zahl ≥ 0**
(`@Min(0)`, Jackson `Integer`).

**`PATCH` ist ein Voll-Ersatz, kein Sparse-Patch.** Das Backend leitet `level` bei jedem
Update neu aus `parentId` ab: fehlt `parentId`, landet die Kategorie stillschweigend auf
Root/Ebene 1. Der aktuelle Parent muss also bei jedem Update mitgeschickt werden.
`isActive` darf im `PATCH`-Body **nicht** vorkommen — Lifecycle-Wechsel laufen
ausschließlich über `activate`/`deactivate`.

Kategorien werden **deaktiviert, nicht gelöscht** — es gibt kein `DELETE`.

### Zertifikate

Drei getrennte Pfad-Familien für dieselbe Domäne:

```
# Seller (Legacy-Pfad)
POST   /api/v1/certificates                                  → Certificate
GET    /api/v1/certificates                                  → Certificate[]
GET    /api/v1/certificates/{id}                             → Certificate
PATCH  /api/v1/certificates/{id}                             → Certificate  — nur im Status PENDING
POST   /api/v1/certificates/{certId}/products/{productId}    → null
DELETE /api/v1/certificates/{certId}/products/{productId}    → null

# Seller (portal-spezifisch)
GET    /api/v1/seller/certificates                           → Certificate[]
GET    /api/v1/seller/certificates/{id}                      → Certificate
POST   /api/v1/seller/certificates                           → Certificate
POST   /api/v1/seller/certificates/{certId}/products/{productId}   → null
DELETE /api/v1/seller/certificates/{certId}/products/{productId}   → null

# Admin
GET    /api/v1/admin/certificates                            → PagedResponse<Certificate>
GET    /api/v1/admin/certificates/{id}                       → Certificate
PATCH  /api/v1/admin/certificates/{id}/verify                → Certificate
PATCH  /api/v1/admin/certificates/{id}/reject                → Certificate
```

`verify`/`reject` sind zusätzlich über `AdminService` erreichbar — identischer Endpoint.

### Warenkorb & Checkout

```
GET    /api/v1/cart                     → Cart
POST   /api/v1/cart/items               → CartItem   (nur die betroffene Zeile, 200)
PATCH  /api/v1/cart/items/{id}          → CartItem   (nur die betroffene Zeile, 200)
DELETE /api/v1/cart/items/{id}          → null       (200, kein 204)

POST   /api/v1/checkout                 → CheckoutStartResponse
POST   /api/v1/checkout/complete        → CheckoutCompleteResponse
```

Jede Cart-Route antwortet mit **`200`** — auch `POST` (kein `201`) und `DELETE`
(kein `204`). `POST`/`PATCH` liefern **nicht** den ganzen Warenkorb, sondern die
betroffene Zeile; Summen muss der Client selbst fortschreiben oder per `GET` neu lesen.

#### Anzeigedaten gehören dem Server

```
CartItem {
  id, quantity, unitPrice, currency, lineTotal, createdAt, updatedAt
  product { id, slug, name, primaryImage|null }
  variant { id, sku, options: [{ type, value }] }|null
}
```

Jede Cart-Zeile trägt Name, Slug, Bild, SKU und die lesbaren Varianten-Optionen —
auf **allen** Routen, Lesen wie Schreiben (BE `docs/api/cart.md`, „Display Data Is
Server-Owned"). Ein lokaler Produkt-Cache ist damit reine Optimierung und **keine**
Korrektheits-Voraussetzung: derselbe Warenkorb rendert auf einem zweiten Gerät oder
nach geleertem Browser-Speicher identisch (#188).

- `options` ist nie `null`, höchstens `[]`. `type`/`value` sind **freier Text**, kein
  Enum: die beiden Schreibpfade normalisieren `type` unterschiedlich (Varianten-Befehle
  in Großbuchstaben, Produktanlage wie eingegeben). Immer den gelieferten Wert rendern,
  nie auf einen exakten String verzweigen. `CartService` mappt `type` → `name`, weil die
  UI `name: value` rendert.
- `currency` ist `null`, solange der Warenkorb leer ist.
- Die Antwort von `POST` trägt die **server-seitig gemergte** Menge und die echte
  Item-`id`. Nur diese `id` akzeptieren `PATCH`/`DELETE` — eine optimistisch vergebene
  Client-`id` läuft in ein `404`.
- `PATCH` mit `quantity: 0` löscht **nicht**, sondern wird mit `400` abgelehnt; Löschen
  geht ausschließlich über `DELETE`.

**Gast-Cart-Merge beim Login:** Der Merge läuft im Login-Request und meldet nichts
zurück — keine Cart-Id, kein Zähler, und stillschweigend verworfene Gast-Zeilen
(Preis- oder Bestandsänderung, gelöschte Variante) erzeugen kein Signal. Nach
erfolgreichem Login ist ein frischer `GET /api/v1/cart` deshalb Pflicht; im Frontend
löst der Wechsel von `isAuthenticated` im `CartContext` genau das aus.

`CheckoutStartResponse.items[]` nutzt dieselben `product`/`variant`-Summaries inkl.
`options` — die Bestätigungsseite braucht dafür keine Produkt-Nachladung.
`product.primaryImage` ist auf der **Completion**-Antwort immer `null` (der eingefrorene
Bestell-Snapshot trägt kein Bild).

```
CheckoutStartResponse {
  cartId, ownershipType, totalQuantity, subtotal, currency
  items: [{ id, quantity, unitPrice, lineTotal, currency,
            product { id, slug, name, primaryImage|null },
            variant { id, sku, options: [{ type, value }] } }]
  shippingAddress, billingAddress          // je CheckoutAddressResponse
}

CheckoutCompleteResponse {
  orderId, orderNumber, orderStatus, paymentStatus, paymentMethod, completedAt
  checkout: CheckoutStartResponse          // validierter Snapshot, immer vorhanden
}
```

- Das ist die **vollständige** Form: **kein** `total`, **kein** `shippingCost`, **kein**
  `tax` — Details in [`BACKEND_QUIRKS.md`](./BACKEND_QUIRKS.md). Die Bestätigungsseite
  zeigt deshalb `subtotal` als Gesamtsumme und Versand als „Kostenlos"; das Backend bucht
  beim Anlegen der Bestellung fest `0`.
- `items[].id` wechselt die Bedeutung: beim Start ist es die **Cart**-Item-Id, beim
  Abschluss die **Order**-Item-Id. Nicht über die Id korrelieren.
- Beide Routen antworten mit `200` — auch `complete`, obwohl sie eine Bestellung anlegt.
- `CheckoutService` validiert beide Antworten an der Grenze (`safeParse`, #38).

### Bestellungen

```
GET    /api/v1/orders                          → Order[]
GET    /api/v1/orders/{id}                     → OrderDetail

GET    /api/v1/seller/orders                   → OrderGroupsPage
GET    /api/v1/seller/orders/{id}              → OrderGroupDetail
PATCH  /api/v1/seller/orders/{id}/status       → OrderGroupDetail
POST   /api/v1/seller/orders/{id}/ship         → OrderGroupDetail
POST   /api/v1/seller/orders/{id}/deliver      → OrderGroupDetail
GET    /api/v1/seller/settlements              → Settlement[]
POST   /api/v1/seller/refunds                  → RefundResult
```

Settlements liegen auf `/seller/settlements` — **nicht** unter `/seller/orders/`.
Erstattungen ebenso auf `/seller/refunds`; Vertrag siehe
[Erstattungen](#erstattungen-refunds).

#### Käufer-Reads — die Feldnamen weichen ab

`GET /api/v1/orders` liefert den kanonischen Paged-Envelope (`data.items`), **keine**
nackte Liste; `OrderService.list()` gibt daraus die Zeilen zurück.

```
OrderSummaryResponse { id, orderNumber, status, paymentStatus, total, currency, createdAt }

OrderDetailResponse {
  id, orderNumber, guestEmail, status, paymentStatus
  subtotal, shipping, tax, total, currency
  shippingAddress, billingAddress|null
  groups: [{ id, seller { id }, status, subtotal, shipping,
             shipment { trackingNumber|null, carrier|null, shippedAt, deliveredAt }|null,
             items: [{ id, quantity, unitPrice, lineTotal, currency,
                       product { id, name, slug, seller { id }, variantId, sku,
                                 options: [{ type, value }], currency } }] }]
  createdAt, updatedAt
}
```

`OrderService` bildet das auf das FE-Modell ab — die Namen sind **nicht** identisch:

| Backend              | Frontend                  |
| -------------------- | ------------------------- |
| `shipping`           | `shippingCost`            |
| `groups[].seller.id` | `groups[].sellerId`       |
| `items[].unitPrice`  | `items[].pricePerUnit`    |
| `items[].lineTotal`  | `items[].subtotal`        |
| `items[].product`    | `items[].productSnapshot` |

- Eine Bestellzeile trägt **kein** eigenes `variantId` — die Variante steckt im
  eingefrorenen Snapshot (`product.variantId`).
- `shipment.trackingNumber` darf `null` sein: das Backend liefert das Objekt auch dann,
  wenn nur `deliveredAt` gesetzt ist.
- `shipping` und `tax` sind beim Anlegen der Bestellung fest `0`.
- Unbekannte Status-Werte schießen die Antwort **nicht** ab: sie werden gemeldet
  (`errorStore`) und wie `PENDING` behandelt. Strukturelle Drift — ein fehlendes
  Preis- oder Adressfeld — schlägt dagegen laut fehl (`safeParse`, #38).

#### Versandfrist (`shippingSla`) — nur Seller-Reads

Alle Seller-Order-Reads liefern die Versandfrist als **reinen Lesezustand** (Backend #143).
Es gibt **keine** Aktion dazu: eine Überschreitung löst der Verkäufer durch Versenden auf.

```
shippingSla: {
  status:     "NOT_APPLICABLE" | "PENDING" | "BREACHED" | "MET" | "MISSED"
  deadlineAt: ISO-Timestamp | null   // eingefrorene Frist, null vor dem Zahlungseinzug
  breachedAt: ISO-Timestamp | null   // Zeitpunkt der Eskalation an den Verkäufer
}
```

- `NOT_APPLICABLE` — kein Versand geschuldet (nicht captured, storniert) → **nichts anzeigen**
- `PENDING` — Frist läuft · `BREACHED` — abgelaufen, nichts versandt
- `MET` / `MISSED` — versandt vor bzw. nach der Frist
- Das Zeitfenster (Default 48 h) ist Server-Konfiguration — im Frontend steht **keine**
  48h-Konstante mehr; die Frist wird nie clientseitig berechnet.
- Laut Backend-Vertrag ist `shippingSla` **immer vorhanden** (`docs/api/orders.md`: „always
  present and read-only"); bei Altbestellungen ohne Frist ist `deadlineAt` `null` und `status`
  entsprechend `NOT_APPLICABLE`. Dass das Feld im Zod-Schema trotzdem optional/nullable steht,
  ist reine Defensive gegen einen fehlenden Wert — **keine** Vertragsaussage. Fehlendes Feld und
  `NOT_APPLICABLE` rendern beide nichts.
- Frontend: `src/lib/shipping-sla.ts` (Formatierung), `shippingSlaLabel`/`shippingSlaColor`
  in `sellerDashboard.constants.ts`.

`OrderGroupDetail` trägt neben `total` zusätzlich `subtotal` und `shipping`.

### Zahlungen

```
POST   /api/v1/payments/create-intent   → PaymentIntent
GET    /api/v1/payments/{paymentId}     → PaymentStatusResponse
```

```
PaymentIntent         { paymentId, orderId, provider, amount, currency, status,
                        clientSecret|null, providerPaymentId|null }
PaymentStatusResponse { paymentId, orderId, provider, amount, currency, status,
                        receiptUrl, createdAt, succeededAt, failedAt }
```

- Betrag und Währung kommen laut Vertrag **immer** aus der persistierten Bestellung, nie
  aus vom Client geschickten Geldwerten.
- `provider` ist `STRIPE | PAYPAL | KLARNA | SOFORT` und wird streng geprüft.
- `clientSecret` und `providerPaymentId` sind provider-abhängig und dürfen `null` sein.
- `status` ist `PENDING | SUCCEEDED | FAILED | REFUNDED | PARTIALLY_REFUNDED` —
  **`CANCELLED` gibt es nicht** (siehe [`BACKEND_QUIRKS.md`](./BACKEND_QUIRKS.md)); die
  Zahlungsseite verzweigt weiterhin darauf, der Zweig ist aber tot. Ein unbekannter Wert
  wird gemeldet und wie `PENDING` behandelt, damit das Polling weiterläuft.
- `PaymentService` validiert beide Antworten an der Grenze (`safeParse`, #38).

### Dateien

```
POST   /api/v1/files/upload             → FileUploadResponse
GET    /api/v1/files/{id}               → FileMetadata
GET    /api/v1/files/{id}/content       → binär — direkt als <img src> nutzbar, kein Auth
POST   /api/v1/files/{id}/link          → null
POST   /api/v1/files/{id}/unlink        → null
PUT    /api/v1/files/{id}/replace       → FileUploadResponse
DELETE /api/v1/files/{id}               → null
```

### Empfehlungen

```
GET    /api/v1/recommendations?limit=   → Recommendation[]
```

### Kontakt

```
POST   /api/v1/contact                  → { id, receivedAt, forwarded }   — public, 202
```

Request: `{ name, email, subject, message }` — `name` 2–100, `subject` 3–150,
`message` 10–5000 Zeichen, `email` gültig und max. 320 Zeichen. Das Frontend sendet
den **lesbaren** Betreff (`contactSubjectLabel`), nicht den Select-Wert.

- `202 Accepted`, nicht `201`: quittiert wird die Annahme, nicht die Erledigung.
- Die Anfrage wird **immer gespeichert**. `forwarded: false` heißt nur, dass die
  Benachrichtigung ans Support-Postfach (noch) nicht rausging — kein Fehler, kein
  Neuversuch. Das UI unterscheidet beide Fälle und zeigt in beiden die
  **vollständige** Referenznummer (`id`) in einer bleibenden Quittung auf der Seite,
  nicht nur in einem Toast: bei `forwarded: false` ist sie der einzige Beleg, dass
  die Nachricht gespeichert wurde, und der Support sucht darauf per Gleichheit.
- `400` bei Validierungsfehlern und bei Steuerzeichen in `email`
  (Header-Injection-Schutz), `429` bei 5 Requests/Stunde/IP.
- **Validiert wird vorher im Client** (`validateContactForm`, `src/lib/contact.ts`)
  gegen dieselben Grenzen. Grund: der `GlobalExceptionHandler` antwortet mit dem
  wörtlichen `"Validation failed"`, und der api-client reicht die Server-Meldung bei
  `400` unverändert durch — lokalisiert wird dort nur der `429`-Fall
  (`buildRateLimitError`). Ohne Vorprüfung sähe der Besucher also eine englische
  Meldung ohne Feldbezug.
- Fällt der Request aus, bietet `Contact.tsx` den `mailto:`-Fallback aus
  `src/lib/contact.ts` an — sonst gäbe es bei einer Störung gar keinen Kontaktweg.

### Admin

Alle Endpoints erfordern die Rolle ADMIN.

```
GET    /api/v1/admin/dashboard                       → AdminDashboardData

GET    /api/v1/admin/users                           → PagedResponse<AdminUserListItem>
GET    /api/v1/admin/users/{id}                      → AdminUserDetails
POST   /api/v1/admin/users/{id}/suspend              → { userId, status }
POST   /api/v1/admin/users/{id}/unsuspend            → { userId, status }

GET    /api/v1/admin/sellers                         → PagedResponse<AdminSellerListItem>
GET    /api/v1/admin/sellers/{id}                    → AdminSellerDetail
POST   /api/v1/admin/sellers/{id}/approve            → SellerProfile
POST   /api/v1/admin/sellers/{id}/reject             → SellerProfile
POST   /api/v1/admin/sellers/{id}/suspend            → SellerProfile
PATCH  /api/v1/admin/sellers/{id}/commission         → AdminSellerDetail

GET    /api/v1/admin/orders                          → PagedResponse<AdminOrderListItem>
GET    /api/v1/admin/orders/{id}                     → AdminOrderDetail

GET    /api/v1/admin/orders/duplicates               → PagedResponse<OrderDuplicateFlag>
GET    /api/v1/admin/orders/duplicates/stats         → OrderDuplicateStats
POST   /api/v1/admin/orders/duplicates/{id}/resolve  → OrderDuplicateResolveResult

GET    /api/v1/admin/products                        → PagedResponse<AdminProductListItem>
GET    /api/v1/admin/products/{id}                   → AdminProductDetail
POST   /api/v1/admin/products/{id}/activate          → { id, status }
POST   /api/v1/admin/products/{id}/deactivate        → { id, status }

GET    /api/v1/admin/payments                        → PagedResponse<AdminPaymentItem>
GET    /api/v1/admin/refunds                         → PagedResponse<AdminRefundItem>
POST   /api/v1/admin/refunds                         → RefundResult          # Eskalation, siehe unten
GET    /api/v1/admin/settlements                     → PagedResponse<Settlement>
GET    /api/v1/admin/payouts                         → PagedResponse<AdminPayoutItem>

GET    /api/v1/admin/monitoring/errors               → PagedResponse<PersistedErrorEvent>
GET    /api/v1/admin/monitoring/errors/stats         → ErrorStats

POST   /api/v1/admin/maintenance/expire-pending-orders   → { expiredCount }
POST   /api/v1/admin/maintenance/cleanup-refresh-tokens  → { deletedCount }

POST   /api/v1/admin/imports/products                → ProductImportReport
```

**Duplicate-Order-Review** (`MANAGEMENT_DECISIONS.md` §1.8, Mechanismus 5; FE `#59`,
BE `#146`/`#234`). Ein täglicher Backend-Scan flaggt Bestellpaare mit gleicher E-Mail, gleicher
Lieferadresse und gleichen Positionen, die **weniger als 30 Minuten** auseinander liegen. Das
Flag ist eine Beobachtung, keine Entscheidung — es verlässt `OPEN` ausschließlich durch die
manuelle Admin-Entscheidung. Client: `AdminOrderDuplicateService`
(`src/services/admin-order-duplicate.service.ts`), Oberfläche `/admin/order-duplicates`.

```ts
type OrderDuplicateFlag = {
  id: string
  status: "OPEN" | "RESOLVED"
  matchSignature: string // SHA-256 über E-Mail, Lieferadresse und Positionen
  secondsApart: number // Abstand der beiden Bestellungen
  detectedAt: string
  resolution: "RELEASED" | "CANCELLED_REFUNDED" | null
  resolutionNote: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  order: OrderDuplicateOrderRef // die spätere Bestellung — der Verdacht
  duplicateOf: OrderDuplicateOrderRef // die frühere Bestellung
}

// Nur `id` ist garantiert; ohne ladbare Bestellung liefert das Backend einen Id-Stub.
type OrderDuplicateOrderRef = {
  id: string
  orderNumber: string | null
  userId: string | null
  guestEmail: string | null
  status: OrderStatus | null
  paymentStatus: string | null
  total: number | null // Dezimalwert, Cent sind ein Backend-Speicherdetail
  currency: string | null
}

type OrderDuplicateStats = { total: number; open: number; resolved: number }
```

- `GET …/duplicates` — neueste Erkennung zuerst; `status` (`OPEN`/`RESOLVED`, case-insensitiv,
  Unbekanntes → `400`), `page`, `size` (Default 25).
- `POST …/duplicates/{id}/resolve` — Body `{ resolution: "RELEASED" | "CANCELLED_REFUNDED",
note?: string }`. `note` ist optional und auf **500 Zeichen** begrenzt; der Entscheider kommt
  aus dem Token und darf **nicht** mitgeschickt werden. Fehler: `400` (Resolution fehlt/unbekannt,
  Notiz zu lang), `404` (kein Flag), `409` (bereits mit **anderer** Resolution entschieden — die
  UI lädt dann neu und zeigt die vorhandene Entscheidung, statt sie zu überschreiben).

⚠️ **Der Endpoint protokolliert die Entscheidung, er führt sie nicht aus.** Auch
`CANCELLED_REFUNDED` storniert nichts und erstattet nichts: ein Flag umspannt zwei ganze
Bestellungen, eine Erstattung hängt dagegen an einer einzelnen `order_group`. Wie sich ein Storno
über die Order-Groups einer Bestellung aufteilt, ist eine offene Domänenfrage (Backend-Issue
`#220`), und einen Admin-Storno-Endpoint gibt es deshalb noch nicht. Die Erstattung läuft
weiterhin über `POST /api/v1/admin/refunds` (Finanzbereich, FE `#56`). Die Oberfläche benennt
diese Lücke ausdrücklich, statt einen Button anzubieten, der nichts storniert.

Zwei Vertragsdetails, an denen die UI sonst falsch liest:

- **Offen vs. entschieden** ist ausschließlich an `status` (gleichwertig `resolution !== null`)
  zu erkennen. `resolutionNote` bleibt auch bei entschiedenen Flags `null`, wenn keine Begründung
  angegeben wurde, und `resolvedBy` fällt auf `null` zurück, sobald das Admin-Konto gelöscht wird
  (`ON DELETE SET NULL`) — beide Felder würden entschiedene Fälle wieder als offen zeigen.
- **Erneutes Auflösen mit derselben Resolution ist ein No-op** und gibt den unveränderten Stand
  zurück; eine dabei mitgeschickte, geänderte `note` wird **still verworfen**. Das Notizfeld
  erscheint deshalb nur bei `OPEN`, und maßgeblich ist immer die `resolutionNote` der Antwort,
  nicht der lokal getippte Text.

**Produktimport (multipart).** `POST /api/v1/admin/imports/products` erwartet
`multipart/form-data` mit `file` (CSV) und `sellerId`. Antwort ist ein zeilengenauer Report:

```ts
type ProductImportReport = {
  totalRows: number
  totalProducts: number
  created: number
  updated: number
  skipped: number
  failed: number
  rows: Array<{
    line: number // Zeilennummer wie im Tabellenprogramm (Kopfzeile = 1)
    productRef: string
    sku: string | null
    status: "CREATED" | "UPDATED" | "SKIPPED_DUPLICATE" | "ERROR"
    message: string | null
  }>
}
```

Wichtig für die UI: Der Import liefert **HTTP 200 auch dann, wenn einzelne Zeilen scheitern** —
eine abgewiesene Zeile kippt den Lauf nicht. `failed > 0` muss also aus dem Body gelesen und
angezeigt werden, nicht aus dem Statuscode. Importierte Produkte bleiben in `DRAFT`; Bilder und
der Übergang nach `REVIEW` laufen weiter über das Verkäufer-Portal. Format und Regeln:
Backend-Doku `docs/backend/product-csv-import.md`.

Monitoring-Ingestion (`POST /api/v1/monitoring/errors`, public) ist backend-seitig
offen — Spec: [`monitoring-api.md`](./monitoring-api.md).

---

## Fehlerbehandlung

```typescript
import { ApiError } from "@/src/lib/api-client"

try {
  await SomeService.doSomething()
} catch (e) {
  if (e instanceof ApiError) {
    // Feld-Fehler bei 400:
    const fields = e.body?.data?.fields
  }
}
```

Projektspezifisch ist nur zweierlei: Feld-Fehler einer 400 stehen in
`e.body.data.fields`, und eine 429 liefert `Retry-After`. Die übrigen Status-Codes
haben ihre gewohnte HTTP-Bedeutung.

Regeln: Fehler nie still schlucken, dem Nutzer nie rohe Error-Objekte oder
Stack-Traces zeigen (`sonner`-Toast mit lesbarer Meldung).

### Checkout- & Payment-Fehler (Kommunikationsprinzip §1.9)

Für den Checkout-/Payment-Pfad gilt zusätzlich das Kommunikationsprinzip aus
`MANAGEMENT_DECISIONS.md` §1.9:

- **Nur** kommunizieren, wenn dem Kunden ein Nachteil über unsere Versprechen
  hinaus entsteht. Interne/transiente Fehler **ohne** Kundennachteil werden still
  behandelt/retryt — z. B. ein Status-Check-Fehler **nach** erfolgreicher
  Stripe-Bestätigung wird als Erfolg behandelt (das Webhook finalisiert), nicht
  als Fehler gesurfacet.
- Wird kommuniziert, dann mit **Instanz** (Kunde / Elysion / Seller /
  Zahlungsdienstleister) **+ konkreter Konsequenz** (was ist passiert, was ist zu
  tun). Die Meldungen liegen zentral in
  `src/components/features/checkout/checkout-error-messages.ts` (bis die
  Backend-Fehler-Attribution aus backend#147 verfügbar ist, mappt das Frontend die
  bekannten Fälle).

---

## Auth-Flow: Seller-Registrierung

```
Registrierung als SELLER
        ↓
User.role = "BUYER" (!) — noch nicht SELLER
User.sellerProfile.status = "PENDING"
        ↓
Admin genehmigt → POST /api/v1/admin/sellers/{id}/approve
        ↓
User.role = "SELLER"
User.sellerProfile.status = "APPROVED"
```

Ein User mit `role: "BUYER"` **und** `sellerProfile.status: "PENDING"` ist ein
wartender Seller — die UI muss diesen Zustand kennen.

---

## Plattformgebühr & Auszahlungen (Stripe Connect)

> **Status:** Frontend ist gegen diese Verträge implementiert, die Backend-Endpoints
> sind offen — bis dahin scheitern die Aufrufe mit 404/501, die UI fängt das ab.
> Geschäftsregeln: [`MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md) §1.1/§1.2.

Provision: Default 15 %, pro Seller vom Admin anpassbar, auf den Warenwert pro
OrderGroup exkl. Versand. Die Stripe-Transaktionsgebühr trägt der **Seller** und wird
pro Transaktion separat ausgewiesen (§1.1).

```http
GET   /api/v1/admin/sellers/{id}            → { …, commissionRate: number }
PATCH /api/v1/admin/sellers/{id}/commission
      Body: { "commissionRate": number }    → AdminSellerDetail   # 0–100, max. 2 Nachkommastellen
```

### Seller-Auszahlungskonto

```http
GET  /api/v1/seller/payout-account
     → {
         status: "NOT_CONNECTED" | "PENDING" | "ACTIVE" | "RESTRICTED",
         chargesEnabled: boolean,
         payoutsEnabled: boolean,
         detailsSubmitted: boolean,
         requirementsDue?: string[]
       }

POST /api/v1/seller/payout-account/onboarding-link
     → { url: string }   # Stripe Account Link; Frontend leitet dorthin weiter
```

Nach Abschluss des Connect-Onboardings meldet ein Stripe-Webhook (`account.updated`)
das Konto serverseitig als `ACTIVE`. **Backend-seitig umgesetzt** (BE #110).

Was das für die UI bedeutet:

- **Den Link nicht cachen.** Stripe Account Links sind kurzlebig und einmal verwendbar. Bei
  jedem Klick auf „Konto verbinden" neu anfordern — auch wenn schon ein Konto existiert.
- **Rücksprung landet auf `/seller-dashboard?tab=settlements&onboarding=return`** (bzw.
  `…&onboarding=refresh`, wenn der Seller abbricht). Der Auszahlungen-Tab sollte den
  Kontostatus beim Betreten neu laden — direkt nach dem Rücksprung kann noch `PENDING`
  stehen, weil der Webhook Sekunden später eintrifft.
- **`ACTIVE` kommt nie synchron.** `POST …/onboarding-link` liefert nur die URL; den Status
  setzt ausschließlich der Webhook. Ein Polling nach dem Rücksprung ist der zuverlässige Weg.
- **`RESTRICTED` ist kein Fehlerzustand der UI, sondern eine Aufgabe für den Seller** —
  `requirementsDue` nennt die offenen Stripe-Anforderungen und sollte angezeigt werden. Das
  Feld fehlt in der Antwort, wenn nichts offen ist.
- `NOT_CONNECTED` ist der Normalzustand vor dem Onboarding, kein Fehler.

### Admin-Auszahlungs-Freigabe (monatlich, manuell)

```http
GET  /api/v1/admin/payouts/due
     → PayoutDueItem[] mit {
         sellerId, sellerName,
         payoutAccountStatus: "NOT_CONNECTED" | "PENDING" | "ACTIVE" | "RESTRICTED",
         settlementCount, grossAmount, feeAmount, netAmount,
         currency?, oldestEligibleAt?
       }

POST /api/v1/admin/payouts/run
     Body: { "sellerId": string }   → AdminPayoutItem
```

Setzt `payoutAccountStatus === "ACTIVE"` voraus. Settlement-Auslöser bleibt
`DELIVERED`. Bei Freigabe geht eine gebrandete Payout-Mail an den Seller.
Backend-seitig muss `createPayout()` das bestehende `ConflictException`-Stub ersetzen.

---

## Erstattungen (Refunds)

Rollen laut `MANAGEMENT_DECISIONS.md` §1.4: Der **Seller erstattet eigenständig**, ohne
Freigabe von Elysion. Der **Admin** erstattet nur als **Eskalation** (Seller reagiert nicht,
Dispute, Betrug). Der **Buyer** löst **nie** direkt eine Erstattung aus — dafür ist der
Rückgabe-Antrag vorgesehen, ein eigener Flow in einem eigenen Issue. Im Käufer-Portal darf
deshalb kein Erstattungs-Button existieren.

Vollständiger Vertrag: Backend `docs/api/refunds.md`.

```http
POST /api/v1/seller/refunds     # eigene OrderGroup, Ownership serverseitig
POST /api/v1/admin/refunds      # beliebige OrderGroup, keine Ownership-Schranke
     Body: {
       "orderGroupId": string,   # Pflicht
       "amount"?: number,        # EUR, max. 2 Nachkommastellen — WEGLASSEN = Vollerstattung
       "reason"?: string         # max. 500 Zeichen
     }
     → RefundResult
```

`GET /api/v1/admin/refunds` bleibt die Leseliste — **gleicher Pfad, andere Methode**.

### Bezugsgröße und Betrag

- Eine Erstattung bezieht sich immer auf **genau eine OrderGroup** — nie auf eine Order und
  nie auf eine einzelne Position. `paymentId` und `sellerId` schickt der Client **nicht**;
  beides löst der Server aus der Abrechnungszeile bzw. dem SecurityContext auf.
- Beträge sind **Decimal EUR** auf der Leitung (die DB führt Cent), wie bei Settlements und
  Payouts.
- **`amount` weglassen** erstattet den kompletten Restbetrag. Das Frontend setzt bei einer
  Vollerstattung bewusst **keinen** selbst berechneten Wert ein — sonst kippt eine
  zwischenzeitliche Teilerstattung den Request in eine `400`.
- Obergrenze ist der Restbetrag der Abrechnungszeile (`grossAmount − refundedAmount`). Beide
  Felder stehen in `GET /api/v1/seller/settlements` bzw. `GET /api/v1/admin/settlements` —
  das ist die einzige Quelle für „noch erstattbar". Frontend: `remainingRefundable()` und
  `validateRefundAmount()` in `src/lib/refund.ts`, gerechnet in Cent.

### `RefundResult`

```ts
type RefundResult = {
  refundId: string
  paymentId: string
  orderId: string
  orderGroupId: string
  sellerId: string
  amount: number // erstattet, EUR
  currency: string
  status: "PENDING" | "SUCCEEDED" | "FAILED"
  providerRefundId: string | null // Stripe-Refund-ID
  initiatedBy: "SELLER" | "ADMIN"
  reason: string | null
  // Wirkung auf die Abrechnungszeile — vom Server geliefert, NIE nachgerechnet:
  settlementRefundedAmount: number
  settlementRemainingRefundableAmount: number
  settlementPlatformFeeAmount: number // Provision NACH anteiliger Rückgabe
  settlementRefundFeeAmount: number // Ist-Gebührenanteil ohne Gegenumsatz
  settlementNetAmount: number // darf negativ sein
  settlementAdjustmentRequired: boolean // Zeile von der Auszahlung ausgenommen
}
```

Die Gegenbuchung passiert in derselben Transaktion: Die Provision wird anteilig
zurückgegeben, der auf den erstatteten Anteil entfallende Teil der Stripe-Gebühr bleibt beim
Seller, und die Zeile verliert ihre Auszahlungsberechtigung. Nach einer Vollerstattung ist
`settlementNetAmount` negativ (in Höhe der Ist-Gebühr) und wird mit der nächsten Auszahlung
verrechnet.

### Fehlerfälle

| Status        | Fall                                                                               | Instanz / Konsequenz                      |
| ------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| `400`         | `orderGroupId` fehlt, `amount` ≤ 0, > 2 Nachkommastellen, oder über dem Restbetrag | `CUSTOMER` / `FIX_INPUT_AND_RETRY`        |
| `403`         | fremde OrderGroup, falsche Rolle bzw. falsches Portal                              | `CUSTOMER` / `ACCESS_DENIED`              |
| `404`         | keine Abrechnungszeile zur OrderGroup                                              | `CUSTOMER` / `RESOURCE_UNAVAILABLE`       |
| `409`         | bereits vollständig erstattet, oder Zahlung nicht erstattbar                       | `CUSTOMER` / `REVIEW_AND_RETRY`           |
| `502` / `503` | Stripe antwortet nicht bzw. lehnt ab                                               | `PSP` / `PAYMENT_NOT_CHARGED_RETRY_LATER` |

Es gibt **keinen Pfad, der zweimal beim PSP bucht**: Die Obergrenze ist immer der Restbetrag,
eine zweite Vollerstattung findet nichts Offenes mehr (`409`), ein zu hoher Teilbetrag wird
mit `400` abgewiesen. Die Meldungen mappt `refundErrorMessage()` in `src/lib/refund.ts` nach
§1.9 (Instanz + Konsequenz) — ausgewertet wird der Statuscode, nie der Message-String.

### Was der Vertrag **nicht** hergibt

- **Positionsweise Erstattung.** Der Endpoint kennt nur einen Betrag auf der OrderGroup,
  keine `orderItemId`. Eine Auswahl einzelner Positionen wäre reine Frontend-Fiktion.
- **Grund und Auslöser in der Leseliste.** `GET /api/v1/admin/refunds` liefert weder `reason`
  noch `initiatedBy` — beides steht nur in der Antwort auf die Auslösung und im
  Prüfprotokoll (`admin_audit_log`).
- **Durchsetzung des 14-Tage-Widerrufsfensters.** Organisatorisch geregelt, im Code nicht
  erzwungen — kein Frontend-Gate.
