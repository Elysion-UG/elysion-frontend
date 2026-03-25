# Modul 06: Order Management
## Spezifikation & Requirements

**Verantwortlichkeit:** Bestellverwaltung, Status-Tracking, Versand  
**Abhängigkeiten:** Modul 01 (Auth), Modul 02 (Products), Modul 05 (Cart), Modul 07 (Payment)  
**Priorität:** CRITICAL

---

## 1. Überblick

Dieses Modul verwaltet Bestellungen vom Checkout bis zur Auslieferung. Es trackt den Status, verwaltet Rücksendungen und koordiniert mit Payment & Versand.

### Was das Modul macht:

- **Bestellung erstellen** - Aus Warenkorb nach erfolgreicher Zahlung
- **Status-Tracking** - Von PENDING bis DELIVERED
- **Lagerbestand finalisieren** - Stock abziehen, Reservierung aufheben
- **Bestellhistorie** - Für Käufer & Verkäufer
- **Rücksendungen** - Return-Requests & Refunds
- **Multi-Vendor** - Eine Bestellung kann Produkte von mehreren Verkäufern enthalten
- **Versand-Integration** - Tracking-Nummern, Carrier

### Kern-Konzept: Multi-Vendor Order Splitting

```
Kunde bestellt:
  - 2× T-Shirt von Verkäufer A
  - 1× Hose von Verkäufer B
  - 1× Schuhe von Verkäufer A

→ System erstellt 1 Order (für Kunde)
→ Aber 2 OrderGroups (eine pro Verkäufer)
  
OrderGroup A:
  - 2× T-Shirt
  - 1× Schuhe
  
OrderGroup B:
  - 1× Hose

Warum?
  - Jeder Verkäufer versendet separat
  - Separate Tracking-Nummern
  - Separate Auszahlungen (Modul 07)
```

### Schnittstellen zu anderen Modulen:

**Benötigt:**
- Modul 01: User-Daten
- Modul 02: Produkt-/Varianten-Daten, Lagerbestand
- Modul 05: Cart-Daten (beim Erstellen)
- Modul 07: Payment-Status
- Modul 10: E-Mails (Bestätigung, Versand, etc.)

**Beeinflusst:**
- Modul 02: Aktualisiert `variant.stock` & `variant.reserved`
- Modul 07: Triggert Auszahlung an Verkäufer

---

## 2. Datenmodell

### 2.1 Order (Hauptbestellung)

Eine Order repräsentiert eine Bestellung eines Käufers.

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **orderNumber** | String | Ja | Menschenlesbar: "ORD-2024-00123" |
| **userId** | UUID | Nein | Käufer (NULL wenn Gast) |
| **guestEmail** | String | Nein | E-Mail (wenn Gast-Bestellung) |
| **status** | Enum | Ja | PENDING / CONFIRMED / PROCESSING / SHIPPED / DELIVERED / CANCELLED |
| **paymentStatus** | Enum | Ja | PENDING / PAID / FAILED / REFUNDED |
| **paymentIntentId** | String | Nein | Payment-ID aus Modul 07 |
| **subtotal** | Decimal (10,2) | Ja | Summe aller Items |
| **shippingCost** | Decimal (10,2) | Ja | Versandkosten |
| **tax** | Decimal (10,2) | Ja | Mehrwertsteuer |
| **total** | Decimal (10,2) | Ja | Gesamtbetrag |
| **currency** | String (3) | Ja | "EUR" |
| **shippingAddress** | JSONB | Ja | Lieferadresse (gespeichert als JSON) |
| **billingAddress** | JSONB | Nein | Rechnungsadresse (optional, sonst = shippingAddress) |
| **notes** | Text | Nein | Kundennotiz |
| **createdAt** | Timestamp | Ja | Bestellzeitpunkt |
| **updatedAt** | Timestamp | Ja | Letzte Änderung |

**Status-Bedeutung:**

```
PENDING    = Erstellt, Zahlung noch nicht bestätigt
CONFIRMED  = Zahlung erfolgreich
PROCESSING = In Bearbeitung (Verkäufer bereitet vor)
SHIPPED    = Alle OrderGroups versendet
DELIVERED  = Alle OrderGroups zugestellt
CANCELLED  = Storniert (vor Versand)
```

