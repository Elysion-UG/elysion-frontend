# Modul 02: Product Management
## Spezifikation & Requirements (KORRIGIERT)

**Verantwortlichkeit:** Produktverwaltung, Kategorien, Varianten, Shops, Lagerbestand  
**Abhängigkeiten:** Modul 01 (Authentication)  
**Priorität:** CRITICAL

---

## 1. Überblick

Dieses Modul verwaltet alle Produkte der Plattform. Verkäufer können Produkte erstellen, bearbeiten und organisieren. Käufer können Produkte suchen, filtern und ansehen.

### Was das Modul macht:

- **Produkte verwalten** - Verkäufer erstellen/bearbeiten/löschen Produkte
- **Varianten** - Kombinierte Varianten (Größe M + Farbe Rot)
- **Kategorien** - 3-Ebenen-Struktur mit technischer Validierung
- **Shops** - Ein Verkäufer kann mehrere Shops haben
- **Lagerbestand** - Atomare Reservierung (Race-Condition-sicher)
- **Suche & Filter** - PostgreSQL Full-Text Search
- **Produktbilder** - Upload & Verwaltung
- **SEO-URLs** - Slug-Historie mit 301 Redirects

### Schnittstellen zu anderen Modulen:

**Benötigt:**
- Modul 01: Authentifizierung
- Modul 08: File-Upload für Produktbilder

**Wird genutzt von:**
- Modul 03: Zertifikate werden Produkten zugeordnet
- Modul 04: Berechnet Match-Score für Produkte
- Modul 05: Warenkorb greift auf Produkte zu
- Modul 06: Bestellungen referenzieren Produkte

---

## 2. Datenmodell (KORRIGIERT)

### 2.1 Product (Hauptentität)

| Feld | Typ | Pflicht | Einzigartig | Bedeutung |
|------|-----|---------|-------------|-----------|
| **id** | UUID | Ja | Ja | Primärschlüssel |
| **sellerId** | UUID | Ja | Nein | Verkäufer |
| **shopId** | UUID | Ja | Nein | Shop |
| **categoryId** | UUID | Ja | Nein | Kategorie (MUSS Level 3 sein) |
| **name** | String (200) | Ja | Nein | Produktname |
| **slug** | String | Ja | Ja | **Aktueller** SEO-Slug |
| **description** | Text | Ja | Nein | Ausführliche Beschreibung |
| **shortDesc** | String (200) | Nein | Nein | Kurzbeschreibung |
| **basePrice** | Decimal (10,2) | Ja | Nein | Basispreis (Varianten können Aufpreis haben) |
| **taxRate** | Decimal (4,2) | Ja | Nein | MwSt-Satz (19.00) |
| **weight** | Decimal (8,2) | Nein | Nein | Gewicht in kg |
| **status** | Enum | Ja | Nein | DRAFT / REVIEW / ACTIVE / INACTIVE / REJECTED |
| **verifiedCertificateCount** | Integer | Ja | Nein | Anzahl verifizierter Zertifikate (für Status-Logik) |
| **views** | Integer | Ja | Nein | **Wird asynchron aktualisiert** (Redis → DB) |
| **salesCount** | Integer | Ja | Nein | Verkaufte Stückzahl |
| **searchVector** | tsvector | Ja | Nein | **PostgreSQL Full-Text Search** (Generated Column) |
| **createdAt** | Timestamp | Ja | Nein | |
| **updatedAt** | Timestamp | Ja | Nein | |

**Status-Bedeutung (NEU - mit State Machine):**

```
DRAFT      = Erstellt, nicht vollständig
REVIEW     = Zur Prüfung eingereicht (alle Daten vorhanden)
ACTIVE     = Öffentlich sichtbar & kaufbar
INACTIVE   = Pausiert (vom Verkäufer oder System)
REJECTED   = Von Admin abgelehnt
```

**⚠️ KRITISCH: Status-Übergänge (State Machine)**

