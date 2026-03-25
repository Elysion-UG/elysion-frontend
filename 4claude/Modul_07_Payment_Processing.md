# Modul 07: Payment Processing
## Spezifikation & Requirements

**Verantwortlichkeit:** Zahlungsabwicklung, Auszahlungen an Verkäufer, Refunds  
**Abhängigkeiten:** Modul 01 (Auth), Modul 06 (Orders)  
**Priorität:** CRITICAL

---

## 1. Überblick

Dieses Modul verwaltet alle Zahlungen: Von Kunden an die Plattform und von der Plattform an Verkäufer.

### Was das Modul macht:

- **Payment-Intent erstellen** - Für Checkout (Stripe, PayPal, etc.)
- **Zahlung verifizieren** - Nach erfolgreichem Payment
- **Webhook-Handling** - Payment-Provider-Events verarbeiten
- **Auszahlungen** - An Verkäufer (nach Versand)
- **Refunds** - Rückerstattungen bei Stornierung/Rücksendung
- **Gebühren-Management** - Plattform-Provision
- **Auszahlungs-Historie** - Für Verkäufer

### Kern-Konzept: Escrow-System

```
Kunde zahlt 76.28 EUR für Bestellung
  ↓
Geld geht an Plattform (Escrow)
  ↓
Warte auf Versand aller OrderGroups
  ↓
Für jede OrderGroup nach Versand:
  Betrag - Provision → An Verkäufer
  Provision → An Plattform

Beispiel:
  OrderGroup A: 59.98 EUR (Verkäufer A)
  Provision: 10% = 5.99 EUR
  Auszahlung: 53.99 EUR → Verkäufer A
  
  OrderGroup B: 16.30 EUR (Verkäufer B)
  Provision: 10% = 1.63 EUR
  Auszahlung: 14.67 EUR → Verkäufer B
```

### Schnittstellen zu anderen Modulen:

**Benötigt:**
- Modul 01: User-Daten, Verkäufer-Bankdaten
- Modul 06: Order-Daten, OrderGroup-Status

**Beeinflusst:**
- Modul 06: Aktualisiert Order.paymentStatus

**Wird aufgerufen von:**
- Modul 05: Checkout erstellt Payment-Intent
- Modul 06: Order-Stornierung triggert Refund

---

## 2. Datenmodell

### 2.1 Payment (Kundenzahlungen)

Ein Payment repräsentiert eine Zahlung eines Kunden.

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **orderId** | UUID | Ja | Zu welcher Bestellung |
| **userId** | UUID | Nein | Käufer (NULL wenn Gast) |
| **provider** | Enum | Ja | STRIPE / PAYPAL / KLARNA / SOFORT |
| **providerPaymentId** | String | Ja | Payment-ID vom Provider (z.B. Stripe Payment Intent ID) |
| **amount** | Decimal (10,2) | Ja | Betrag |
| **currency** | String (3) | Ja | "EUR" |
| **status** | Enum | Ja | PENDING / SUCCEEDED / FAILED / REFUNDED / PARTIALLY_REFUNDED |
| **paymentMethod** | String | Nein | "card", "paypal", "sepa_debit", etc. |
| **receiptUrl** | String | Nein | Link zur Quittung (vom Provider) |
| **failureReason** | Text | Nein | Grund bei Fehler |
| **refundedAmount** | Decimal (10,2) | Ja | Erstatteter Betrag (default: 0) |
| **createdAt** | Timestamp | Ja | Wann erstellt |
| **succeededAt** | Timestamp | Nein | Wann erfolgreich |

**Status-Bedeutung:**

```
PENDING             = Payment-Intent erstellt, Zahlung läuft
SUCCEEDED           = Zahlung erfolgreich
FAILED              = Zahlung fehlgeschlagen
REFUNDED            = Komplett erstattet
PARTIALLY_REFUNDED  = Teilweise erstattet
```

**Indizes:**

