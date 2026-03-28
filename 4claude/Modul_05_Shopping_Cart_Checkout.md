# Modul 05: Shopping Cart & Checkout

## Spezifikation & Requirements

**Verantwortlichkeit:** Warenkorb, Checkout-Prozess, Bestellabschluss  
**Abhängigkeiten:** Modul 01 (Auth), Modul 02 (Products/Variants)  
**Priorität:** CRITICAL

---

## 1. Überblick

Dieses Modul verwaltet den Warenkorb und den Checkout-Prozess. User (eingeloggt oder Gast) können Produkte in den Warenkorb legen und Bestellungen aufgeben.

### Was das Modul macht:

- **Warenkorb-Verwaltung** - Artikel hinzufügen, ändern, entfernen
- **Gast-Warenkorb** - Auch ohne Login möglich (Session/Cookie)
- **Warenkorb-Merge** - Bei Login: Gast-Warenkorb + User-Warenkorb zusammenführen
- **Lagerbestand-Reservierung** - Atomare Reservierung (aus Modul 02)
- **Checkout-Prozess** - Multi-Step: Adresse → Versand → Zahlung → Bestätigung
- **Preisvalidierung** - Sicherstellen dass Preise stimmen
- **Bestellabschluss** - Übergang zu Modul 06 (Order Management)

### Wichtig:

**Gast vs. Eingeloggter User:**

| Feature               | Gast                   | Eingeloggter User |
| --------------------- | ---------------------- | ----------------- |
| Warenkorb hinzufügen  | ✅ Ja (Session/Cookie) | ✅ Ja (Datenbank) |
| Warenkorb persistiert | ❌ Nein (24h Session)  | ✅ Ja (permanent) |
| Checkout möglich      | ✅ Ja (mit E-Mail)     | ✅ Ja             |
| Adresse speichern     | ❌ Nein                | ✅ Ja             |
| Bestellhistorie       | ❌ Nein                | ✅ Ja             |

### Schnittstellen zu anderen Modulen:

**Benötigt:**

- Modul 01: User-Daten, Adressen
- Modul 02: Produkte, Varianten, Lagerbestand (atomare Reservierung!)
- Modul 06: Order erstellen (nach Checkout)
- Modul 07: Payment initiieren

**Beeinflusst:**

- Modul 02: Aktualisiert `variant.reserved` (atomare Reservierung)

---

## 2. Datenmodell

### 2.1 Cart (Warenkorb)

Ein Warenkorb gehört entweder einem User ODER einem Gast (Session).

| Feld          | Typ       | Pflicht | Bedeutung                               |
| ------------- | --------- | ------- | --------------------------------------- |
| **id**        | UUID      | Ja      | Primärschlüssel                         |
| **userId**    | UUID      | Nein    | Wenn eingeloggt: User-ID (aus Modul 01) |
| **sessionId** | String    | Nein    | Wenn Gast: Session-ID (UUID in Cookie)  |
| **createdAt** | Timestamp | Ja      | Wann erstellt                           |
| **updatedAt** | Timestamp | Ja      | Letzte Änderung                         |

**Constraint:** Entweder `userId` ODER `sessionId` muss gesetzt sein (nicht beide, nicht keins).

```sql
CHECK (
  (userId IS NOT NULL AND sessionId IS NULL) OR
  (userId IS NULL AND sessionId IS NOT NULL)
)
```

**Indizes:**

```sql
CREATE INDEX idx_cart_user ON cart(userId);
CREATE INDEX idx_cart_session ON cart(sessionId);
CREATE INDEX idx_cart_updated ON cart(updatedAt);
```

---

### 2.2 CartItem (Warenkorb-Artikel)

Ein Artikel im Warenkorb.

| Feld              | Typ            | Pflicht | Bedeutung                                  |
| ----------------- | -------------- | ------- | ------------------------------------------ |
| **id**            | UUID           | Ja      | Primärschlüssel                            |
| **cartId**        | UUID           | Ja      | Zu welchem Warenkorb                       |
| **variantId**     | UUID           | Ja      | **Variante** (nicht Produkt!) aus Modul 02 |
| **quantity**      | Integer        | Ja      | Anzahl (min. 1)                            |
| **priceSnapshot** | Decimal (10,2) | Ja      | Preis bei Hinzufügen (für Validierung)     |
| **addedAt**       | Timestamp      | Ja      | Wann hinzugefügt                           |

**Wichtig:**