**Status-Übergänge:**

```
PENDING → CONFIRMED (Zahlung erfolgreich - Modul 07)
CONFIRMED → PROCESSING (Verkäufer bereitet vor)
PROCESSING → SHIPPED (alle OrderGroups shipped)
SHIPPED → DELIVERED (alle OrderGroups delivered)

PENDING → CANCELLED (Zahlung fehlgeschlagen)
CONFIRMED → CANCELLED (Stornierung durch Kunde, vor Versand)
```

**Constraint:** Entweder `userId` ODER `guestEmail` muss gesetzt sein.

```sql
CHECK (
  (userId IS NOT NULL AND guestEmail IS NULL) OR
  (userId IS NULL AND guestEmail IS NOT NULL)
)
```

**Indizes:**

```sql
CREATE INDEX idx_order_user ON orders(userId, createdAt DESC);
CREATE INDEX idx_order_guest ON orders(guestEmail, createdAt DESC);
CREATE INDEX idx_order_number ON orders(orderNumber);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_created ON orders(createdAt DESC);
```

---

### 2.2 OrderGroup (Verkäufer-spezifische Teil-Bestellung)

Eine OrderGroup enthält alle Items einer Bestellung, die von einem Verkäufer kommen.

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **orderId** | UUID | Ja | Zu welcher Order gehört diese Group |
| **sellerId** | UUID | Ja | Welcher Verkäufer |
| **status** | Enum | Ja | PENDING / CONFIRMED / PROCESSING / SHIPPED / DELIVERED / CANCELLED |
| **subtotal** | Decimal (10,2) | Ja | Summe dieser Group |
| **shippingCost** | Decimal (10,2) | Ja | Anteilige Versandkosten |
| **tax** | Decimal (10,2) | Ja | Anteilige MwSt |
| **total** | Decimal (10,2) | Ja | Summe dieser Group |
| **trackingNumber** | String | Nein | Versand-Tracking-Nummer |
| **carrier** | String | Nein | Versanddienstleister (DHL, UPS, etc.) |
| **shippedAt** | Timestamp | Nein | Wann versendet |
| **deliveredAt** | Timestamp | Nein | Wann zugestellt |
| **createdAt** | Timestamp | Ja | |
| **updatedAt** | Timestamp | Ja | |

**Status-Bedeutung:**

```
PENDING    = Warte auf Zahlung
CONFIRMED  = Zahlung da, Verkäufer muss bearbeiten
PROCESSING = Verkäufer bereitet vor
SHIPPED    = Versendet
DELIVERED  = Zugestellt
CANCELLED  = Storniert
```

**Wichtig:** Order.status wird automatisch aktualisiert wenn alle OrderGroups gleichen Status haben.

```
Wenn ALLE OrderGroups = SHIPPED:
  → Order.status = SHIPPED

Wenn ALLE OrderGroups = DELIVERED:
  → Order.status = DELIVERED
```

**Indizes:**

```sql
CREATE INDEX idx_order_group_order ON order_group(orderId);
CREATE INDEX idx_order_group_seller ON order_group(sellerId, status);
```

---

### 2.3 OrderItem (Einzelne Artikel in Bestellung)

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **orderGroupId** | UUID | Ja | Zu welcher OrderGroup |
| **variantId** | UUID | Ja | Welche Variante (aus Modul 02) |
| **quantity** | Integer | Ja | Anzahl |
| **pricePerUnit** | Decimal (10,2) | Ja | Preis zum Zeitpunkt der Bestellung |
| **subtotal** | Decimal (10,2) | Ja | quantity × pricePerUnit |
| **product_snapshot** | JSONB | Ja | Produkt-Daten (Name, Bild, etc.) als Backup |

**Warum product_snapshot?**

```
Produkt kann später gelöscht/geändert werden.
Bestellung muss aber immer anzeigen können:
  - Was wurde gekauft
  - Wie sah es aus
  - Wie hieß es

→ Snapshot bei Bestellung erstellen
```