```sql
CREATE INDEX idx_payment_order ON payment(orderId);
CREATE INDEX idx_payment_user ON payment(userId);
CREATE INDEX idx_payment_provider_id ON payment(providerPaymentId);
CREATE INDEX idx_payment_status ON payment(status);
```

---

### 2.2 Payout (Auszahlungen an Verkäufer)

Eine Payout ist eine Auszahlung an einen Verkäufer.

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **sellerId** | UUID | Ja | Welcher Verkäufer |
| **orderGroupId** | UUID | Ja | Für welche OrderGroup |
| **amount** | Decimal (10,2) | Ja | Auszahlungsbetrag (nach Abzug Provision) |
| **commission** | Decimal (10,2) | Ja | Plattform-Provision |
| **grossAmount** | Decimal (10,2) | Ja | Brutto (amount + commission) |
| **status** | Enum | Ja | PENDING / PROCESSING / COMPLETED / FAILED |
| **provider** | Enum | Ja | STRIPE_CONNECT / PAYPAL / BANK_TRANSFER |
| **providerPayoutId** | String | Nein | Payout-ID vom Provider |
| **recipientAccount** | String | Ja | IBAN oder PayPal-E-Mail (verschlüsselt!) |
| **scheduledFor** | Date | Ja | Geplante Auszahlung (z.B. +7 Tage nach Versand) |
| **completedAt** | Timestamp | Nein | Wann ausgezahlt |
| **failureReason** | Text | Nein | Grund bei Fehler |
| **createdAt** | Timestamp | Ja | |

**Status-Bedeutung:**

```
PENDING    = Geplant, aber noch nicht ausgeführt
PROCESSING = Auszahlung läuft
COMPLETED  = Erfolgreich ausgezahlt
FAILED     = Fehlgeschlagen
```

**Auszahlungs-Zeitpunkt:**

```
Default: 7 Tage nach Versand
  → Widerrufsrecht (14 Tage) teilweise abgelaufen
  → Reduziert Rückerstattungs-Risiko

Konfigurierbar pro Verkäufer:
  - Express: 2 Tage (höheres Risiko)
  - Standard: 7 Tage
  - Sicher: 14 Tage
```

**Indizes:**

```sql
CREATE INDEX idx_payout_seller ON payout(sellerId, status);
CREATE INDEX idx_payout_order_group ON payout(orderGroupId);
CREATE INDEX idx_payout_scheduled ON payout(scheduledFor, status);
CREATE INDEX idx_payout_status ON payout(status);
```

---

### 2.3 Refund (Rückerstattungen)

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **paymentId** | UUID | Ja | Ursprüngliche Zahlung |
| **orderId** | UUID | Ja | Bestellung |
| **returnId** | UUID | Nein | Wenn wegen Rücksendung (Modul 06) |
| **amount** | Decimal (10,2) | Ja | Erstattungsbetrag |
| **reason** | Text | Ja | Grund ("Rücksendung", "Stornierung", etc.) |
| **status** | Enum | Ja | PENDING / SUCCEEDED / FAILED |
| **provider** | String | Ja | "stripe", "paypal", etc. |
| **providerRefundId** | String | Nein | Refund-ID vom Provider |
| **initiatedBy** | UUID | Nein | User (Admin, Verkäufer, System) |
| **createdAt** | Timestamp | Ja | |
| **succeededAt** | Timestamp | Nein | |

**Indizes:**

```sql
CREATE INDEX idx_refund_payment ON refund(paymentId);
CREATE INDEX idx_refund_order ON refund(orderId);
CREATE INDEX idx_refund_return ON refund(returnId);
```

---

### 2.4 CommissionRate (Provisionen)

