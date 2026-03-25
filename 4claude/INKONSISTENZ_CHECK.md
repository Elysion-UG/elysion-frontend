# INKONSISTENZ-CHECK: Module 01-10
## Systematische Prüfung aller Schnittstellen & Datenmodelle

**Datum:** 02.03.2026  
**Geprüfte Module:** 01-10  
**Status:** PRÜFUNG ABGESCHLOSSEN

---

## ✅ KONSISTENTE BEREICHE

### 1. Modul 01 (Auth) ↔ Modul 02 (Products)

**Geprüft:**
- ✅ `products.sellerId` referenziert `users.id` (Modul 01)
- ✅ User-Rollen: BUYER, SELLER, ADMIN konsistent
- ✅ Seller-Status: PENDING, APPROVED, SUSPENDED konsistent

**Status:** KONSISTENT

---

### 2. Modul 02 (Products) ↔ Modul 03 (Certificates)

**Geprüft:**
- ✅ `product.verifiedCertificateCount` wird von Modul 03 aktualisiert
- ✅ Status-Logik konsistent:
  - Modul 02: "ACTIVE nur wenn verifiedCertificateCount >= 1"
  - Modul 03: "Bei Verifizierung: verifiedCertificateCount += 1"
- ✅ `product_certificate` Verknüpfungs-Tabelle in beiden Modulen erwähnt
- ✅ Zertifikats-Ablauf → Produkt INACTIVE konsistent

**Status:** KONSISTENT

---

### 3. Modul 02 (Products) ↔ Modul 05 (Cart)

**Geprüft:**
- ✅ Varianten-Struktur identisch:
  - Modul 02: `variant` + `variant_option`
  - Modul 05: Nutzt `variantId` (nicht productId!)
- ✅ Atomare Reservierung identisch:
  ```sql
  UPDATE variant
  SET reserved = reserved + :qty
  WHERE id = :id AND (stock - reserved) >= :qty
  ```
- ✅ `stock`, `reserved` Felder konsistent
- ✅ Beide Module: "available wird NICHT gespeichert"

**Status:** KONSISTENT

---

### 4. Modul 05 (Cart) ↔ Modul 06 (Orders)

**Geprüft:**
- ✅ Checkout-Workflow konsistent:
  - Modul 05: "POST /checkout/complete"
  - Modul 06: "Order erstellen aus Cart"
- ✅ Warenkorb-Leeren nach Order-Erstellung in beiden erwähnt
- ✅ Lagerbestand-Finalisierung identisch:
  - Stock abziehen: `stock -= quantity`
  - Reservierung aufheben: `reserved -= quantity`
- ✅ `order_item.variantId` referenziert `variant.id`

**Status:** KONSISTENT

---

### 5. Modul 06 (Orders) ↔ Modul 07 (Payment)

**Geprüft:**
- ✅ Payment-Status synchron:
  - Modul 06: `order.paymentStatus`
  - Modul 07: `payment.status` → aktualisiert Order
- ✅ Order-Number konsistent zwischen beiden
- ✅ Auszahlungs-Logik konsistent:
  - Modul 06: "Nach Versand → Auszahlung planen"
  - Modul 07: "Payout.scheduledFor = +7 Tage"
- ✅ `payment.orderId` referenziert `orders.id`
- ✅ `payout.orderGroupId` referenziert `order_group.id`

**Status:** KONSISTENT

---

### 6. Modul 02 (Products) ↔ Modul 08 (Files)

**Geprüft:**
- ✅ Produktbilder-Upload konsistent:
  - Modul 02: "Upload via Modul 08"
  - Modul 08: Kategorie "product_image"
- ✅ Max. Dateigröße: 5 MB (beide)
- ✅ Erlaubte Formate: JPEG, PNG, WEBP (beide)
- ✅ `product_images.url` speichert URL von Modul 08

**Status:** KONSISTENT

---

### 7. Modul 03 (Certificates) ↔ Modul 08 (Files)

**Geprüft:**
- ✅ Zertifikats-Upload konsistent:
  - Modul 03: "Upload via Modul 08"
  - Modul 08: Kategorie "certificate"
- ✅ Max. Dateigröße: 10 MB (beide)
- ✅ Erlaubte Formate: PDF, JPEG, PNG (beide)
- ✅ `certificate.documentUrl` speichert URL von Modul 08

**Status:** KONSISTENT

---

### 8. Modul 04 (Matching) ↔ Modul 01, 02, 03