- **Nicht das Produkt, sondern die Variante!** (`variantId`)
- Warum? Weil Varianten verschiedene Preise/SKUs haben können
- Ein Produkt mit 3 Größen → 3 verschiedene Varianten → können separat im Warenkorb sein

**Unique Constraint:**

```sql
CREATE UNIQUE INDEX idx_cart_item_unique ON cart_item(cartId, variantId);
```

Warum? Ein User kann nicht die gleiche Variante 2× im Warenkorb haben (nur Quantity erhöhen).

**Indizes:**

```sql
CREATE INDEX idx_cart_item_cart ON cart_item(cartId);
CREATE INDEX idx_cart_item_variant ON cart_item(variantId);
```

---

## 3. API-Endpoints

### 3.1 GET /cart (Warenkorb abrufen)

Holt den aktuellen Warenkorb.

**Wer darf:** Jeder (Gast oder User)

**Wie wird Warenkorb identifiziert:**

```
Wenn User eingeloggt:
  cart = SELECT * FROM cart WHERE userId = req.user.userId

Wenn Gast:
  sessionId = Cookie "cart_session_id"

  if (!sessionId):
    sessionId = generateUUID()
    Set-Cookie: cart_session_id = sessionId (24h)

  cart = SELECT * FROM cart WHERE sessionId = sessionId
```

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "cartId": "cart-123",
    "items": [
      {
        "id": "item-1",
        "variant": {
          "id": "variant-1",
          "sku": "SHIRT-M-RED",
          "product": {
            "id": "product-1",
            "name": "Bio-T-Shirt",
            "slug": "bio-t-shirt",
            "mainImage": "https://..."
          },
          "options": [
            { "type": "SIZE", "value": "M" },
            { "type": "COLOR", "value": "Rot" }
          ],
          "price": 29.99,
          "stock": 10,
          "reserved": 5,
          "available": 5
        },
        "quantity": 2,
        "priceSnapshot": 29.99,
        "subtotal": 59.98
      }
    ],
    "summary": {
      "subtotal": 59.98,
      "tax": 11.4,
      "shipping": 4.9,
      "total": 76.28,
      "itemCount": 2
    }
  }
}
```

---

### 3.2 POST /cart/items (Artikel hinzufügen)

Fügt einen Artikel zum Warenkorb hinzu.

**Wer darf:** Jeder (Gast oder User)

**Request:**

```json
{
  "variantId": "variant-1",
  "quantity": 2
}
```

**Validierung:**

```
1. Variante existiert:
   variant = SELECT * FROM variant WHERE id = :variantId

   if (!variant):
     throw Error("Variante nicht gefunden")

2. Produkt ist aktiv:
   product = SELECT * FROM products WHERE id = variant.productId

   if (product.status != 'ACTIVE'):
     throw Error("Produkt nicht verfügbar")

3. Genug Lagerbestand:
   available = variant.stock - variant.reserved

   if (available < :quantity):
     throw Error("Nur noch {available} verfügbar")
```

**Workflow:**

```
1. Warenkorb holen/erstellen:
   cart = getOrCreateCart(userId oder sessionId)

2. Prüfen ob Variante bereits im Warenkorb:
   existing = SELECT * FROM cart_item
              WHERE cartId = cart.id AND variantId = :variantId

   if (existing):
     # Quantity erhöhen
     newQuantity = existing.quantity + :quantity

     # Verfügbarkeit prüfen
     if (variant.available < newQuantity):
       throw Error("Nur noch X verfügbar")

     UPDATE cart_item SET quantity = newQuantity WHERE id = existing.id

   else:
     # Neu hinzufügen
     INSERT INTO cart_item (cartId, variantId, quantity, priceSnapshot)
     VALUES (cart.id, :variantId, :quantity, variant.price)

3. Lagerbestand ATOMAR reservieren (aus Modul 02):

   BEGIN TRANSACTION;

   UPDATE variant
   SET reserved = reserved + :quantity
   WHERE id = :variantId
   AND (stock - reserved) >= :quantity;

   IF (rowsAffected == 0):
     ROLLBACK;
     throw Error("Nicht genug verfügbar");

   COMMIT;
```

**Response (201 Created):**

```json
{
  "status": "success",
  "message": "Artikel hinzugefügt",
  "data": {
    "cartId": "cart-123",
    "itemCount": 3
  }
}
```

---

### 3.3 PATCH /cart/items/:id (Menge ändern)

Ändert die Quantity eines Artikels.

**Wer darf:** Jeder (eigener Warenkorb)

**Request:**

```json
{
  "quantity": 5
}
```

**Workflow:**

```
1. CartItem holen:
   item = SELECT * FROM cart_item WHERE id = :id

   # Prüfen ob User Zugriff hat
   cart = SELECT * FROM cart WHERE id = item.cartId
   if (cart.userId != req.user.userId AND cart.sessionId != req.session.id):
     throw Forbidden