Konfigurierbare Provision pro Verkäufer oder Kategorie.

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **sellerId** | UUID | Nein | Spezifisch für Verkäufer (NULL = Default) |
| **categoryId** | UUID | Nein | Spezifisch für Kategorie |
| **rate** | Decimal (5,2) | Ja | Provisionssatz in % (z.B. 10.00 = 10%) |
| **isActive** | Boolean | Ja | Aktiv? |
| **validFrom** | Date | Ja | Gültig ab |
| **validUntil** | Date | Nein | Gültig bis (NULL = unbegrenzt) |

**Priorität:**

```
1. Verkäufer-spezifisch
2. Kategorie-spezifisch
3. Default (sellerId = NULL, categoryId = NULL)

Beispiel:
  Default: 10%
  Kategorie "Elektronik": 15%
  Verkäufer "Premium-Shop": 5%
```

---

## 3. API-Endpoints

### 3.1 POST /payments/create-intent (Payment-Intent erstellen)

**Wird von Modul 05 (Checkout) aufgerufen.**

**Wer darf:** Jeder (Gast oder User)

**Request:**

```json
{
  "amount": 76.28,
  "currency": "EUR",
  "orderId": "order-123",
  "provider": "STRIPE"
}
```

**Workflow:**

```
1. Payment-Provider-API aufrufen:
   
   Stripe-Beispiel:
   paymentIntent = stripe.paymentIntents.create({
     amount: 7628,  # in Cent!
     currency: 'eur',
     metadata: { orderId: 'order-123' }
   })

2. Payment in DB speichern:
   INSERT INTO payment (
     orderId, provider, providerPaymentId, amount, currency, status
   ) VALUES (
     :orderId, 'STRIPE', paymentIntent.id, 76.28, 'EUR', 'PENDING'
   )

3. Client-Secret zurückgeben:
   return paymentIntent.client_secret
```

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "paymentId": "payment-123",
    "clientSecret": "pi_xxx_secret_yyy",
    "provider": "STRIPE"
  }
}
```

**Frontend macht dann:**

```javascript
// Stripe-Beispiel
const stripe = Stripe('pk_xxx');
const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement
  }
});

if (!error) {
  // Zahlung erfolgreich
  POST /checkout/complete
}
```

---

### 3.2 POST /payments/webhook (Webhook von Payment-Provider)

**Wichtig:** Payment-Provider senden Events (z.B. "payment_succeeded").

**Wer darf:** Nur Payment-Provider (Webhook-Secret validieren!)

**Request (Stripe-Beispiel):**

```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 7628,
      "status": "succeeded",
      "metadata": {
        "orderId": "order-123"
      }
    }
  }
}
```

**Workflow:**

```
1. Webhook-Signatur verifizieren:
   # Stripe-Beispiel
   signature = req.headers['stripe-signature']
   event = stripe.webhooks.constructEvent(
     req.body, signature, webhookSecret
   )
   
   if (!event):
     throw 401 Unauthorized

2. Event-Type prüfen:
   
   if (event.type == 'payment_intent.succeeded'):
     
     a) Payment aktualisieren:
        UPDATE payment
        SET status = 'SUCCEEDED', succeededAt = NOW()
        WHERE providerPaymentId = event.data.object.id
     
     b) Order aktualisieren:
        UPDATE orders
        SET paymentStatus = 'PAID', status = 'CONFIRMED'
        WHERE id = event.data.object.metadata.orderId
     
     c) Auszahlungen planen (für jede OrderGroup):
        for orderGroup in order.orderGroups:
          createPayout(orderGroup)
   
   else if (event.type == 'payment_intent.payment_failed'):
     
     UPDATE payment
     SET status = 'FAILED', failureReason = event.data.object.last_payment_error.message
     WHERE providerPaymentId = event.data.object.id
     
     UPDATE orders
     SET paymentStatus = 'FAILED', status = 'CANCELLED'
     WHERE id = ...