```sql
-- Erlaubte Übergänge
DRAFT     → REVIEW     (wenn: Bilder vorhanden)
REVIEW    → ACTIVE     (wenn: verifiedCertificateCount >= 1)
REVIEW    → REJECTED   (von Admin)
ACTIVE    → INACTIVE   (vom Verkäufer oder wenn Zertifikat abläuft)
INACTIVE  → ACTIVE     (vom Verkäufer, wenn Zertifikat noch gültig)

-- ALLE ANDEREN Übergänge sind VERBOTEN
-- Beispiel: DRAFT → ACTIVE ist NICHT möglich (muss über REVIEW)
```

**Status-Validierung:**

```
Beim Status-Wechsel zu ACTIVE:
  - verifiedCertificateCount MUSS >= 1 sein
  - Sonst: Fehler werfen

Beim Status-Wechsel zu REVIEW:
  - Mind. 1 Bild vorhanden
  - Alle Pflichtfelder ausgefüllt
```

---

### 2.2 ProductSlugHistory (NEU - für SEO)

**Warum?** Alte URLs dürfen nicht kaputt gehen. Wenn Produktname ändert → neuer Slug, aber alter Slug muss mit 301 Redirect funktionieren.

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **productId** | UUID | Ja | Zu welchem Produkt |
| **slug** | String | Ja | Alter Slug |
| **createdAt** | Timestamp | Ja | Wann war dieser Slug aktiv |

**Beispiel:**

```
Produkt: "Bio-Baumwolle T-Shirt"
  slug = "bio-baumwolle-tshirt"

Verkäufer ändert Name zu: "Premium Bio-Baumwolle T-Shirt"

System macht:
  1. Speichere in product_slug_history:
     productId = "product-123"
     slug = "bio-baumwolle-tshirt"
     
  2. Generiere neuen Slug:
     product.slug = "premium-bio-baumwolle-tshirt"

Wenn User aufruft: /products/bio-baumwolle-tshirt
  → System findet in product_slug_history
  → 301 Redirect zu /products/premium-bio-baumwolle-tshirt
```

**Index:**

```sql
-- UNIQUE: Alte Slugs können NIEMALS wieder verwendet werden (verhindert URL-Konflikte)
CREATE UNIQUE INDEX idx_product_slug_history_slug ON product_slug_history(slug);
CREATE INDEX idx_product_slug_history_product ON product_slug_history(productId);
```

---

### 2.3 ProductImage (unverändert)

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **productId** | UUID | Ja | Zu welchem Produkt |
| **url** | String | Ja | Bild-URL |
| **altText** | String | Nein | Alt-Text (SEO) |
| **order** | Integer | Ja | Sortierung (0 = Hauptbild) |
| **createdAt** | Timestamp | Ja | |

**Regeln:** Min. 1, Max. 10 Bilder pro Produkt

---

### 2.4 Variant (NEU STRUKTURIERT - kombinierte Varianten)

**Warum neu?** Altes Modell erlaubt keine Kombinationen (Größe M + Farbe Rot).

Eine Variante ist eine **konkrete kaufbare Einheit** (z.B. "T-Shirt, Größe M, Farbe Rot").

| Feld | Typ | Pflicht | Einzigartig | Bedeutung |
|------|-----|---------|-------------|-----------|
| **id** | UUID | Ja | Ja | Primärschlüssel |
| **productId** | UUID | Ja | Nein | Zu welchem Produkt |
| **sku** | String | Ja | **JA (UNIQUE!)** | Stock Keeping Unit - EINDEUTIG |
| **price** | Decimal (10,2) | Nein | Nein | Aufpreis (wenn NULL, gilt basePrice) |
| **stock** | Integer | Ja | Nein | Verfügbarer Lagerbestand |
| **reserved** | Integer | Ja | Nein | Reservierte Menge (Warenkörbe) |
| **createdAt** | Timestamp | Ja | Nein | |

**⚠️ KRITISCH: SKU ist UNIQUE über ALLE Varianten**