2. Quantity-Differenz berechnen:
   diff = newQuantity - item.quantity

   if (diff > 0):
     # Mehr bestellen → Reservierung erhöhen

     BEGIN TRANSACTION;

     UPDATE variant
     SET reserved = reserved + diff
     WHERE id = item.variantId
     AND (stock - reserved) >= diff;

     IF (rowsAffected == 0):
       ROLLBACK;
       throw Error("Nicht genug verfügbar");

     COMMIT;

   else if (diff < 0):
     # Weniger bestellen → Reservierung reduzieren

     UPDATE variant
     SET reserved = reserved + diff  # (diff ist negativ!)
     WHERE id = item.variantId;

3. CartItem updaten:
   UPDATE cart_item SET quantity = :newQuantity WHERE id = :id
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Menge aktualisiert"
}
```

---

### 3.4 DELETE /cart/items/:id (Artikel entfernen)

Entfernt einen Artikel aus dem Warenkorb.

**Wer darf:** Jeder (eigener Warenkorb)

**Workflow:**

```
1. CartItem holen & validieren (wie bei PATCH)

2. Reservierung freigeben:
   UPDATE variant
   SET reserved = reserved - item.quantity
   WHERE id = item.variantId;

3. Item löschen:
   DELETE FROM cart_item WHERE id = :id
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Artikel entfernt"
}
```

---

### 3.5 POST /auth/login (mit Warenkorb-Merge)

**Erweiterung zu Modul 01:**

Wenn User einloggt und vorher als Gast Artikel im Warenkorb hatte:

**Workflow:**

```
1. Normale Login-Logik (Modul 01)

2. Prüfe ob Gast-Warenkorb existiert:
   guestSessionId = Cookie "cart_session_id"

   guestCart = SELECT * FROM cart WHERE sessionId = guestSessionId

   if (!guestCart):
     return  # Kein Gast-Warenkorb, nichts zu mergen

3. Hole User-Warenkorb:
   userCart = SELECT * FROM cart WHERE userId = user.id

   if (!userCart):
     # User hatte noch keinen Warenkorb
     # → Gast-Warenkorb zu User umwandeln

     UPDATE cart
     SET userId = user.id, sessionId = NULL
     WHERE id = guestCart.id

     return

4. Beide Warenkörbe mergen:

   guestItems = SELECT * FROM cart_item WHERE cartId = guestCart.id

   for item in guestItems:

     # Prüfe ob gleiche Variante im User-Warenkorb
     existing = SELECT * FROM cart_item
                WHERE cartId = userCart.id
                AND variantId = item.variantId

     if (existing):
       # Quantities addieren
       newQuantity = existing.quantity + item.quantity

       # Validieren
       variant = SELECT * FROM variant WHERE id = item.variantId
       if (variant.available >= newQuantity):
         UPDATE cart_item SET quantity = newQuantity WHERE id = existing.id
         # Reservierung wurde bereits bei Hinzufügen gemacht
       else:
         # Nicht genug verfügbar → Höchstmenge nehmen
         maxQuantity = variant.available
         UPDATE cart_item SET quantity = maxQuantity WHERE id = existing.id
         # User benachrichtigen

     else:
       # Item verschieben
       UPDATE cart_item SET cartId = userCart.id WHERE id = item.id

5. Gast-Warenkorb löschen:
   DELETE FROM cart WHERE id = guestCart.id

6. Cookie löschen:
   Clear-Cookie: cart_session_id
```

---

### 3.6 POST /checkout (Checkout starten)

Startet den Checkout-Prozess.

**Wer darf:** Jeder (Gast oder User)

**Request:**

```json
{
  "email": "kunde@example.com", // Wenn Gast
  "shippingAddressId": "addr-1", // Wenn User (gespeicherte Adresse)
  "shippingAddress": {
    // Wenn Gast (neue Adresse)
    "firstName": "Max",
    "lastName": "Mustermann",
    "street": "Hauptstraße",
    "houseNumber": "123",
    "postalCode": "12345",
    "city": "Berlin",
    "country": "DE"
  }
}
```

**Validierung:**

```
1. Warenkorb nicht leer:
   items = SELECT * FROM cart_item WHERE cartId = cart.id

   if (items.length == 0):
     throw Error("Warenkorb ist leer")