```

**Response (200 OK):**

```json
{
  "received": true
}
```

**Wichtig:** Webhook MUSS idempotent sein (kann mehrfach aufgerufen werden)!

---

### 3.3 GET /sellers/me/payouts (Auszahlungen - Verkäufer)

Verkäufer sieht seine Auszahlungen.

**Wer darf:** Nur Verkäufer

**Response:**

```json
{
  "status": "success",
  "data": {
    "payouts": [
      {
        "id": "payout-123",
        "orderNumber": "ORD-2024-00123",
        "grossAmount": 59.98,
        "commission": 5.99,
        "amount": 53.99,
        "status": "COMPLETED",
        "scheduledFor": "2024-02-27",
        "completedAt": "2024-02-27T10:00:00Z"
      },
      {
        "id": "payout-456",
        "orderNumber": "ORD-2024-00124",
        "grossAmount": 39.99,
        "commission": 3.99,
        "amount": 35.00,
        "status": "PENDING",
        "scheduledFor": "2024-03-05"
      }
    ],
    "summary": {
      "pending": 35.00,
      "completed": 53.99,
      "total": 88.99
    }
  }
}
```

---

### 3.4 POST /refunds (Rückerstattung - Admin/System)

**Wer darf:** Admin oder System (bei Stornierung)

**Request:**

```json
{
  "paymentId": "payment-123",
  "amount": 76.28,
  "reason": "Stornierung durch Kunde"
}
```

**Workflow:**

```
1. Payment holen & validieren:
   payment = SELECT * FROM payment WHERE id = :paymentId
   
   if (payment.status != 'SUCCEEDED'):
     throw Error("Zahlung nicht erfolgreich")
   
   if (payment.refundedAmount + :amount > payment.amount):
     throw Error("Betrag überschreitet Zahlung")

2. Provider-API aufrufen:
   
   # Stripe-Beispiel
   refund = stripe.refunds.create({
     payment_intent: payment.providerPaymentId,
     amount: amount * 100  # in Cent
   })

3. Refund speichern:
   INSERT INTO refund (
     paymentId, orderId, amount, status, provider, providerRefundId
   ) VALUES (...)

4. Payment aktualisieren:
   UPDATE payment
   SET refundedAmount = refundedAmount + :amount,
       status = CASE
         WHEN refundedAmount + :amount >= amount THEN 'REFUNDED'
         ELSE 'PARTIALLY_REFUNDED'
       END
   WHERE id = :paymentId

5. Order aktualisieren:
   UPDATE orders
   SET paymentStatus = 'REFUNDED'
   WHERE id = payment.orderId

6. E-Mail an Kunde (Modul 10):
   "Rückerstattung von {amount} EUR wurde veranlasst"
```

---

### 3.5 Cronjob: Auszahlungen ausführen

**Täglich 10:00 Uhr:**

```
1. Finde fällige Auszahlungen:
   payouts = SELECT * FROM payout
             WHERE status = 'PENDING'
             AND scheduledFor <= TODAY

2. Für jede Auszahlung:
   
   a) Verkäufer-Bankdaten holen:
      seller = SELECT * FROM seller_profiles WHERE id = payout.sellerId
   
   b) Provider-API aufrufen:
      
      # Stripe Connect Beispiel
      transfer = stripe.transfers.create({
        amount: payout.amount * 100,
        currency: 'eur',
        destination: seller.stripeAccountId
      })
      
      # Oder: SEPA-Überweisung initiieren
   
   c) Payout aktualisieren:
      UPDATE payout
      SET status = 'PROCESSING',
          providerPayoutId = transfer.id
      WHERE id = payout.id
   
   d) Bei Erfolg (später via Webhook):
      UPDATE payout
      SET status = 'COMPLETED', completedAt = NOW()
      WHERE id = payout.id
   
   e) E-Mail an Verkäufer:
      "Auszahlung von {amount} EUR wurde veranlasst"