**product_snapshot Struktur:**

```json
{
  "productId": "uuid",
  "productName": "Bio-T-Shirt",
  "productSlug": "bio-t-shirt",
  "variantSku": "SHIRT-M-RED",
  "variantOptions": [
    { "type": "SIZE", "value": "M" },
    { "type": "COLOR", "value": "Rot" }
  ],
  "mainImage": "https://..."
}
```

**Indizes:**

```sql
CREATE INDEX idx_order_item_group ON order_item(orderGroupId);
CREATE INDEX idx_order_item_variant ON order_item(variantId);
```

---

### 2.4 OrderStatusHistory (Audit-Log)

Protokolliert alle Status-Änderungen.

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **orderId** | UUID | Nein | Wenn Order-Status |
| **orderGroupId** | UUID | Nein | Wenn OrderGroup-Status |
| **oldStatus** | String | Nein | Vorheriger Status |
| **newStatus** | String | Ja | Neuer Status |
| **changedBy** | UUID | Nein | User-ID (Verkäufer, Admin, System) |
| **reason** | Text | Nein | Optional: Begründung |
| **createdAt** | Timestamp | Ja | Wann geändert |

**Beispiel:**

```json
{
  "orderId": "order-123",
  "oldStatus": "CONFIRMED",
  "newStatus": "PROCESSING",
  "changedBy": "seller-456",
  "reason": "Bestellung in Bearbeitung",
  "createdAt": "2024-02-19T10:30:00Z"
}
```

---

### 2.5 Return (Rücksendungen)

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **orderGroupId** | UUID | Ja | Welche OrderGroup |
| **requestedBy** | UUID | Ja | Käufer |
| **status** | Enum | Ja | REQUESTED / APPROVED / REJECTED / RECEIVED / REFUNDED |
| **reason** | Text | Ja | Grund für Rücksendung |
| **items** | JSONB | Ja | Welche Items (kann Teil-Rücksendung sein) |
| **refundAmount** | Decimal (10,2) | Ja | Rückerstattungsbetrag |
| **adminNotes** | Text | Nein | Interne Notizen |
| **createdAt** | Timestamp | Ja | |
| **updatedAt** | Timestamp | Ja | |

**Status-Flow:**

```
REQUESTED  → Kunde stellt Antrag
APPROVED   → Verkäufer/Admin akzeptiert
REJECTED   → Verkäufer/Admin lehnt ab
RECEIVED   → Ware wurde zurückgesendet
REFUNDED   → Geld wurde erstattet
```

---

## 3. API-Endpoints

### 3.1 POST /checkout/complete (Order erstellen)

**Wird von Modul 05 aufgerufen nach erfolgreicher Zahlung.**

**Request (von Modul 05):**

```json
{
  "cartId": "cart-123",
  "paymentIntentId": "pi_xxx",
  "shippingAddress": { ... },
  "billingAddress": { ... }
}
```

**Workflow:**

```
1. Zahlung verifizieren (Modul 07):
   payment = PaymentService.verify(paymentIntentId)
   if (payment.status != 'succeeded'):
     throw Error("Zahlung fehlgeschlagen")

2. Cart-Items holen:
   items = SELECT * FROM cart_item WHERE cartId = :cartId

3. Nach Verkäufer gruppieren:
   itemsBySeller = groupBy(items, item.variant.product.sellerId)

4. Order erstellen:
   BEGIN TRANSACTION;
   
   a) Erstelle Order:
      INSERT INTO orders (
        userId, orderNumber, status, paymentStatus,
        subtotal, shippingCost, tax, total,
        shippingAddress, ...
      ) VALUES (...)
   
   b) Für jeden Verkäufer → OrderGroup erstellen:
      for (sellerId, sellerItems) in itemsBySeller:
        
        INSERT INTO order_group (
          orderId, sellerId, status, subtotal, ...
        ) VALUES (...)
        
        c) OrderItems erstellen:
           for item in sellerItems:
             
             # Produkt-Snapshot erstellen
             snapshot = {
               productId: item.variant.product.id,
               productName: item.variant.product.name,
               ...
             }
             
             INSERT INTO order_item (
               orderGroupId, variantId, quantity,
               pricePerUnit, subtotal, product_snapshot
             ) VALUES (...)
   
   d) Lagerbestand finalisieren:
      for item in items:
        
        # Stock abziehen, Reservierung aufheben
        UPDATE variant
        SET stock = stock - item.quantity,
            reserved = reserved - item.quantity
        WHERE id = item.variantId
   
   e) Warenkorb leeren:
      DELETE FROM cart_item WHERE cartId = :cartId
      DELETE FROM cart WHERE id = :cartId
   
   COMMIT;

5. E-Mail senden (Modul 10):
   - An Kunde: Bestellbestätigung
   - An jeden Verkäufer: Neue Bestellung
```