2. Alle Artikel verfügbar:
   for item in items:
     variant = SELECT * FROM variant WHERE id = item.variantId

     if (variant.available < item.quantity):
       throw Error("Artikel {product.name} nicht mehr verfügbar")

3. Preise validieren:
   for item in items:
     variant = SELECT * FROM variant WHERE id = item.variantId

     currentPrice = variant.price ? variant.price : product.basePrice

     if (currentPrice != item.priceSnapshot):
       # Preis hat sich geändert
       # → User informieren, nicht automatisch updaten
       throw Error("Preis für {product.name} hat sich geändert")
```

**Workflow:**

```
1. Erstelle Order (Modul 06):
   order = OrderService.create({
     userId: user.id (oder null wenn Gast),
     email: request.email (wenn Gast),
     shippingAddress: ...,
     items: cart.items,
     status: 'PENDING'
   })

2. Berechne Versandkosten (später, hier vereinfacht):
   shipping = calculateShipping(order.items, shippingAddress)

3. Erstelle Payment-Intent (Modul 07):
   payment = PaymentService.createIntent({
     orderId: order.id,
     amount: order.total,
     currency: 'EUR'
   })

4. Reservierungen bleiben (nicht freigeben!)
   # Werden erst bei Bestellung freigegeben oder bei Abbruch

5. Warenkorb leeren (NACH erfolgreicher Zahlung):
   # Nicht jetzt, sondern in POST /checkout/complete
```

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "orderId": "order-123",
    "paymentClientSecret": "pi_xxx_secret_yyy",
    "amount": 76.28,
    "currency": "EUR"
  }
}
```

**Frontend macht dann:**

- Zeigt Stripe/PayPal Payment-Form
- User zahlt
- Bei Erfolg: POST /checkout/complete

---

### 3.7 POST /checkout/complete (Checkout abschließen)

Nach erfolgreicher Zahlung.

**Wer darf:** Jeder (muss orderId kennen)

**Request:**

```json
{
  "orderId": "order-123",
  "paymentIntentId": "pi_xxx"
}
```

**Workflow:**

```
1. Zahlung verifizieren (Modul 07):
   payment = PaymentService.verify(paymentIntentId)

   if (payment.status != 'succeeded'):
     throw Error("Zahlung nicht erfolgreich")

2. Order finalisieren (Modul 06):
   OrderService.complete(orderId)

   # Modul 06 macht dann:
   # - Status: PENDING → CONFIRMED
   # - Lagerbestand abziehen (stock -= quantity)
   # - Reservierung aufheben (reserved -= quantity)
   # - E-Mail an Kunde (Modul 10)

3. Warenkorb leeren:
   DELETE FROM cart_item WHERE cartId = cart.id

4. Warenkorb löschen (wenn Gast):
   if (cart.sessionId):
     DELETE FROM cart WHERE id = cart.id
     Clear-Cookie: cart_session_id
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Bestellung erfolgreich!",
  "data": {
    "orderId": "order-123",
    "orderNumber": "ORD-2024-00123"
  }
}
```

---

## 4. Business-Logik

### 4.1 Warenkorb-Cleanup (Cronjob)

**Problem:** Gast-Warenkörbe blockieren Lagerbestand, aber User kauft nie.

**Lösung:** Cleanup-Job (täglich):

```
1. Finde alte Gast-Warenkörbe:
   SELECT * FROM cart
   WHERE sessionId IS NOT NULL
   AND updatedAt < NOW() - INTERVAL '24 hours'

2. Für jeden:

   a) Reservierungen freigeben:
      items = SELECT * FROM cart_item WHERE cartId = cart.id

      for item in items:
        UPDATE variant
        SET reserved = reserved - item.quantity
        WHERE id = item.variantId

   b) Warenkorb löschen:
      DELETE FROM cart_item WHERE cartId = cart.id
      DELETE FROM cart WHERE id = cart.id
```

**Pseudo-Code:**

```
function cleanupAbandonedCarts():

  oldCarts = SELECT * FROM cart
             WHERE sessionId IS NOT NULL
             AND updatedAt < NOW() - INTERVAL '24 hours'

  for cart in oldCarts:

    # Reservierungen freigeben
    items = SELECT * FROM cart_item WHERE cartId = cart.id

    for item in items:
      UPDATE variant
      SET reserved = reserved - item.quantity
      WHERE id = item.variantId

    # Löschen
    DELETE FROM cart_item WHERE cartId = cart.id
    DELETE FROM cart WHERE id = cart.id
```