```sql
CREATE UNIQUE INDEX idx_variant_sku ON variant(sku);
```

**⚠️ KRITISCH: `available` wird NICHT gespeichert**

```
Verfügbarkeit wird IMMER berechnet:
  available = stock - reserved

Warum nicht speichern?
  - Kann inkonsistent werden
  - Bei jedem Warenkorb-Update müsste man es aktualisieren
  - Fehleranfällig
```

**Gesamtpreis berechnen:**

```
Wenn variant.price IS NULL:
  → Gesamtpreis = product.basePrice

Wenn variant.price IS NOT NULL:
  → Gesamtpreis = product.basePrice + variant.price
```

---

### 2.5 VariantOption (NEU - für kombinierte Varianten)

Diese Tabelle speichert die **Eigenschaften** einer Variante.

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **variantId** | UUID | Ja | Zu welcher Variante |
| **optionType** | String | Ja | "SIZE", "COLOR", "MATERIAL", etc. |
| **optionValue** | String | Ja | "M", "Rot", "Bio-Baumwolle", etc. |

**Beispiel:**

```
Produkt: "T-Shirt" (basePrice = 29.99 EUR)

Variante 1:
  id: "var-1"
  sku: "SHIRT-M-RED"
  price: NULL (nutzt basePrice)
  stock: 10
  reserved: 2
  
  Optionen:
    - optionType: "SIZE",  optionValue: "M"
    - optionType: "COLOR", optionValue: "Rot"

Variante 2:
  id: "var-2"
  sku: "SHIRT-L-BLUE"
  price: 2.00 (Aufpreis für L!)
  stock: 5
  reserved: 0
  
  Optionen:
    - optionType: "SIZE",  optionValue: "L"
    - optionType: "COLOR", optionValue: "Blau"

Variante 3:
  id: "var-3"
  sku: "SHIRT-S-RED"
  price: NULL
  stock: 0
  reserved: 0
  
  Optionen:
    - optionType: "SIZE",  optionValue: "S"
    - optionType: "COLOR", optionValue: "Rot"
```

**Frontend-Darstellung:**

```
Dropdown 1: Größe
  [ ] S (Ausverkauft)
  [x] M (Auf Lager)
  [ ] L (Auf Lager)

Dropdown 2: Farbe
  [ ] Rot
  [ ] Blau

Wenn User wählt: M + Rot
  → System findet Variante mit:
    WHERE optionType='SIZE' AND optionValue='M'
    AND optionType='COLOR' AND optionValue='Rot'
  → variantId = "var-1"
  → Preis: 29.99 EUR
  → Verfügbar: 8 (stock 10 - reserved 2)
```

**Indizes:**

```sql
CREATE INDEX idx_variant_option_variant ON variant_option(variantId);
CREATE INDEX idx_variant_option_type_value ON variant_option(optionType, optionValue);
```

---

### 2.6 Category (mit Level-Erzwingung)

| Feld | Typ | Pflicht | Einzigartig | Bedeutung |
|------|-----|---------|-------------|-----------|
| **id** | UUID | Ja | Ja | Primärschlüssel |
| **name** | String | Ja | Nein | Kategoriename |
| **slug** | String | Ja | Ja | SEO-URL |
| **parentId** | UUID | Nein | Nein | Eltern-Kategorie (NULL = Root) |
| **level** | Integer | Ja | Nein | **1, 2 oder 3** (technisch erzwungen!) |
| **description** | Text | Nein | Nein | Beschreibung |
| **order** | Integer | Ja | Nein | Sortierreihenfolge |
| **isActive** | Boolean | Ja | Nein | Aktiv? |

**⚠️ KRITISCH: Level wird technisch erzwungen**