**Response (201 Created):**

```json
{
  "status": "success",
  "message": "Bestellung erfolgreich!",
  "data": {
    "orderId": "order-123",
    "orderNumber": "ORD-2024-00123",
    "total": 76.28,
    "status": "CONFIRMED"
  }
}
```

---

### 3.2 GET /orders (Bestellübersicht)

**Käufer:** Eigene Bestellungen  
**Verkäufer:** OrderGroups die ihm gehören

**Wer darf:** Käufer oder Verkäufer

**Query-Parameter:**

```
?status=SHIPPED
&page=1
&limit=20
```

**Response (Käufer):**

```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "id": "order-123",
        "orderNumber": "ORD-2024-00123",
        "status": "SHIPPED",
        "total": 76.28,
        "createdAt": "2024-02-19T10:00:00Z",
        "itemsCount": 3,
        "groups": [
          {
            "id": "group-1",
            "seller": { "name": "Öko-Fashion" },
            "status": "SHIPPED",
            "trackingNumber": "DHL1234567890"
          }
        ]
      }
    ],
    "pagination": { ... }
  }
}
```

**Response (Verkäufer):**

```json
{
  "status": "success",
  "data": {
    "orderGroups": [
      {
        "id": "group-1",
        "orderId": "order-123",
        "orderNumber": "ORD-2024-00123",
        "status": "CONFIRMED",
        "total": 59.98,
        "items": [
          {
            "productName": "Bio-T-Shirt",
            "variantOptions": [
              { "type": "SIZE", "value": "M" }
            ],
            "quantity": 2,
            "pricePerUnit": 29.99
          }
        ],
        "shippingAddress": { ... },
        "createdAt": "2024-02-19T10:00:00Z"
      }
    ]
  }
}
```

---

### 3.3 GET /orders/:id (Bestelldetails)

**Wer darf:** Käufer (eigene), Verkäufer (eigene Groups), Admin (alle)

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "order-123",
    "orderNumber": "ORD-2024-00123",
    "status": "SHIPPED",
    "paymentStatus": "PAID",
    "subtotal": 59.98,
    "shippingCost": 4.90,
    "tax": 11.40,
    "total": 76.28,
    "shippingAddress": {
      "firstName": "Max",
      "lastName": "Mustermann",
      "street": "Hauptstraße",
      "houseNumber": "123",
      "postalCode": "12345",
      "city": "Berlin",
      "country": "DE"
    },
    "groups": [
      {
        "id": "group-1",
        "seller": {
          "id": "seller-1",
          "name": "Öko-Fashion"
        },
        "status": "SHIPPED",
        "trackingNumber": "DHL1234567890",
        "carrier": "DHL",
        "shippedAt": "2024-02-20T14:00:00Z",
        "items": [
          {
            "id": "item-1",
            "productSnapshot": {
              "productName": "Bio-T-Shirt",
              "variantSku": "SHIRT-M-RED",
              "variantOptions": [
                { "type": "SIZE", "value": "M" },
                { "type": "COLOR", "value": "Rot" }
              ],
              "mainImage": "https://..."
            },
            "quantity": 2,
            "pricePerUnit": 29.99,
            "subtotal": 59.98
          }
        ]
      }
    ],
    "statusHistory": [
      {
        "status": "CONFIRMED",
        "timestamp": "2024-02-19T10:00:00Z"
      },
      {
        "status": "PROCESSING",
        "timestamp": "2024-02-19T15:00:00Z"
      },
      {
        "status": "SHIPPED",
        "timestamp": "2024-02-20T14:00:00Z"
      }
    ],
    "createdAt": "2024-02-19T10:00:00Z"
  }
}
```

---

### 3.4 PATCH /order-groups/:id/status (Status ändern - Verkäufer)

Verkäufer aktualisiert den Status seiner OrderGroup.

**Wer darf:** Nur Verkäufer der OrderGroup gehört

**Request:**

```json
{
  "status": "SHIPPED",
  "trackingNumber": "DHL1234567890",
  "carrier": "DHL"
}
```

**Validierung:**

```
orderGroup = SELECT * FROM order_group WHERE id = :id