**Geprüft:**
- ✅ Nutzt `user_profile` aus Modul 01
- ✅ Nutzt `products` aus Modul 02
- ✅ Nutzt `product_certificate` + `certificate` aus Modul 03
- ✅ Zertifikats-Kategorien-Mapping konsistent
- ✅ Match-Score wird in Modul 02 API erwähnt

**Status:** KONSISTENT

---

### 9. Modul 10 (Email) ↔ Alle Module

**Geprüft:**
- ✅ E-Mail-Templates für alle wichtigen Events definiert:
  - Modul 01: `email_verification`, `password_reset`
  - Modul 03: `certificate_verified`, `certificate_rejected`, `certificate_expiring`
  - Modul 06: `order_confirmation`, `order_shipped`, `order_delivered`
  - Modul 07: `payout_completed`
- ✅ Alle Module rufen `EmailService.sendEmail()` auf
- ✅ Template-IDs konsistent zwischen Modulen

**Status:** KONSISTENT

---

### 10. Modul 09 (Admin) ↔ Alle Module

**Geprüft:**
- ✅ Admin-Endpoints greifen auf alle Module zu
- ✅ Audit-Log für kritische Actions definiert
- ✅ Admin-Rolle konsistent (Modul 01: ADMIN)

**Status:** KONSISTENT

---

## ⚠️ GEFUNDENE INKONSISTENZEN

### KEINE KRITISCHEN INKONSISTENZEN GEFUNDEN! ✅

**Kleinere Optimierungen:**

### 1. Modul 06: productSnapshot Feldname

**Problem:** Nicht kritisch, aber Inkonsistenz im Naming

**Modul 06 verwendet:**
```sql
order_item.productSnapshot JSONB
```

**Aber speichert:**
```json
{
  "productId": "...",
  "productName": "...",
  "variantSku": "...",
  "variantOptions": [...]
}
```

**Empfehlung:** Umbenennen zu `product_snapshot` (mit Unterstrich) für DB-Konventionen

**Status:** MINOR (nicht kritisch)

---

### 2. Modul 05 vs. Modul 06: Guest-Order Handling

**Beide Module erwähnen Gast-Bestellungen:**

**Modul 05 (Cart):**
```sql
cart.userId (NULL wenn Gast)
cart.sessionId (UUID wenn Gast)
```

**Modul 06 (Orders):**
```sql
order.userId (NULL wenn Gast)
order.guestEmail (E-Mail wenn Gast)
```

**Frage:** Wird `guestEmail` aus Cart übergeben?

**Prüfung in Modul 05:**
```
POST /checkout:
  Request: {
    "email": "kunde@example.com"  // Wenn Gast
  }
```

**Ergebnis:** ✅ KONSISTENT - E-Mail wird im Checkout angegeben

---

### 3. Modul 02: Slug-Historie vs. Slug-Einzigartigkeit

**Modul 02 definiert:**
```sql
products.slug VARCHAR(255) UNIQUE NOT NULL
```

**Aber auch:**
```sql
product_slug_history.slug VARCHAR(255) NOT NULL
```

**Frage:** Kann ein alter Slug wieder als neuer Slug verwendet werden?

**Beispiel:**
```
1. Produkt A: slug = "bio-tshirt"
2. Umbenennen: slug = "premium-bio-tshirt"
   → slug_history: "bio-tshirt"
3. Neues Produkt B: slug = "bio-tshirt" (möglich?)
```

**Problem:** UNIQUE constraint auf `products.slug` verhindert dies nicht (alter Slug ist nicht mehr in `products`)

**Aber:** `product_slug_history` hat keinen UNIQUE constraint!

**Empfehlung:** Entweder:
- **Option A:** `product_slug_history.slug` UNIQUE machen (alter Slug kann nie wieder verwendet werden)
- **Option B:** Beim Slug-Generieren AUCH in history prüfen

**Status:** MINOR (Randfall, aber sollte geklärt werden)

**Vorschlag:**
```sql
-- Option A (empfohlen)
CREATE UNIQUE INDEX idx_product_slug_history_slug ON product_slug_history(slug);

-- Option B (in Code)
function generateSlug(name):
  slug = slugify(name)
  
  # Prüfe BEIDE Tabellen
  existsInProducts = SELECT 1 FROM products WHERE slug = :slug
  existsInHistory = SELECT 1 FROM product_slug_history WHERE slug = :slug
  
  if (existsInProducts OR existsInHistory):
    slug += "-2"  # Suffix
```

**Ich empfehle Option A** (UNIQUE constraint in history)

---

### 4. Modul 07: Payout-Scheduling Klarheit