```
Level 1: parentId = NULL
Level 2: parentId = (Level 1 Kategorie)
Level 3: parentId = (Level 2 Kategorie)

Beim Erstellen einer Kategorie:
  if (parentId IS NULL):
    level = 1
  else:
    parentLevel = SELECT level FROM categories WHERE id = parentId
    level = parentLevel + 1
    
    if (level > 3):
      throw Error("Max. 3 Ebenen erlaubt")

Beim Speichern eines Produkts:
  category = SELECT level FROM categories WHERE id = product.categoryId
  
  if (category.level != 3):
    throw Error("Produkte nur auf Level 3 erlaubt")
```

**Index:**

```sql
CREATE INDEX idx_category_parent_level ON categories(parentId, level);
```

---

### 2.7 Shop (unverändert)

| Feld | Typ | Pflicht | Einzigartig | Bedeutung |
|------|-----|---------|-------------|-----------|
| **id** | UUID | Ja | Ja | Primärschlüssel |
| **sellerId** | UUID | Ja | Nein | Verkäufer |
| **name** | String | Ja | Nein | Shop-Name |
| **slug** | String | Ja | Ja | SEO-URL |
| **description** | Text | Nein | Nein | Beschreibung |
| **logo** | String | Nein | Nein | Logo-URL |
| **isActive** | Boolean | Ja | Nein | Aktiv? |
| **createdAt** | Timestamp | Ja | Nein | |

---

### 2.8 ProductSearchView (NEU - Materialized View für Performance)

**Warum?** Produktliste benötigt viele Joins → langsam. Materialized View vorberechnet.

```sql
CREATE MATERIALIZED VIEW product_search_view AS
SELECT 
  p.id AS product_id,
  p.name,
  p.slug,
  p.basePrice AS price_min,
  p.status,
  p.views,
  p.salesCount,
  p.createdAt,
  
  -- Hauptbild
  (SELECT url FROM product_images 
   WHERE productId = p.id AND "order" = 0 
   LIMIT 1) AS main_image_url,
  
  -- Shop
  s.name AS shop_name,
  s.slug AS shop_slug,
  
  -- Kategorie
  c.name AS category_name,
  c.slug AS category_slug,
  
  -- Verfügbarkeit (berechnet)
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM variant v 
      WHERE v.productId = p.id 
      AND (v.stock - v.reserved) > 0
    ) THEN 'IN_STOCK'
    ELSE 'OUT_OF_STOCK'
  END AS availability

FROM products p
JOIN shops s ON p.shopId = s.id
JOIN categories c ON p.categoryId = c.id
WHERE p.status = 'ACTIVE';

-- Indizes auf View
CREATE INDEX idx_psv_category ON product_search_view(category_slug);
CREATE INDEX idx_psv_shop ON product_search_view(shop_slug);
CREATE INDEX idx_psv_price ON product_search_view(price_min);
CREATE INDEX idx_psv_created ON product_search_view(createdAt DESC);
```

**Refresh:**

```sql
-- Manuell nach Produkt-Änderungen
REFRESH MATERIALIZED VIEW CONCURRENTLY product_search_view;

-- Oder: Cron-Job alle 5 Minuten
```

**Verwendung:**

```sql
-- Produktliste
SELECT * FROM product_search_view
WHERE category_slug = 'oberteile'
ORDER BY createdAt DESC
LIMIT 20;

-- Schneller als:
SELECT p.*, s.name, c.name, ... 
FROM products p
JOIN shops s ...
JOIN categories c ...
WHERE ...
```

---

### 2.9 ExternalInventoryConnection (für später)

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **sellerId** | UUID | Ja | Verkäufer |
| **systemType** | Enum | Ja | SHOPIFY / SAP / WOOCOMMERCE / CUSTOM |
| **apiEndpoint** | String | Ja | API-URL |
| **authType** | Enum | Ja | API_KEY / OAUTH / BASIC_AUTH |
| **credentialsEncrypted** | Text | Ja | **VERSCHLÜSSELT** (AES-256 mit ENV-Key) |
| **isActive** | Boolean | Ja | Aktiv? |
| **syncInterval** | Integer | Ja | Sync-Intervall in Minuten |
| **lastSyncAt** | Timestamp | Nein | Letzter Sync |
| **lastSyncStatus** | Enum | Nein | SUCCESS / FAILED |
| **createdAt** | Timestamp | Ja | |