if (orderGroup.sellerId != req.user.userId):
  throw Forbidden

Erlaubte Übergänge:
  CONFIRMED → PROCESSING
  PROCESSING → SHIPPED
  SHIPPED → DELIVERED
```

**Workflow:**

```
1. Update OrderGroup:
   UPDATE order_group
   SET status = :newStatus,
       trackingNumber = :trackingNumber,
       carrier = :carrier,
       shippedAt = NOW()
   WHERE id = :id

2. Status-History:
   INSERT INTO order_status_history (
     orderGroupId, oldStatus, newStatus, changedBy
   ) VALUES (...)

3. Order-Status aktualisieren:
   allGroups = SELECT * FROM order_group WHERE orderId = orderGroup.orderId
   
   if (all groups have status SHIPPED):
     UPDATE orders SET status = 'SHIPPED' WHERE id = orderGroup.orderId
   
   if (all groups have status DELIVERED):
     UPDATE orders SET status = 'DELIVERED' WHERE id = orderGroup.orderId

4. Auszahlung planen (Modul 07):
   if (newStatus == 'SHIPPED'):
     # Berechne Provision
     commission = calculateCommission(orderGroup.total)
     netAmount = orderGroup.total - commission
     
     # Erstelle Payout
     INSERT INTO payout (
       sellerId, orderGroupId,
       grossAmount, commission, amount,
       status, scheduledFor
     ) VALUES (
       orderGroup.sellerId,
       orderGroup.id,
       orderGroup.total,
       commission,
       netAmount,
       'PENDING',
       TODAY + 7 DAYS
     )

5. E-Mail an Kunde (Modul 10):
   if (newStatus == 'SHIPPED'):
     "Ihre Bestellung wurde versendet. Tracking: {trackingNumber}"
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Status aktualisiert"
}
```

---

### 3.5 POST /order-groups/:id/returns (Rücksendung beantragen - Käufer)

Käufer möchte Artikel zurückgeben.

**Wer darf:** Käufer der Bestellung

**Request:**

```json
{
  "reason": "Produkt entspricht nicht der Beschreibung",
  "items": [
    {
      "orderItemId": "item-1",
      "quantity": 1
    }
  ]
}
```

**Validierung:**

```
- OrderGroup muss DELIVERED sein (min. 1 Tag alt)
- Max. 14 Tage nach Zustellung (Widerrufsrecht)
- Items müssen zu OrderGroup gehören
```

**Workflow:**

```
1. Erstelle Return:
   INSERT INTO returns (
     orderGroupId, requestedBy, status, reason, items, refundAmount
   ) VALUES (...)

2. E-Mail an Verkäufer (Modul 10):
   "Rücksendeanfrage für Bestellung {orderNumber}"

3. E-Mail an Kunde:
   "Rücksendeanfrage erhalten. Verkäufer wird sich melden."
```

**Response (201 Created):**

```json
{
  "status": "success",
  "message": "Rücksendeanfrage erstellt",
  "data": {
    "returnId": "return-123",
    "status": "REQUESTED"
  }
}
```

---

### 3.6 PATCH /returns/:id/approve (Rücksendung genehmigen - Verkäufer)

**Wer darf:** Verkäufer der OrderGroup

**Request:**

```json
{
  "action": "approve"
}
```

**Workflow:**

```
1. Update Return:
   UPDATE returns SET status = 'APPROVED' WHERE id = :id