**Modul 06 sagt:**
```
"Nach Versand → Auszahlung planen"
```

**Modul 07 sagt:**
```
payout.scheduledFor = TODAY + 7 DAYS
```

**Frage:** Wird Payout bei `orderGroup.status = SHIPPED` erstellt?

**Prüfung in Modul 06:**
```
PATCH /order-groups/:id/status:
  "Bei newStatus == 'SHIPPED': ..."
  # Aber keine Erwähnung von Payout-Erstellung
```

**Prüfung in Modul 07:**
```
"Auszahlungs-Erstellung (nach Versand)"
```

**Problem:** In Modul 06 wird nicht explizit gesagt, dass Payout erstellt wird.

**Empfehlung:** In Modul 06 ergänzen:

```
4. Auszahlung planen (Modul 07):
   if (newStatus == 'SHIPPED'):
     PayoutService.create(orderGroup)
```

**Status:** MINOR (implizit klar, aber sollte explizit sein)

---

### 5. Modul 08: File-Tabelle Optional oder Pflicht?

**Modul 08 sagt:**
```
"Hinweis: Nicht zwingend erforderlich. URLs können direkt in anderen Modulen gespeichert werden."
```

**Aber andere Module (02, 03) speichern URLs direkt:**
```sql
product_images.url VARCHAR(500)
certificate.documentUrl VARCHAR(500)
```

**Frage:** Wird `file`-Tabelle überhaupt genutzt?

**Antwort:** OPTIONAL - URLs werden direkt gespeichert.

**Status:** KEIN PROBLEM (explizit als optional markiert)

---

## 📋 ZUSAMMENFASSUNG

### Kritische Inkonsistenzen: **0** ✅

### Minor Issues: **3**

1. **Slug-Historie UNIQUE constraint fehlt** (empfohlen)
2. **Payout-Erstellung in Modul 06 nicht explizit erwähnt** (sollte ergänzt werden)
3. **productSnapshot Naming** (Minor, nicht kritisch)

---

## 🔧 EMPFOHLENE KORREKTUREN

### 1. Modul 02: Slug-Historie UNIQUE

**In Modul_02_Product_Management.md ergänzen:**

```sql
-- Alte Slugs können NIE wieder verwendet werden
CREATE UNIQUE INDEX idx_product_slug_history_slug ON product_slug_history(slug);
```

**Begründung:** Verhindert Konflikte mit alten URLs

---

### 2. Modul 06: Payout-Erstellung explizit machen

**In Modul_06_Order_Management.md, Abschnitt 3.4, ergänzen:**

```
4. Auszahlung planen (Modul 07):
   if (newStatus == 'SHIPPED'):
     payout = PayoutService.create({
       orderGroupId: orderGroup.id,
       sellerId: orderGroup.sellerId,
       amount: calculateNetAmount(orderGroup.total),
       commission: calculateCommission(orderGroup.total),
       scheduledFor: TODAY + 7 DAYS
     })
```

---

### 3. Modul 02: productSnapshot → product_snapshot

**Optional (nur für Naming-Konsistenz):**

```sql
-- Umbenennen
order_item.product_snapshot JSONB
```

---

## ✅ FINALE BEWERTUNG

**Gesamtstatus:** SEHR GUT ✅

- Alle kritischen Schnittstellen konsistent
- Datenmodell durchgängig
- Business-Logik widerspruchsfrei
- Nur 3 minor Issues (nicht kritisch)

**Empfehlung:**
1. Slug-Historie UNIQUE constraint hinzufügen (5 Min)
2. Payout-Erstellung in Modul 06 explizit machen (2 Min)
3. Naming-Anpassung optional

**Danach:** Production-ready! 🚀

---

## 📊 GEPRÜFTE SCHNITTSTELLEN

| Schnittstelle | Module | Status |
|---------------|--------|--------|
| User → Product (sellerId) | 01 ↔ 02 | ✅ |
| Product → Certificate | 02 ↔ 03 | ✅ |
| Product → Cart (Varianten) | 02 ↔ 05 | ✅ |
| Cart → Order | 05 ↔ 06 | ✅ |
| Order → Payment | 06 ↔ 07 | ✅ |
| Product → Files | 02 ↔ 08 | ✅ |
| Certificate → Files | 03 ↔ 08 | ✅ |
| Matching → All | 04 ↔ 01,02,03 | ✅ |
| Email → All | 10 ↔ All | ✅ |
| Admin → All | 09 ↔ All | ✅ |

**Alle 10 Schnittstellen: KONSISTENT** ✅