**⚠️ KRITISCH: Credentials-Sicherheit**

```
Beim Speichern:
  credentials = encrypt(JSON.stringify(apiData), process.env.ENCRYPTION_KEY)
  
Beim Lesen:
  apiData = JSON.parse(decrypt(credentials, process.env.ENCRYPTION_KEY))

NIEMALS in API-Response:
  - credentials dürfen nie zurückgegeben werden
  - Auch nicht an Verkäufer selbst
  - Nur beim Bearbeiten neu eingeben

Key-Rotation:
  - ENV-Key regelmäßig wechseln
  - Alle credentials neu verschlüsseln
```

**Rate-Limit pro Seller:**

```sql
CREATE TABLE external_api_rate_limit (
  sellerId UUID,
  requestCount INTEGER,
  windowStart TIMESTAMP
);

-- Max. 100 Requests pro Stunde pro Seller
```

---

## 3. API-Endpoints

### 3.1 GET /products (Produktliste)

**Query-Parameter:**

```
?search=bio baumwolle
&category=oberteile (slug!)
&shop=oeko-fashion (slug!)
&minPrice=10
&maxPrice=100
&sort=price_asc | price_desc | newest | popular
&page=1
&limit=20
```

**Backend nutzt:**

```sql
-- NICHT die products-Tabelle direkt!
-- Sondern die Materialized View:

SELECT * FROM product_search_view
WHERE category_slug = 'oberteile'
AND price_min BETWEEN 10 AND 100
AND to_tsvector('german', name) @@ to_tsquery('german', 'bio & baumwolle')
ORDER BY price_min ASC
LIMIT 20 OFFSET 0;
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": "product-123",
        "name": "Bio-Baumwolle T-Shirt",
        "slug": "bio-baumwolle-tshirt",
        "shortDesc": "100% Bio",
        "price": 29.99,
        "mainImage": "https://cdn.../image.jpg",
        "shop": {
          "name": "Öko-Fashion",
          "slug": "oeko-fashion"
        },
        "category": {
          "name": "Oberteile",
          "slug": "oberteile"
        },
        "availability": "IN_STOCK"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### 3.2 GET /products/:slug (Produktdetails)

**Wichtig: Slug-Historie prüfen!**

```
1. SELECT * FROM products WHERE slug = :slug

2. Wenn nicht gefunden:
   SELECT productId FROM product_slug_history WHERE slug = :slug
   
   Wenn gefunden:
     aktueller_slug = SELECT slug FROM products WHERE id = productId
     → 301 Redirect zu /products/{aktueller_slug}
   
3. Wenn immer noch nicht gefunden:
   → 404 Not Found
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "product-123",
    "name": "Bio-Baumwolle T-Shirt",
    "slug": "bio-baumwolle-tshirt",
    "description": "Ausführliche Beschreibung...",
    "basePrice": 29.99,
    "taxRate": 19.00,
    "status": "ACTIVE",
    "images": [
      {
        "url": "https://...",
        "altText": "Vorderseite",
        "order": 0
      }
    ],
    "variants": [
      {
        "id": "var-1",
        "sku": "SHIRT-M-RED",
        "price": null,
        "stock": 10,
        "reserved": 2,
        "available": 8,
        "options": [
          { "type": "SIZE", "value": "M" },
          { "type": "COLOR", "value": "Rot" }
        ]
      },
      {
        "id": "var-2",
        "sku": "SHIRT-L-BLUE",
        "price": 2.00,
        "stock": 5,
        "reserved": 0,
        "available": 5,
        "options": [
          { "type": "SIZE", "value": "L" },
          { "type": "COLOR", "value": "Blau" }
        ]
      }
    ],
    "shop": { ... },
    "category": { ... },
    "views": 1247,
    "salesCount": 52
  }
}
```

**View-Zähler (asynchron):**

```
NICHT:
  UPDATE products SET views = views + 1 WHERE id = :id

