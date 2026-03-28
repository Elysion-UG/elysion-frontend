> **ARCHIVIERT** — Dieses Dokument stammt aus der Planungsphase (Februar 2026) und ist veraltet: mehrere Module werden als [TODO] geführt, obwohl sie längst implementiert sind. Aktuelle Dokumentation: [README.md](../../README.md) · [CLAUDE.md](../../CLAUDE.md)

# AI CONTEXT FILE

## Nachhaltigkeits-Zertifikat-Plattform - Komplette System-Logik

**Zweck:** Kontext für andere AI-Chat-Sessions  
**Letzte Aktualisierung:** 02.03.2026  
**Status:** Module 01-05 fertig dokumentiert

---

## SYSTEM-ÜBERBLICK

**Plattform:** Marketplace für nachhaltige Produkte mit Zertifikats-Verifizierung und Werte-Matching

**Kern-Konzepte:**

1. Nur Produkte mit verifizierten Nachhaltigkeits-Zertifikaten dürfen verkauft werden
2. Käufer erstellen Werteprofil → System berechnet Match-Score zu Produkten
3. Verkäufer laden Zertifikate hoch → Admin verifiziert → Produkte werden freigeschaltet

**Akteure:**

- **Käufer (BUYER):** Erstellt Werteprofil, kauft Produkte
- **Verkäufer (SELLER):** Lädt Zertifikate hoch, erstellt Produkte
- **Admin:** Verifiziert Zertifikate, schaltet Verkäufer frei

---

## MODULE & ABHÄNGIGKEITEN

```
Modul 01 (Auth & User)
  ↓
Modul 02 (Products) ← benötigt User.id als sellerId
  ↓
Modul 03 (Certificates) ← aktualisiert Product.verifiedCertificateCount
  ↓
Modul 04 (Matching) ← nutzt UserProfile + Product + Certificates
  ↓
Modul 05 (Cart) ← nutzt Variant.reserved (atomare Reservierung)
  ↓
Modul 06 (Orders) [TODO]
  ↓
Modul 07 (Payment) [TODO]

Parallel:
Modul 08 (Files) [TODO]
Modul 10 (Email) [TODO]
```

---

## DATENMODELL (ALLE TABELLEN)

### Modul 01: Authentication & User Management

```sql
-- User
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- gehashed
  role ENUM('BUYER', 'SELLER', 'ADMIN') DEFAULT 'BUYER',
  status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') DEFAULT 'ACTIVE',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User-Profile (Werteprofil für Matching)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  active_profile_type VARCHAR(20) DEFAULT 'none',  -- 'none', 'simple', 'extended'
  simple_profile JSONB,    -- { "Faire Arbeit": 90, "Umwelt": 85, ... }
  extended_profile JSONB,  -- verschachtelt
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verkäufer-Profile
CREATE TABLE seller_profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  company_name VARCHAR(255) NOT NULL,
  vat_id VARCHAR(50),
  iban VARCHAR(50),
  status ENUM('PENDING', 'APPROVED', 'SUSPENDED') DEFAULT 'PENDING',
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Adressen
CREATE TABLE addresses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20),  -- 'SHIPPING', 'BILLING', 'BOTH'
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  street VARCHAR(255),
  house_number VARCHAR(20),
  postal_code VARCHAR(10),
  city VARCHAR(100),
  country VARCHAR(2) DEFAULT 'DE',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Modul 02: Product Management

```sql
-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  shop_id UUID REFERENCES shops(id),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_desc VARCHAR(200),
  base_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(4,2) DEFAULT 19.00,
  weight DECIMAL(8,2),
  status ENUM('DRAFT', 'REVIEW', 'ACTIVE', 'INACTIVE', 'REJECTED') DEFAULT 'DRAFT',
  verified_certificate_count INTEGER DEFAULT 0,  -- KRITISCH!
  views INTEGER DEFAULT 0,  -- asynchron aktualisiert (Redis)
  sales_count INTEGER DEFAULT 0,
  search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('german', name || ' ' || description)) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Slug-Historie (für SEO & 301 Redirects)