```

---

## 4. Business-Logik

### 4.1 Provisions-Berechnung

```
Funktion: calculateCommission(orderGroup):
  
  1. Rate holen (Priorität):
     
     # Verkäufer-spezifisch?
     rate = SELECT rate FROM commission_rate
            WHERE sellerId = orderGroup.sellerId
            AND isActive = true
            ORDER BY validFrom DESC
            LIMIT 1
     
     if (!rate):
       # Kategorie-spezifisch?
       rate = SELECT rate FROM commission_rate
              WHERE categoryId = orderGroup.items[0].product.categoryId
              AND isActive = true
              ORDER BY validFrom DESC
              LIMIT 1
     
     if (!rate):
       # Default
       rate = SELECT rate FROM commission_rate
              WHERE sellerId IS NULL AND categoryId IS NULL
              AND isActive = true
              LIMIT 1
  
  2. Berechnen:
     commission = orderGroup.total * (rate / 100)
     netAmount = orderGroup.total - commission
     
     return { commission, netAmount }
```

**Beispiel:**

```
OrderGroup: 59.98 EUR
Rate: 10%

commission = 59.98 * 0.10 = 5.99 EUR
netAmount = 59.98 - 5.99 = 53.99 EUR

→ Verkäufer erhält 53.99 EUR
→ Plattform behält 5.99 EUR
```

---

### 4.2 Auszahlungs-Erstellung (nach Versand)

```
Wenn OrderGroup.status → SHIPPED:
  
  1. Provision berechnen:
     { commission, netAmount } = calculateCommission(orderGroup)
  
  2. Payout erstellen:
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
       TODAY + 7 DAYS  # Auszahlung in 7 Tagen
     )
```

---

### 4.3 Teil-Rückerstattung

```
Bestellung: 76.28 EUR (2 OrderGroups)
  - Group A: 59.98 EUR
  - Group B: 16.30 EUR

Kunde sendet nur Group A zurück:
  
  1. Refund erstellen: 59.98 EUR
  
  2. Payment aktualisieren:
     refundedAmount = 59.98
     status = 'PARTIALLY_REFUNDED'
  
  3. Payout stornieren (falls noch PENDING):
     if (payout.status == 'PENDING'):
       DELETE FROM payout WHERE orderGroupId = groupA.id
  
  4. Payout reduzieren (falls PROCESSING):
     # Nicht möglich → Manueller Prozess
```

---

### 4.4 Stornierung vor Auszahlung

```
Order wird storniert BEVOR Auszahlung:
  
  1. Refund erstellen (komplett)
  
  2. Alle Payouts löschen:
     DELETE FROM payout
     WHERE orderGroupId IN (SELECT id FROM order_group WHERE orderId = :orderId)
     AND status = 'PENDING'
  
  3. Bei PROCESSING/COMPLETED:
     → Manuelle Rückforderung vom Verkäufer
```

---

## 5. Payment-Provider-Integration

### 5.1 Stripe (empfohlen)

**Vorteile:**
- Payment Intents API (SCA-konform)
- Stripe Connect für Auszahlungen
- Webhooks
- Gute Dokumentation

**Setup:**

```
1. Stripe-Account erstellen
2. API-Keys holen (Test + Live)
3. Webhook-Endpoint registrieren
4. Stripe Connect für Verkäufer-Auszahlungen
```

**Beispiel-Code (konzeptionell):**

```
# Payment Intent erstellen
paymentIntent = stripe.paymentIntents.create({
  amount: 7628,
  currency: 'eur',
  metadata: { orderId: '...' }
})

# Auszahlung via Stripe Connect
transfer = stripe.transfers.create({
  amount: 5399,
  currency: 'eur',
  destination: seller.stripeAccountId
})

# Refund
refund = stripe.refunds.create({
  payment_intent: paymentIntent.id,
  amount: 7628
})
```

---

### 5.2 PayPal (alternative)

**Vorteile:**
- Weit verbreitet
- Käuferschutz

**Nachteile:**
- Höhere Gebühren
- Komplexere Integration

---

### 5.3 Klarna / Sofort (später)

Für Buy-Now-Pay-Later.

---

## 6. Sicherheit

### 6.1 Webhook-Validierung

```
KRITISCH: Webhooks MÜSSEN validiert werden!