SONDERN:
  Redis: INCR product:views:{productId}
  
Cron-Job (alle 10 Min):
  keys = Redis: KEYS product:views:*
  for key in keys:
    productId = extract(key)
    count = Redis: GET key
    DB: UPDATE products SET views = views + count WHERE id = productId
    Redis: DEL key
```

---

### 3.3 POST /products (Produkt erstellen)

**Request:**

```json
{
  "shopId": "shop-123",
  "categoryId": "cat-456",
  "name": "Bio-T-Shirt",
  "description": "...",
  "basePrice": 29.99,
  "taxRate": 19.00,
  "variants": [
    {
      "sku": "SHIRT-M-RED",
      "stock": 10,
      "options": [
        { "type": "SIZE", "value": "M" },
        { "type": "COLOR", "value": "Rot" }
      ]
    },
    {
      "sku": "SHIRT-L-BLUE",
      "price": 2.00,
      "stock": 5,
      "options": [
        { "type": "SIZE", "value": "L" },
        { "type": "COLOR", "value": "Blau" }
      ]
    }
  ]
}
```

**Validierung:**

```
1. Kategorie-Level prüfen:
   category = SELECT level FROM categories WHERE id = :categoryId
   if (category.level != 3):
     throw Error("Nur Level-3-Kategorien erlaubt")

2. SKU Unique prüfen:
   for variant in variants:
     exists = SELECT 1 FROM variant WHERE sku = variant.sku
     if (exists):
       throw Error("SKU bereits vergeben: {sku}")

3. Status setzen:
   status = 'DRAFT'
   verifiedCertificateCount = 0
```

**Response:**

```json
{
  "status": "success",
  "message": "Produkt erstellt (Status: DRAFT). Bitte Bilder hochladen und Zertifikat verknüpfen.",
  "data": {
    "id": "product-123",
    "slug": "bio-t-shirt",
    "status": "DRAFT"
  }
}
```

---

### 3.4 PATCH /products/:id (Produkt bearbeiten)

**Request:**

```json
{
  "name": "Premium Bio-T-Shirt"
}
```

**Was passiert bei Name-Änderung:**

```
1. Alter Slug speichern:
   oldSlug = SELECT slug FROM products WHERE id = :id
   
   INSERT INTO product_slug_history (productId, slug, createdAt)
   VALUES (:id, oldSlug, NOW())

2. Neuer Slug generieren:
   newSlug = generateSlug("Premium Bio-T-Shirt")
   
   UPDATE products 
   SET name = 'Premium Bio-T-Shirt',
       slug = newSlug
   WHERE id = :id
```

---

### 3.5 PATCH /products/:id/status (Status ändern)

**Request:**

```json
{
  "status": "REVIEW"
}
```

**Validierung (State Machine):**

```
currentStatus = SELECT status FROM products WHERE id = :id

Erlaubte Übergänge:
  DRAFT → REVIEW:
    - Mind. 1 Bild vorhanden
  
  REVIEW → ACTIVE:
    - verifiedCertificateCount >= 1
    - Sonst: 400 Bad Request "Kein verifiziertes Zertifikat"
  
  REVIEW → REJECTED:
    - Nur Admin darf das
  
  ACTIVE → INACTIVE:
    - Jederzeit erlaubt
  
  INACTIVE → ACTIVE:
    - verifiedCertificateCount >= 1 prüfen

Alle anderen:
  → 400 Bad Request "Statuswechsel nicht erlaubt"
```

---

### 3.6 POST /cart/reserve (Reservierung - aus Modul 05)

**⚠️ KRITISCH: Atomare Reservierung**

**Request:**

```json
{
  "variantId": "var-1",
  "quantity": 2
}
```

**Backend (atomar!):**

```sql
-- EINE Transaktion, KEIN separates SELECT vorher!

BEGIN TRANSACTION;

UPDATE variant
SET reserved = reserved + 2
WHERE id = 'var-1'
AND (stock - reserved) >= 2;