CREATE TABLE product_slug_history (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  slug VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Varianten (NEUE STRUKTUR)
CREATE TABLE variant (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  sku VARCHAR(100) UNIQUE NOT NULL,  -- UNIQUE!
  price DECIMAL(10,2),  -- Aufpreis (NULL = basePrice)
  stock INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Varianten-Optionen (für kombinierte Varianten)
CREATE TABLE variant_option (
  id UUID PRIMARY KEY,
  variant_id UUID REFERENCES variant(id),
  option_type VARCHAR(50),  -- 'SIZE', 'COLOR', 'MATERIAL'
  option_value VARCHAR(100)  -- 'M', 'Rot', 'Bio-Baumwolle'
);

-- Produktbilder
CREATE TABLE product_images (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(200),
  "order" INTEGER NOT NULL DEFAULT 0,  -- 0 = Hauptbild
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kategorien (3 Ebenen)
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  level INTEGER NOT NULL,  -- 1, 2, 3 (technisch erzwungen!)
  description TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Shops (Multi-Shop pro Verkäufer)
CREATE TABLE shops (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  logo VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Materialized View (für Performance)
CREATE MATERIALIZED VIEW product_search_view AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.base_price AS price_min,
  p.status,
  p.views,
  p.sales_count,
  p.created_at,
  (SELECT url FROM product_images WHERE product_id = p.id AND "order" = 0 LIMIT 1) AS main_image_url,
  s.name AS shop_name,
  s.slug AS shop_slug,
  c.name AS category_name,
  c.slug AS category_slug,
  CASE
    WHEN EXISTS(SELECT 1 FROM variant v WHERE v.product_id = p.id AND (v.stock - v.reserved) > 0)
    THEN 'IN_STOCK' ELSE 'OUT_OF_STOCK'
  END AS availability
FROM products p
JOIN shops s ON p.shop_id = s.id
JOIN categories c ON p.category_id = c.id
WHERE p.status = 'ACTIVE';

-- Externe API-Verbindungen (für Warenwirtschaftssysteme)
CREATE TABLE external_inventory_connections (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  system_type ENUM('SHOPIFY', 'SAP', 'WOOCOMMERCE', 'CUSTOM'),
  api_endpoint VARCHAR(500),
  auth_type ENUM('API_KEY', 'OAUTH', 'BASIC_AUTH'),
  credentials_encrypted TEXT,  -- AES-256 verschlüsselt!
  is_active BOOLEAN DEFAULT TRUE,
  sync_interval INTEGER DEFAULT 15,  -- Minuten
  last_sync_at TIMESTAMP,
  last_sync_status ENUM('SUCCESS', 'FAILED'),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_external_mapping (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES variant(id),
  connection_id UUID REFERENCES external_inventory_connections(id),
  external_product_id VARCHAR(255),
  external_sku VARCHAR(255),
  last_synced_stock INTEGER,
  last_synced_at TIMESTAMP
);
```

### Modul 03: Certificate Management

```sql
-- Certificates
CREATE TABLE certificate (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  certificate_type ENUM('IVN_BEST', 'GOTS', 'FAIR_TRADE', 'EU_ECOLABEL', 'BLUESIGN', 'CUSTOM'),
  custom_type_name VARCHAR(200),  -- wenn CUSTOM
  issuer VARCHAR(200) NOT NULL,
  certificate_number VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status ENUM('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED') DEFAULT 'PENDING',
  document_url VARCHAR(500) NOT NULL,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Product-Certificate Mapping (n:m)
CREATE TABLE product_certificate (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  certificate_id UUID REFERENCES certificate(id),
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, certificate_id)
);
```

### Modul 04: Matching Engine

**Keine eigenen Tabellen!**

Optional: Cache-Tabelle

```sql
CREATE TABLE match_score_cache (
  user_id UUID,
  product_id UUID,
  score INTEGER,
  calculated_at TIMESTAMP,
  PRIMARY KEY (user_id, product_id)
);
```

### Modul 05: Shopping Cart & Checkout

```sql
-- Cart
CREATE TABLE cart (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),  -- NULL wenn Gast
  session_id VARCHAR(100),             -- UUID wenn Gast
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

-- Cart Items
CREATE TABLE cart_item (
  id UUID PRIMARY KEY,
  cart_id UUID REFERENCES cart(id),
  variant_id UUID REFERENCES variant(id),  -- NICHT product_id!
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  price_snapshot DECIMAL(10,2) NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(cart_id, variant_id)
);
```

---

## KRITISCHE BUSINESS-REGELN

### 1. Produkt-Status-Maschine (Modul 02)

```
Erlaubte Übergänge:
  DRAFT → REVIEW     (wenn Bilder vorhanden)
  REVIEW → ACTIVE    (wenn verifiedCertificateCount >= 1)
  REVIEW → REJECTED  (von Admin)
  ACTIVE → INACTIVE  (manuell oder Zertifikat abgelaufen)
  INACTIVE → ACTIVE  (wenn verifiedCertificateCount >= 1)

ALLE anderen Übergänge VERBOTEN!
```

**Validierung bei Statuswechsel zu ACTIVE:**

```sql
IF product.verified_certificate_count < 1:
  THROW ERROR "Kein verifiziertes Zertifikat"
```

---

### 2. Kategorie-Level erzwingen (Modul 02)

```
Beim Produkt-Erstellen:
  category = SELECT level FROM categories WHERE id = :categoryId

  IF category.level != 3:
    THROW ERROR "Nur Level-3-Kategorien erlaubt"
```

---

### 3. Atomare Lagerbestand-Reservierung (Modul 02 & 05)

**KRITISCH:** Race-Condition-sicher!

```sql
-- FALSCH (Race Condition!):
available = SELECT (stock - reserved) FROM variant WHERE id = :id
IF available >= :quantity:
  UPDATE variant SET reserved = reserved + :quantity WHERE id = :id

-- RICHTIG (atomar):
BEGIN TRANSACTION;

UPDATE variant
SET reserved = reserved + :quantity
WHERE id = :variantId
AND (stock - reserved) >= :quantity;

IF rowsAffected == 0:
  ROLLBACK;
  THROW ERROR "Nicht genug verfügbar";

COMMIT;
```

---

### 4. Zertifikats-Verifizierung triggert Produkt-Aktivierung (Modul 03)

```sql
-- Wenn Admin Zertifikat verifiziert:
BEGIN TRANSACTION;

-- 1. Certificate updaten
UPDATE certificate
SET status = 'VERIFIED', verified_by = :adminId, verified_at = NOW()
WHERE id = :certId;

-- 2. Alle verknüpften Produkte: Zähler erhöhen
UPDATE products
SET verified_certificate_count = verified_certificate_count + 1
WHERE id IN (
  SELECT product_id FROM product_certificate WHERE certificate_id = :certId
);

-- 3. Produkte im Review-Status aktivieren
UPDATE products
SET status = 'ACTIVE'
WHERE status = 'REVIEW'
AND id IN (...)
AND verified_certificate_count >= 1;

COMMIT;
```

---

### 5. Zertifikats-Ablauf deaktiviert Produkte (Modul 03)

**Cronjob (täglich):**

```sql
-- Finde abgelaufene Zertifikate
SELECT * FROM certificate
WHERE status = 'VERIFIED'
AND expiry_date < TODAY;

-- Für jedes:
BEGIN TRANSACTION;

-- 1. Certificate expiren
UPDATE certificate SET status = 'EXPIRED' WHERE id = :id;

-- 2. Produkte aktualisieren
UPDATE products
SET verified_certificate_count = verified_certificate_count - 1
WHERE id IN (SELECT product_id FROM product_certificate WHERE certificate_id = :id);

-- 3. Produkte ohne Zertifikat deaktivieren
UPDATE products
SET status = 'INACTIVE'
WHERE status = 'ACTIVE'
AND verified_certificate_count < 1;

COMMIT;
```

---

### 6. Slug-Historie & 301 Redirects (Modul 02)

```
Bei Name-Änderung:
  1. Alten Slug in product_slug_history speichern
  2. Neuen Slug generieren
  3. product.slug updaten

Beim Abrufen:
  1. SELECT * FROM products WHERE slug = :slug
  2. Falls nicht gefunden:
     SELECT product_id FROM product_slug_history WHERE slug = :slug
     → 301 Redirect zu neuem Slug
```

---

### 7. Match-Score-Berechnung (Modul 04)

**Simple Profile:**

```
Für jede Kategorie (Faire Arbeit, Umwelt, Tierwohl, Soziales, Kreislauf):
  Hat Produkt Zertifikat das diese Kategorie abdeckt?
  → JA: Score = userValue (z.B. 90)
  → NEIN: Score = 0

Gesamtscore = Gewichteter Durchschnitt:
  sum(score * userValue) / sum(userValue)
```

**Beispiel:**

```
User: Faire Arbeit=90, Umwelt=85, Tierwohl=70, Soziales=80, Kreislauf=60
Produkt: GOTS (Umwelt+Faire Arbeit), Fair Trade (Soziales)

Score = (90*90 + 85*85 + 0*70 + 80*80 + 0*60) / (90+85+70+80+60)
      = (8100 + 7225 + 0 + 6400 + 0) / 385
      = 56
```

---

### 8. Warenkorb-Merge bei Login (Modul 05)

```
Wenn User einloggt:
  1. Hole Gast-Warenkorb (via sessionId aus Cookie)
  2. Hole User-Warenkorb (via userId)

  3. Wenn User-Warenkorb nicht existiert:
     → Gast-Warenkorb zu User umwandeln

  4. Wenn beide existieren:
     → Items mergen (Quantities addieren, Verfügbarkeit prüfen)
     → Gast-Warenkorb löschen
     → Cookie löschen
```

---

### 9. Warenkorb-Cleanup (Modul 05)

**Cronjob (täglich):**

```sql
-- Finde alte Gast-Warenkörbe (> 24h)
SELECT * FROM cart
WHERE session_id IS NOT NULL
AND updated_at < NOW() - INTERVAL '24 hours';

-- Für jeden:
-- 1. Reservierungen freigeben
items = SELECT * FROM cart_item WHERE cart_id = :cartId;
FOR item IN items:
  UPDATE variant SET reserved = reserved - item.quantity WHERE id = item.variant_id;

-- 2. Warenkorb löschen
DELETE FROM cart_item WHERE cart_id = :cartId;
DELETE FROM cart WHERE id = :cartId;
```

---

## KRITISCHE PERFORMANCE-MASSNAHMEN

### Datenbank-Indizes (ALLE ERSTELLEN!)

```sql
-- Products
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_status ON products(category_id, status);
CREATE INDEX idx_products_shop_status ON products(shop_id, status);
CREATE INDEX idx_products_seller_status ON products(seller_id, status);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_products_price ON products(base_price);
CREATE INDEX idx_products_sales ON products(sales_count DESC);
CREATE INDEX idx_products_search ON products USING GIN(search_vector);

-- Variants
CREATE UNIQUE INDEX idx_variant_sku ON variant(sku);
CREATE INDEX idx_variant_product ON variant(product_id);

-- Variant Options
CREATE INDEX idx_variant_option_variant ON variant_option(variant_id);
CREATE INDEX idx_variant_option_type_value ON variant_option(option_type, option_value);

-- Product Images
CREATE INDEX idx_product_images_product ON product_images(product_id, "order");

-- Slug History
CREATE UNIQUE INDEX idx_product_slug_history_slug ON product_slug_history(slug);  -- UNIQUE: Alte Slugs nie wiederverwenden
CREATE INDEX idx_product_slug_history_product ON product_slug_history(product_id);

-- Categories
CREATE INDEX idx_category_parent_level ON categories(parent_id, level);
CREATE INDEX idx_category_slug ON categories(slug);

-- Certificates
CREATE INDEX idx_certificate_seller_status ON certificate(seller_id, status);
CREATE INDEX idx_certificate_expiry ON certificate(expiry_date, status);
CREATE INDEX idx_certificate_status ON certificate(status);

-- Product-Certificate
CREATE UNIQUE INDEX idx_product_certificate_unique ON product_certificate(product_id, certificate_id);
CREATE INDEX idx_product_certificate_product ON product_certificate(product_id);
CREATE INDEX idx_product_certificate_certificate ON product_certificate(certificate_id);

-- Cart
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_cart_session ON cart(session_id);
CREATE INDEX idx_cart_updated ON cart(updated_at);

-- Cart Items
CREATE INDEX idx_cart_item_cart ON cart_item(cart_id);
CREATE INDEX idx_cart_item_variant ON cart_item(variant_id);
CREATE UNIQUE INDEX idx_cart_item_unique ON cart_item(cart_id, variant_id);
```

---

### View-Zähler asynchron (Modul 02)

```
NICHT: UPDATE products SET views = views + 1 WHERE id = :id

SONDERN:
  Redis: INCR product:views:{productId}

Cronjob (alle 10 Min):
  Flush zu DB:
  UPDATE products SET views = views + :count WHERE id = :id
```

---

### Materialized View refresh (Modul 02)

```sql
-- Cronjob (alle 5 Min)
REFRESH MATERIALIZED VIEW CONCURRENTLY product_search_view;
```

---

## API-SCHNITTSTELLEN ZWISCHEN MODULEN

### Modul 01 → Alle

```
Middleware:
  - authenticate(req, res, next)
  - authorize(roles)

Nutzt JWT-Token aus Header: "Authorization: Bearer {token}"
Setzt: req.user = { userId, role, ... }
```

### Modul 02 → Modul 03

```
Product.verifiedCertificateCount
  - Wird von Modul 03 bei Verifizierung/Ablauf aktualisiert
```

### Modul 03 → Modul 02

```
Beim Verifizieren:
  UPDATE products SET verified_certificate_count = ... WHERE ...

Beim Ablaufen:
  UPDATE products SET verified_certificate_count = ..., status = 'INACTIVE' WHERE ...
```

### Modul 02 → Modul 04

```
Matching Engine nutzt:
  - products (alle Felder)
  - product_certificate (welche Zertifikate hat Produkt)
  - certificate (Typ, Status)
```

### Modul 04 → Modul 02

```
Erweitert GET /products Response:
  + matchScore (0-100)
  + matchBreakdown ({ "Faire Arbeit": { ... }, ... })
```

### Modul 05 → Modul 02

```
Atomare Reservierung:
  UPDATE variant SET reserved = reserved + :qty
  WHERE id = :id AND (stock - reserved) >= :qty
```

---

## CRON-JOBS

| Job                            | Frequenz     | Modul | Aufgabe                                                  |
| ------------------------------ | ------------ | ----- | -------------------------------------------------------- |
| **cleanup_abandoned_carts**    | Täglich 3:00 | 05    | Gast-Warenkörbe > 24h löschen, Reservierungen freigeben  |
| **check_expired_certificates** | Täglich 2:00 | 03    | Abgelaufene Zertifikate → EXPIRED, Produkte deaktivieren |
| **send_expiry_reminders**      | Täglich 8:00 | 03    | E-Mail 30d & 7d vor Ablauf                               |
| **flush_view_counts**          | Alle 10 Min  | 02    | Redis → DB (product.views)                               |
| **refresh_search_view**        | Alle 5 Min   | 02    | REFRESH MATERIALIZED VIEW product_search_view            |

---

## WICHTIGE KONFIGURATIONEN

### Zertifikats-Kategorien-Mapping

```json
{
  "GOTS": ["Umwelt", "Faire Arbeit"],
  "FAIR_TRADE": ["Faire Arbeit", "Soziales"],
  "IVN_BEST": ["Umwelt", "Faire Arbeit", "Tierwohl"],
  "EU_ECOLABEL": ["Umwelt"],
  "BLUESIGN": ["Umwelt"],
  "CRADLE_TO_CRADLE": ["Umwelt", "Kreislauf"],
  "PETA_APPROVED": ["Tierwohl"],
  "B_CORP": ["Soziales", "Umwelt"]
}
```

**Wichtig:** Muss konfigurierbar sein (Admin-Panel oder Config-File)

---

## NOCH FEHLENDE MODULE

**ALLE MODULE SIND JETZT KOMPLETT!**

✅ **Modul 06:** Order Management  
✅ **Modul 07:** Payment Processing  
✅ **Modul 08:** File Upload & Storage  
✅ **Modul 09:** Admin Panel  
✅ **Modul 10:** Email Service

---

## DATENMODELL MODUL 06-10

### Modul 06: Order Management

```sql
-- Orders (Hauptbestellung)
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,  -- "ORD-2024-00123"
  user_id UUID REFERENCES users(id),  -- NULL wenn Gast
  guest_email VARCHAR(255),
  status ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
  payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
  payment_intent_id VARCHAR(255),
  subtotal DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND guest_email IS NULL) OR
    (user_id IS NULL AND guest_email IS NOT NULL)
  )
);

-- OrderGroup (pro Verkäufer)
CREATE TABLE order_group (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  seller_id UUID REFERENCES users(id),
  status ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
  subtotal DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  tracking_number VARCHAR(100),
  carrier VARCHAR(50),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- OrderItem
CREATE TABLE order_item (
  id UUID PRIMARY KEY,
  order_group_id UUID REFERENCES order_group(id),
  variant_id UUID REFERENCES variant(id),
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  product_snapshot JSONB  -- Produkt-Daten als Backup
);

-- OrderStatusHistory
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  order_group_id UUID REFERENCES order_group(id),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Return (Rücksendungen)
CREATE TABLE returns (
  id UUID PRIMARY KEY,
  order_group_id UUID REFERENCES order_group(id),
  requested_by UUID REFERENCES users(id),
  status ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED'),
  reason TEXT,
  items JSONB,
  refund_amount DECIMAL(10,2),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Modul 07: Payment Processing

```sql
-- Payment (Kundenzahlungen)
CREATE TABLE payment (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  provider ENUM('STRIPE', 'PAYPAL', 'KLARNA', 'SOFORT'),
  provider_payment_id VARCHAR(255),
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  status ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'),
  payment_method VARCHAR(50),
  receipt_url VARCHAR(500),
  failure_reason TEXT,
  refunded_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  succeeded_at TIMESTAMP
);

-- Payout (Auszahlungen an Verkäufer)
CREATE TABLE payout (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  order_group_id UUID REFERENCES order_group(id),
  amount DECIMAL(10,2),  -- Netto (nach Provision)
  commission DECIMAL(10,2),  -- Plattform-Provision
  gross_amount DECIMAL(10,2),  -- Brutto
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
  provider ENUM('STRIPE_CONNECT', 'PAYPAL', 'BANK_TRANSFER'),
  provider_payout_id VARCHAR(255),
  recipient_account VARCHAR(255),  -- VERSCHLÜSSELT!
  scheduled_for DATE,
  completed_at TIMESTAMP,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Refund (Rückerstattungen)
CREATE TABLE refund (
  id UUID PRIMARY KEY,
  payment_id UUID REFERENCES payment(id),
  order_id UUID REFERENCES orders(id),
  return_id UUID REFERENCES returns(id),
  amount DECIMAL(10,2),
  reason TEXT,
  status ENUM('PENDING', 'SUCCEEDED', 'FAILED'),
  provider VARCHAR(50),
  provider_refund_id VARCHAR(255),
  initiated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  succeeded_at TIMESTAMP
);

-- CommissionRate
CREATE TABLE commission_rate (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),  -- NULL = Default
  category_id UUID REFERENCES categories(id),  -- NULL = Default
  rate DECIMAL(5,2),  -- 10.00 = 10%
  is_active BOOLEAN DEFAULT TRUE,
  valid_from DATE,
  valid_until DATE
);
```

### Modul 08: File Upload & Storage

```sql
-- File (Optional - für Tracking)
CREATE TABLE file (
  id UUID PRIMARY KEY,
  filename VARCHAR(255),
  stored_filename VARCHAR(255),
  mime_type VARCHAR(100),
  size INTEGER,
  url VARCHAR(500),
  storage_provider ENUM('LOCAL', 'S3', 'CLOUDINARY', 'GCS'),
  category VARCHAR(50),  -- 'product_image', 'certificate', 'profile'
  uploaded_by UUID REFERENCES users(id),
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Modul 09: Admin Panel

```sql
-- AdminAuditLog
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Modul 10: Email Service

```sql
-- EmailTemplate
CREATE TABLE email_template (
  id UUID PRIMARY KEY,
  template_id VARCHAR(100),
  name VARCHAR(200),
  subject VARCHAR(500),
  html_body TEXT,
  text_body TEXT,
  category ENUM('TRANSACTIONAL', 'NOTIFICATION', 'MARKETING'),
  locale VARCHAR(5) DEFAULT 'de_DE',
  is_active BOOLEAN DEFAULT TRUE,
  variables JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id, locale)
);

-- EmailLog
CREATE TABLE email_log (
  id UUID PRIMARY KEY,
  template_id VARCHAR(100),
  recipient VARCHAR(255),
  user_id UUID REFERENCES users(id),
  subject VARCHAR(500),
  status ENUM('QUEUED', 'SENT', 'FAILED', 'BOUNCED', 'OPENED', 'CLICKED'),
  provider VARCHAR(50),
  provider_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- EmailPreference
CREATE TABLE email_preference (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  notification_emails BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT TRUE,
  unsubscribe_token VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND email IS NULL) OR
    (user_id IS NULL AND email IS NOT NULL)
  )
);
```

---

## STATUS ALLE MODULE (KOMPLETT!)

✅ **Modul 01:** Authentication & User Management  
✅ **Modul 02:** Product Management (12 kritische Korrekturen)  
✅ **Modul 03:** Certificate Management  
✅ **Modul 04:** Matching Engine  
✅ **Modul 05:** Shopping Cart & Checkout  
✅ **Modul 06:** Order Management (Multi-Vendor, OrderGroups)  
✅ **Modul 07:** Payment Processing (Escrow, Auszahlungen)  
✅ **Modul 08:** File Upload & Storage (CDN, Optimierung)  
✅ **Modul 09:** Admin Panel (Backend-only, Dashboard)  
✅ **Modul 10:** Email Service (Templates, Queue, Tracking)

**Alle Schnittstellen zwischen 01-10 sind konsistent!**

---

## CRONJOB-ÜBERSICHT (KOMPLETT)

| Job                          | Frequenz      | Modul | Aufgabe                                                  |
| ---------------------------- | ------------- | ----- | -------------------------------------------------------- |
| `cleanup_abandoned_carts`    | Täglich 3:00  | 05    | Gast-Warenkörbe > 24h löschen, Reservierungen freigeben  |
| `check_expired_certificates` | Täglich 2:00  | 03    | Abgelaufene Zertifikate → EXPIRED, Produkte deaktivieren |
| `send_expiry_reminders`      | Täglich 8:00  | 03    | E-Mail 30d & 7d vor Zertifikats-Ablauf                   |
| `flush_view_counts`          | Alle 10 Min   | 02    | Redis → DB (product.views)                               |
| `refresh_search_view`        | Alle 5 Min    | 02    | REFRESH MATERIALIZED VIEW                                |
| `process_payouts`            | Täglich 10:00 | 07    | Fällige Auszahlungen ausführen                           |
| `cleanup_orphaned_files`     | Wöchentlich   | 08    | Nicht-referenzierte Dateien löschen                      |
| `email_queue_worker`         | Permanent     | 10    | E-Mail-Queue verarbeiten                                 |

---

## WICHTIGE BUSINESS-FLOWS (KOMPLETT)

### Kompletter Kauf-Flow (Module 02, 05, 06, 07, 10)

```
1. Warenkorb (Modul 05)
   → Atomare Reservierung: variant.reserved += quantity

2. Checkout (Modul 05)
   → Preis-Validierung, Verfügbarkeits-Check

3. Payment-Intent (Modul 07)
   → Stripe/PayPal Payment-Form

4. Zahlung erfolgreich (Modul 07 Webhook)
   → payment.status = SUCCEEDED

5. Order erstellen (Modul 06)
   → Order + OrderGroups + OrderItems
   → stock -= qty, reserved -= qty
   → Warenkorb leeren

6. E-Mails (Modul 10)
   → Käufer: Bestellbestätigung
   → Verkäufer: Neue Bestellung

7. Versand (Modul 06)
   → orderGroup.status = SHIPPED
   → Tracking-Nummer
   → E-Mail an Käufer

8. Auszahlung planen (Modul 07)
   → payout.scheduledFor = TODAY + 7

9. Auszahlung ausführen (Modul 07 Cronjob)
   → Geld an Verkäufer
```

### Zertifikats-Flow (Module 02, 03, 08, 10)

```
1. Upload (Modul 03 + 08)
   → certificate.status = PENDING

2. Verifizierung (Modul 03)
   → certificate.status = VERIFIED
   → verifiedCertificateCount += 1

3. Automatische Aktivierung (Modul 02)
   → product.status = ACTIVE

4. Ablauf (Modul 03 Cronjob)
   → certificate.status = EXPIRED
   → verifiedCertificateCount -= 1
   → product.status = INACTIVE
```

---

**Für nächste AI-Session:**

- **ALLE 10 Module sind komplett dokumentiert**
- Datenmodell vollständig & konsistent
- Alle Business-Regeln definiert
- Alle Schnittstellen geklärt
- Cronjobs definiert
- Performance-Optimierungen dokumentiert
- Bereit für Entwicklung!