2. E-Mail an Kunde (Modul 10):
   "Rücksendung genehmigt. Bitte senden Sie die Artikel an: {address}"
```

---

## 4. Business-Logik

### 4.1 Order-Number-Generierung

```
Format: ORD-YYYY-NNNNN
Beispiel: ORD-2024-00123

Algorithmus:
  1. Jahr: 2024
  2. Counter: Nächste freie Nummer (auto-increment)
  3. Zero-Padding auf 5 Stellen
```

**Implementierung:**

```sql
-- Sequence pro Jahr
CREATE SEQUENCE order_number_2024_seq START WITH 1;

SELECT 'ORD-2024-' || LPAD(nextval('order_number_2024_seq')::TEXT, 5, '0');
```

---

### 4.2 Versandkosten-Berechnung

**Vereinfacht (für MVP):**

```
Gewicht berechnen:
  totalWeight = sum(item.quantity * variant.product.weight)

Versandkosten:
  if (totalWeight <= 1kg):
    shipping = 4.90
  else if (totalWeight <= 5kg):
    shipping = 6.90
  else:
    shipping = 9.90
```

**Später:**

- Versand-API (DHL, UPS)
- Regionale Preise
- Express-Versand
- Gratis ab X EUR

---

### 4.3 Multi-Vendor Aufteilung

```
Bestellung mit Items von 3 Verkäufern:

Versandkosten gesamt: 9.90 EUR

Aufteilung:
  Verkäufer A (60% des Gewichts) → 5.94 EUR
  Verkäufer B (30% des Gewichts) → 2.97 EUR
  Verkäufer C (10% des Gewichts) → 0.99 EUR
```

---

### 4.4 Stornierung

**Vor Versand:**

```
DELETE nicht möglich (Audit-Trail!)

STATTDESSEN:
  1. Status → CANCELLED
  2. Lagerbestand zurückbuchen:
     UPDATE variant
     SET stock = stock + item.quantity
     WHERE id = item.variantId
  
  3. Zahlung erstatten (Modul 07)
  4. E-Mail an Kunde & Verkäufer
```

**Nach Versand:**

```
Stornierung nicht möglich.
→ Rücksendung-Prozess nutzen
```

---

## 5. Performance

### 5.1 Indizes

Siehe Abschnitt 2 (bereits definiert).

### 5.2 Denormalisierung

**Warum product_snapshot?**

- Produkt kann gelöscht werden
- Preise können sich ändern
- Bestellung muss historisch korrekt bleiben

→ Alle relevanten Daten bei Bestellung speichern

---

## 6. Sicherheit

### 6.1 Zugriffskontrolle

```
Käufer:
  - Sieht nur eigene Bestellungen (order.userId == req.user.userId)

Verkäufer:
  - Sieht nur OrderGroups wo (orderGroup.sellerId == req.user.userId)
  - Darf nur eigene OrderGroups bearbeiten

Admin:
  - Sieht alles
  - Darf alles
```

### 6.2 Sensible Daten

**Adressen in JSONB:**

```
Warum nicht separate Tabelle?
  - Adresse kann sich ändern
  - Bestellung muss historisch korrekt bleiben
  - JSONB ist einfacher für Snapshots
```

---

## 7. Wichtige Hinweise für Entwickler

### 7.1 Transaktionale Integrität

**Bei Order-Erstellung:**

```
ALLES in EINER Transaktion:
  - Order erstellen
  - OrderGroups erstellen
  - OrderItems erstellen
  - Lagerbestand abziehen
  - Cart leeren

Bei Fehler → ROLLBACK (nichts passiert)
```

### 7.2 Status-Konsistenz

```
Order.status ist abgeleitet von OrderGroup.status:

Wenn ALLE OrderGroups = SHIPPED:
  → Order.status = SHIPPED

NIEMALS manuell Order.status setzen!
Immer über OrderGroup-Updates.
```

---

**Der Entwickler entscheidet:**
- Backend-Technologie & Framework
- Datenbank (PostgreSQL empfohlen)
- Sequence-Strategie für Order-Number
- Versand-API-Integration
- E-Mail-Templates
- Projektstruktur