-- Prüfen ob Update erfolgreich
IF (rowsAffected == 0):
  ROLLBACK;
  throw Error("Nicht genug verfügbar");
ELSE:
  COMMIT;
  return Success;
```

**Warum atomar?**

```
Falsch (Race Condition):
  1. SELECT stock, reserved FROM variant WHERE id = 'var-1'
  2. Berechne: available = stock - reserved
  3. IF (available >= 2):
       UPDATE variant SET reserved = reserved + 2

Problem:
  User A und B gleichzeitig:
    stock = 5, reserved = 0
    
  User A SELECT: available = 5 ✓
  User B SELECT: available = 5 ✓
  
  User A UPDATE: reserved = 2
  User B UPDATE: reserved = 4 (überschreibt!)
  
  → stock = 5, reserved = 4, aber beide haben reserviert!
  → Overselling!

Richtig (atomar):
  UPDATE mit Bedingung in EINER Query
  → Datenbank garantiert Konsistenz
```

---

## 4. Business-Logik

### 4.1 Slug-Generierung mit Historie

**Algorithmus:**

```
1. Name → Lowercase
2. Umlaute: ä→ae, ö→oe, ü→ue, ß→ss
3. Nur: a-z, 0-9, -
4. Leerzeichen → -
5. Doppel-Bindestriche → -
6. Start/Ende: - entfernen

Beispiel:
  "Premium Öko-T-Shirt!"
  → "premium oeko-t-shirt"

Duplikat-Check:
  exists = SELECT 1 FROM products WHERE slug = 'premium-oeko-t-shirt'
  if (exists):
    slug = 'premium-oeko-t-shirt-2'
```

**Bei Name-Änderung:**

```
1. Speichere alten Slug in product_slug_history
2. Generiere neuen Slug
3. Update product.slug
```

**Beim Abrufen:**

```
1. SELECT * FROM products WHERE slug = :slug
2. Falls nicht gefunden:
     SELECT productId FROM product_slug_history WHERE slug = :slug
     → 301 Redirect zu neuem Slug
```

---

### 4.2 Status-Maschine

**Implementierung:**

```
allowedTransitions = {
  'DRAFT': ['REVIEW'],
  'REVIEW': ['ACTIVE', 'REJECTED'],
  'ACTIVE': ['INACTIVE'],
  'INACTIVE': ['ACTIVE'],
  'REJECTED': []
}

function changeStatus(productId, newStatus):
  product = SELECT * FROM products WHERE id = productId
  
  if (newStatus not in allowedTransitions[product.status]):
    throw Error("Status-Wechsel nicht erlaubt")
  
  # Zusätzliche Validierung
  if (newStatus == 'ACTIVE'):
    if (product.verifiedCertificateCount < 1):
      throw Error("Kein verifiziertes Zertifikat")
  
  if (newStatus == 'REVIEW'):
    imageCount = SELECT COUNT(*) FROM product_images WHERE productId = productId
    if (imageCount < 1):
      throw Error("Mind. 1 Bild erforderlich")
  
  UPDATE products SET status = newStatus WHERE id = productId
```

---

### 4.3 Zertifikats-Kopplung

**Beim Zertifikat-Verifizieren (Modul 03):**

```
Wenn Admin Zertifikat verifiziert:
  1. UPDATE certificate SET status = 'VERIFIED'
  
  2. Für alle verknüpften Produkte:
     UPDATE products 
     SET verifiedCertificateCount = verifiedCertificateCount + 1
     WHERE id IN (
       SELECT productId FROM product_certificates 
       WHERE certificateId = :certId
     )
  
  3. Für Produkte im Status REVIEW:
     UPDATE products
     SET status = 'ACTIVE'
     WHERE status = 'REVIEW'
     AND verifiedCertificateCount >= 1