Stripe-Beispiel:
  signature = req.headers['stripe-signature']
  event = stripe.webhooks.constructEvent(
    req.body, signature, webhookSecret
  )
  
  if (!event):
    throw 401 Unauthorized

Warum?
  - Verhindert Fake-Webhooks
  - Verhindert Replay-Attacks
```

### 6.2 Idempotenz

```
Webhooks können mehrfach gesendet werden!

Lösung:
  1. Provider-Event-ID speichern
  2. Bei erneutem Event: Ignorieren
  
CREATE TABLE webhook_events (
  providerEventId VARCHAR UNIQUE,
  processedAt TIMESTAMP
);

if (SELECT 1 FROM webhook_events WHERE providerEventId = :eventId):
  return 200  # Bereits verarbeitet
else:
  # Verarbeiten
  INSERT INTO webhook_events (providerEventId, processedAt) VALUES (...)
```

### 6.3 Bankdaten verschlüsseln

```
seller.iban MUSS verschlüsselt sein!

Verschlüsselung:
  encrypted = encrypt(iban, ENV.ENCRYPTION_KEY)

Entschlüsselung:
  iban = decrypt(encrypted, ENV.ENCRYPTION_KEY)
```

---

## 7. Fehlerbehandlung

### 7.1 Zahlung fehlgeschlagen

```
Webhook: payment_intent.payment_failed

Actions:
  1. Payment.status = FAILED
  2. Order.status = CANCELLED
  3. Lagerbestand zurückbuchen (Modul 02)
  4. E-Mail an Kunde: "Zahlung fehlgeschlagen"
```

### 7.2 Auszahlung fehlgeschlagen

```
Auszahlung kann scheitern:
  - Ungültige IBAN
  - Konto gesperrt
  - Technischer Fehler

Actions:
  1. Payout.status = FAILED
  2. E-Mail an Verkäufer: "Auszahlung fehlgeschlagen, bitte Bankdaten prüfen"
  3. Admin-Benachrichtigung
  4. Retry nach 24h (max. 3×)
```

---

## 8. Performance

### 8.1 Asynchrone Verarbeitung

```
Auszahlungen nicht im HTTP-Request!

Stattdessen:
  1. Cronjob täglich
  2. Oder: Queue (Redis, RabbitMQ)
  3. Worker-Prozess führt aus
```

### 8.2 Caching

```
Commission-Rates cachen:
  Key: "commission:{sellerId}:{categoryId}"
  TTL: 1 Stunde
```

---

## 9. Wichtige Hinweise für Entwickler

### 9.1 Test-Modus

**IMMER erst mit Test-Keys testen!**

```
Stripe:
  Test: sk_test_...
  Live: sk_live_...

PayPal:
  Sandbox: ...
  Live: ...
```

### 9.2 Webhook-Retry

```
Payment-Provider senden Webhooks mehrfach, wenn:
  - Endpoint antwortet nicht
  - Endpoint gibt 5xx zurück

→ Endpoint MUSS schnell antworten (< 1s)
→ Lange Verarbeitung in Background-Job
```

### 9.3 Provision-Änderungen

```
Wenn Commission-Rate ändert:
  - Gilt NICHT für bestehende Payouts
  - Nur für neue Bestellungen

Warum?
  - Vertragliche Zusage
  - Verkäufer erwartet bestimmten Betrag
```

---

**Der Entwickler entscheidet:**
- Payment-Provider (Stripe, PayPal, Klarna)
- Auszahlungs-Strategie (Stripe Connect, Manuell, API)
- Webhook-Framework
- Queue-System (Redis, RabbitMQ, SQS)
- Encryption-Library
- Test-Strategie
- Projektstruktur