**Zeitpunkt:** Täglich um 3 Uhr morgens

---

### 4.2 Preisvalidierung

**Wichtig:** Preise können sich zwischen "In Warenkorb legen" und "Checkout" ändern.

**Strategie:**

```
1. Bei Hinzufügen: priceSnapshot speichern
2. Bei Checkout: Vergleichen
3. Wenn unterschiedlich: User informieren, NICHT automatisch updaten

Warum nicht automatisch?
  - Transparenz
  - User könnte Order abbrechen wollen
  - Gesetzliche Anforderungen (Preis-Änderung muss akzeptiert werden)
```

**Flow:**

```
User legt Produkt in Warenkorb (Preis: 29.99)
  → cart_item.priceSnapshot = 29.99

Verkäufer ändert Preis auf 34.99

User geht zu Checkout
  → System prüft: 34.99 != 29.99
  → Error: "Preis hat sich geändert. Bitte überprüfen Sie Ihren Warenkorb."
  → Frontend zeigt: Alter Preis (durchgestrichen) + Neuer Preis
  → User muss Warenkorb neu laden (damit priceSnapshot aktualisiert wird)
```

---

### 4.3 Verfügbarkeits-Prüfung

**Wann prüfen:**

1. **Beim Hinzufügen** - Atomare Reservierung (bereits implementiert)
2. **Bei Quantity-Änderung** - Atomare Aktualisierung
3. **Beim Checkout** - Nochmal alle prüfen

**Warum mehrfach?**

```
User A und B legen gleichzeitig Produkt in Warenkorb
  stock = 10, beide reservieren je 8
  → reserved = 16 (überschreitet stock!)

Atomare Reservierung verhindert das:
  User A: UPDATE ... WHERE (stock - reserved) >= 8 → OK
  User B: UPDATE ... WHERE (stock - reserved) >= 8 → FAIL (nur noch 2 verfügbar)
```

---

## 5. Performance

### 5.1 Datenbank-Indizes

Siehe Abschnitt 2 (bereits definiert).

### 5.2 Caching

**Warenkorb cachen:**

```
Key: "cart:{userId}" oder "cart:session:{sessionId}"
TTL: 5 Minuten

Invalidierung:
  - Bei Änderung (ADD, UPDATE, DELETE)
  - Bei Checkout
```

**Warum kurze TTL?**

- Lagerbestand ändert sich häufig
- Preise können sich ändern
- Besser zu oft neu laden als veraltete Daten zeigen

---

## 6. Sicherheit

### 6.1 Session-ID-Generierung

```
sessionId = cryptographically_secure_UUID()

Nicht:
  - Vorhersehbare IDs
  - Sequentielle Nummern
  - Timestamp-basiert
```

### 6.2 Warenkorb-Zugriffskontrolle

```
User darf nur eigenen Warenkorb sehen/ändern:

if (cart.userId && cart.userId != req.user.userId):
  throw Forbidden

if (cart.sessionId && cart.sessionId != req.session.id):
  throw Forbidden
```

### 6.3 Quantity-Limits

```
Max. Quantity pro Artikel: 100
  (verhindert Missbrauch)

Wenn User > 100 braucht:
  → Kontaktformular nutzen
```

---

## 7. Fehlerbehandlung

### 7.1 Atomare Reservierung schlägt fehl

**Was tun?**

```
Response (409 Conflict):
{
  "status": "error",
  "code": "INSUFFICIENT_STOCK",
  "message": "Nur noch 3 verfügbar",
  "data": {
    "requested": 5,
    "available": 3
  }
}

Frontend:
  - Zeigt Meldung
  - Bietet an: "Nur verfügbare Menge hinzufügen (3)"
```

### 7.2 Preis geändert

**Was tun?**

```
Response (409 Conflict):
{
  "status": "error",
  "code": "PRICE_CHANGED",
  "message": "Preis hat sich geändert",
  "data": {
    "oldPrice": 29.99,
    "newPrice": 34.99,
    "productName": "Bio-T-Shirt"
  }
}

Frontend:
  - Zeigt Preis-Änderung
  - "Warenkorb aktualisieren" Button
  - User muss bestätigen
```

---

**Der Entwickler entscheidet:**

- Backend-Technologie & Framework
- Session-Management (Cookie, Redis, JWT)
- Datenbank (PostgreSQL empfohlen)
- Payment-Provider-Integration (Stripe, PayPal, etc.)
- Cronjob-System
- Projektstruktur