Wenn Zertifikat abläuft:
  1. UPDATE certificate SET status = 'EXPIRED'
  
  2. UPDATE products
     SET verifiedCertificateCount = verifiedCertificateCount - 1
     WHERE id IN (...)
  
  3. UPDATE products
     SET status = 'INACTIVE'
     WHERE status = 'ACTIVE'
     AND verifiedCertificateCount < 1
```

---

### 4.4 PostgreSQL Full-Text Search

**Setup:**

```sql
-- Generated Column für Search
ALTER TABLE products
ADD COLUMN searchVector tsvector
GENERATED ALWAYS AS (
  to_tsvector('german', 
    coalesce(name, '') || ' ' || coalesce(description, '')
  )
) STORED;

-- GIN Index für schnelle Suche
CREATE INDEX idx_products_search 
ON products USING GIN(searchVector);
```

**Query:**

```sql
SELECT * FROM products
WHERE searchVector @@ to_tsquery('german', 'bio & baumwolle')
ORDER BY ts_rank(searchVector, to_tsquery('german', 'bio & baumwolle')) DESC;
```

**Performance:**

```
LIKE-Query (falsch):
  WHERE name LIKE '%bio%' OR description LIKE '%baumwolle%'
  → Scannt alle Zeilen: 2000ms

Full-Text (richtig):
  WHERE searchVector @@ to_tsquery(...)
  → Nutzt GIN Index: 50ms

40× schneller!
```

---

## 5. Performance & Skalierung

### 5.1 Datenbank-Indizes (ALLE ERSTELLEN!)

```sql
-- Products
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_status ON products(categoryId, status);
CREATE INDEX idx_products_shop_status ON products(shopId, status);
CREATE INDEX idx_products_seller_status ON products(sellerId, status);
CREATE INDEX idx_products_created ON products(createdAt DESC);
CREATE INDEX idx_products_price ON products(basePrice);
CREATE INDEX idx_products_sales ON products(salesCount DESC);
CREATE INDEX idx_products_search ON products USING GIN(searchVector);

-- Variants
CREATE UNIQUE INDEX idx_variant_sku ON variant(sku);
CREATE INDEX idx_variant_product ON variant(productId);
CREATE INDEX idx_variant_available ON variant((stock - reserved));

-- Variant Options
CREATE INDEX idx_variant_option_variant ON variant_option(variantId);
CREATE INDEX idx_variant_option_type_value ON variant_option(optionType, optionValue);

-- Product Images
CREATE INDEX idx_product_images_product ON product_images(productId, "order");

-- Slug History
CREATE INDEX idx_product_slug_history_slug ON product_slug_history(slug);
CREATE INDEX idx_product_slug_history_product ON product_slug_history(productId);

-- Categories
CREATE INDEX idx_category_parent_level ON categories(parentId, level);
CREATE INDEX idx_category_slug ON categories(slug);
```

### 5.2 Caching

```
Redis-Keys:
  - "categories:tree" → 1h
  - "product:detail:{slug}" → 10 Min
  - "product:views:{id}" → Bis Flush
  - "products:list:{params}" → 5 Min
```

### 5.3 Materialized View Refresh

```sql
-- Cronjob alle 5 Minuten
REFRESH MATERIALIZED VIEW CONCURRENTLY product_search_view;
```

---

## 6. Sicherheit

### 6.1 Externe API-Credentials

```
Verschlüsselung:
  - AES-256
  - Key in ENV-Variable
  - Nie im Code hardcoden

Key-Rotation:
  - Alle 90 Tage Key wechseln
  - Alle credentials neu verschlüsseln

API-Response:
  - credentials NIEMALS ausgeben
  - Auch nicht an eigenen Verkäufer
```

### 6.2 Rate-Limiting

```
Pro Seller:
  - Max. 100 externe API-Requests/Stunde
  - Max. 10 Produkt-Erstellungen/Stunde
```

---

**Der Entwickler entscheidet:**
- Backend-Technologie & Framework
- Datenbank (PostgreSQL stark empfohlen für Full-Text Search)
- Caching-Tool (Redis empfohlen)
- Encryption-Library
- Projektstruktur
