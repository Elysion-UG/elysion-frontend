# Modul 03: Certificate Management

## Spezifikation & Requirements

**Verantwortlichkeit:** Zertifikatsverwaltung, Verifizierung, Ablauf-Management  
**Abhängigkeiten:** Modul 01 (Authentication), Modul 02 (Product Management)  
**Priorität:** CRITICAL

---

## 1. Überblick

Dieses Modul verwaltet Nachhaltigkeits-Zertifikate. Verkäufer laden Zertifikate hoch, Admins verifizieren sie. Nur Produkte mit verifizierten Zertifikaten dürfen auf der Plattform verkauft werden.

### Was das Modul macht:

- **Zertifikats-Upload** - Verkäufer laden PDF/Bilder hoch
- **Verifizierung** - Admin prüft Zertifikat (24h SLA)
- **Produkt-Verknüpfung** - Zertifikat wird Produkten zugeordnet
- **Automatische Freigabe** - Bei Verifizierung: Produkt wird ACTIVE
- **Ablauf-Management** - Automatische Deaktivierung abgelaufener Zertifikate
- **Erinnerungen** - E-Mail vor Ablauf (30 Tage, 7 Tage)

### Zertifikats-Typen (Beispiele):

- **IVN BEST** - Höchster Textilstandard
- **GOTS** - Global Organic Textile Standard
- **Fair Trade** - Fairer Handel
- **EU Ecolabel** - Europäisches Umweltzeichen
- **Bluesign** - Textilchemikalien
- **Custom** - Sonstige Zertifikate

### Schnittstellen zu anderen Modulen:

**Benötigt:**

- Modul 01: Authentifizierung (Verkäufer, Admin)
- Modul 02: Produkt-Informationen
- Modul 08: File-Upload für Zertifikatsdokumente

**Beeinflusst:**

- Modul 02: Aktualisiert `product.verifiedCertificateCount`
- Modul 02: Triggert Status-Änderung (REVIEW → ACTIVE, ACTIVE → INACTIVE)
- Modul 10: Sendet E-Mails (Verifizierung, Ablauf-Warnung)

---

## 2. Datenmodell

### 2.1 Certificate (Hauptentität)

Ein Zertifikat ist ein hochgeladenes Nachhaltigkeits-Zertifikat eines Verkäufers.

| Feld                  | Typ       | Pflicht | Einzigartig | Bedeutung                                                      |
| --------------------- | --------- | ------- | ----------- | -------------------------------------------------------------- |
| **id**                | UUID      | Ja      | Ja          | Primärschlüssel                                                |
| **sellerId**          | UUID      | Ja      | Nein        | Welcher Verkäufer hat es hochgeladen                           |
| **certificateType**   | Enum      | Ja      | Nein        | IVN_BEST / GOTS / FAIR_TRADE / EU_ECOLABEL / BLUESIGN / CUSTOM |
| **customTypeName**    | String    | Nein    | Nein        | Wenn CUSTOM: Name des Zertifikats                              |
| **issuer**            | String    | Ja      | Nein        | Zertifizierungs-Stelle (z.B. "Ecocert")                        |
| **certificateNumber** | String    | Ja      | Nein        | Zertifikats-Nummer                                             |
| **issueDate**         | Date      | Ja      | Nein        | Ausstellungsdatum                                              |
| **expiryDate**        | Date      | Ja      | Nein        | Ablaufdatum                                                    |
| **status**            | Enum      | Ja      | Nein        | PENDING / VERIFIED / REJECTED / EXPIRED                        |
| **documentUrl**       | String    | Ja      | Nein        | URL zum PDF/Bild (hochgeladen via Modul 08)                    |
| **verifiedBy**        | UUID      | Nein    | Nein        | Welcher Admin hat verifiziert (User.id)                        |
| **verifiedAt**        | Timestamp | Nein    | Nein        | Wann wurde verifiziert                                         |
| **rejectionReason**   | Text      | Nein    | Nein        | Warum abgelehnt (bei REJECTED)                                 |
| **createdAt**         | Timestamp | Ja      | Nein        | Wann hochgeladen                                               |
| **updatedAt**         | Timestamp | Ja      | Nein        | Letzte Änderung                                                |

**Status-Bedeutung:**

```
PENDING   = Hochgeladen, wartet auf Admin-Prüfung
VERIFIED  = Von Admin geprüft und freigegeben
REJECTED  = Von Admin abgelehnt
EXPIRED   = Ablaufdatum überschritten (automatisch)
```

**Status-Übergänge:**

```
PENDING → VERIFIED (Admin verifiziert)
PENDING → REJECTED (Admin lehnt ab)
VERIFIED → EXPIRED (System, wenn expiryDate < heute)

Nicht erlaubt:
REJECTED → VERIFIED (Verkäufer muss neu hochladen)
EXPIRED → VERIFIED (Verkäufer muss neu hochladen)
```

**Indizes:**

```sql
CREATE INDEX idx_certificate_seller_status ON certificate(sellerId, status);
CREATE INDEX idx_certificate_expiry ON certificate(expiryDate, status);
CREATE INDEX idx_certificate_status ON certificate(status);
```

---

### 2.2 ProductCertificate (Verknüpfung)

Verknüpft Produkte mit Zertifikaten (n:m Beziehung).

| Feld              | Typ       | Pflicht | Bedeutung              |
| ----------------- | --------- | ------- | ---------------------- |
| **id**            | UUID      | Ja      | Primärschlüssel        |
| **productId**     | UUID      | Ja      | Produkt (aus Modul 02) |
| **certificateId** | UUID      | Ja      | Zertifikat             |
| **addedAt**       | Timestamp | Ja      | Wann verknüpft         |

**Unique Constraint:**

```sql
CREATE UNIQUE INDEX idx_product_certificate_unique
ON product_certificate(productId, certificateId);
```

**Warum n:m?**

Ein Produkt kann mehrere Zertifikate haben (z.B. GOTS + Fair Trade).
Ein Zertifikat kann für mehrere Produkte gelten.

**Indizes:**

```sql
CREATE INDEX idx_product_certificate_product ON product_certificate(productId);
CREATE INDEX idx_product_certificate_certificate ON product_certificate(certificateId);
```

---

## 3. API-Endpoints

### 3.1 POST /certificates (Zertifikat hochladen - Seller)

Verkäufer lädt ein neues Zertifikat hoch.

**Wer darf:** Nur Verkäufer (role = SELLER)

**Request (Multipart Form-Data):**

```
file: [PDF oder Bild]
certificateType: "GOTS"
customTypeName: null (nur bei CUSTOM)
issuer: "Ecocert"
certificateNumber: "GOTS-2024-12345"
issueDate: "2024-01-01"
expiryDate: "2026-12-31"
```

**Validierung:**

- `file`: PDF, JPEG, PNG (max. 10 MB)
- `certificateType`: Muss gültiger Enum-Wert sein
- `expiryDate`: Muss in Zukunft liegen
- `issueDate`: Muss vor `expiryDate` liegen

**Workflow:**

```
1. Upload-Datei via Modul 08 (File-Service)
   → Gibt documentUrl zurück

2. Erstelle Certificate:
   status = PENDING
   sellerId = req.user.userId
   documentUrl = <von Modul 08>

3. Benachrichtigung an Admins (Modul 10):
   "Neues Zertifikat zur Prüfung"
```

**Response (201 Created):**

```json
{
  "status": "success",
  "message": "Zertifikat hochgeladen. Status: Wartet auf Prüfung (24h SLA)",
  "data": {
    "id": "cert-123",
    "status": "PENDING",
    "certificateType": "GOTS",
    "expiryDate": "2026-12-31"
  }
}
```

---

### 3.2 GET /certificates (Eigene Zertifikate - Seller)

Verkäufer sieht seine eigenen Zertifikate.

**Wer darf:** Nur Verkäufer

**Response (200 OK):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "cert-123",
      "certificateType": "GOTS",
      "issuer": "Ecocert",
      "certificateNumber": "GOTS-2024-12345",
      "issueDate": "2024-01-01",
      "expiryDate": "2026-12-31",
      "status": "VERIFIED",
      "documentUrl": "https://cdn.../cert-123.pdf",
      "verifiedAt": "2024-01-05T10:00:00Z",
      "linkedProductsCount": 5
    },
    {
      "id": "cert-456",
      "certificateType": "FAIR_TRADE",
      "status": "PENDING",
      "documentUrl": "https://cdn.../cert-456.pdf",
      "linkedProductsCount": 0
    }
  ]
}
```

---

### 3.3 GET /certificates/:id (Details - Seller/Admin)

**Wer darf:** Verkäufer (nur eigene) oder Admin (alle)

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "cert-123",
    "certificateType": "GOTS",
    "issuer": "Ecocert",
    "certificateNumber": "GOTS-2024-12345",
    "issueDate": "2024-01-01",
    "expiryDate": "2026-12-31",
    "status": "VERIFIED",
    "documentUrl": "https://cdn.../cert-123.pdf",
    "verifiedBy": "admin-789",
    "verifiedAt": "2024-01-05T10:00:00Z",
    "linkedProducts": [
      {
        "id": "product-1",
        "name": "Bio-T-Shirt",
        "slug": "bio-t-shirt"
      }
    ]
  }
}
```

---

### 3.4 POST /products/:productId/certificates (Zertifikat verknüpfen - Seller)

Verkäufer verknüpft ein verifiziertes Zertifikat mit einem Produkt.

**Wer darf:** Nur Verkäufer (eigene Produkte + eigene Zertifikate)

**Request:**

```json
{
  "certificateId": "cert-123"
}
```

**Validierung:**

```
1. Produkt gehört dem Verkäufer:
   product.sellerId == req.user.userId

2. Zertifikat gehört dem Verkäufer:
   certificate.sellerId == req.user.userId

3. Zertifikat ist verifiziert:
   certificate.status == 'VERIFIED'

4. Nicht bereits verknüpft:
   NOT EXISTS (productId, certificateId) in product_certificate
```

**Workflow:**

```
1. Erstelle Verknüpfung:
   INSERT INTO product_certificate (productId, certificateId, addedAt)

2. Update Produkt-Zähler:
   UPDATE products
   SET verifiedCertificateCount = verifiedCertificateCount + 1
   WHERE id = :productId

3. Status-Prüfung:
   IF product.status == 'REVIEW' AND product.verifiedCertificateCount >= 1:
     UPDATE products SET status = 'ACTIVE' WHERE id = :productId

4. E-Mail an Verkäufer (Modul 10):
   "Produkt wurde aktiviert"
```

**Response (201 Created):**

```json
{
  "status": "success",
  "message": "Zertifikat verknüpft. Produkt ist jetzt aktiv!",
  "data": {
    "productId": "product-1",
    "certificateId": "cert-123",
    "productStatus": "ACTIVE"
  }
}
```

---

### 3.5 DELETE /products/:productId/certificates/:certificateId (Verknüpfung lösen - Seller)

Verkäufer entfernt Zertifikat von Produkt.

**Wer darf:** Nur Verkäufer (eigenes Produkt)

**Workflow:**

```
1. Lösche Verknüpfung:
   DELETE FROM product_certificate
   WHERE productId = :productId AND certificateId = :certificateId

2. Update Produkt-Zähler:
   UPDATE products
   SET verifiedCertificateCount = verifiedCertificateCount - 1
   WHERE id = :productId

3. Status-Prüfung:
   IF product.verifiedCertificateCount < 1:
     UPDATE products SET status = 'INACTIVE' WHERE id = :productId

4. E-Mail an Verkäufer (Modul 10):
   "Produkt wurde deaktiviert (kein Zertifikat mehr)"
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Zertifikat entfernt. Produkt wurde deaktiviert.",
  "data": {
    "productStatus": "INACTIVE"
  }
}
```

---

### 3.6 GET /admin/certificates (Alle Zertifikate - Admin)

Admin sieht alle Zertifikate (zum Verifizieren).

**Wer darf:** Nur Admin

**Query-Parameter:**

```
?status=PENDING    # Nur ausstehende
&page=1
&limit=20
```

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "certificates": [
      {
        "id": "cert-123",
        "seller": {
          "id": "seller-1",
          "email": "seller@example.com",
          "companyName": "Öko-Fashion GmbH"
        },
        "certificateType": "GOTS",
        "issuer": "Ecocert",
        "certificateNumber": "GOTS-2024-12345",
        "issueDate": "2024-01-01",
        "expiryDate": "2026-12-31",
        "status": "PENDING",
        "documentUrl": "https://cdn.../cert-123.pdf",
        "createdAt": "2024-01-03T10:00:00Z",
        "waitingTime": "23 hours"
      }
    ],
    "pagination": {
      "page": 1,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### 3.7 PATCH /admin/certificates/:id/verify (Zertifikat verifizieren - Admin)

Admin verifiziert ein Zertifikat.

**Wer darf:** Nur Admin

**Request:**

```json
{
  "action": "verify"
}
```

**Workflow:**

```
1. Update Certificate:
   UPDATE certificate
   SET status = 'VERIFIED',
       verifiedBy = req.user.userId,
       verifiedAt = NOW()
   WHERE id = :id

2. Für ALLE verknüpften Produkte:
   UPDATE products
   SET verifiedCertificateCount = verifiedCertificateCount + 1
   WHERE id IN (
     SELECT productId FROM product_certificate WHERE certificateId = :id
   )

3. Status-Änderung für Produkte im Review:
   UPDATE products
   SET status = 'ACTIVE'
   WHERE status = 'REVIEW'
   AND id IN (
     SELECT productId FROM product_certificate WHERE certificateId = :id
   )
   AND verifiedCertificateCount >= 1

4. E-Mail an Verkäufer (Modul 10):
   "Zertifikat wurde verifiziert. Produkte sind jetzt aktiv."
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Zertifikat verifiziert. 3 Produkte wurden aktiviert.",
  "data": {
    "certificateId": "cert-123",
    "status": "VERIFIED",
    "affectedProducts": 3
  }
}
```

---

### 3.8 PATCH /admin/certificates/:id/reject (Zertifikat ablehnen - Admin)

Admin lehnt Zertifikat ab.

**Wer darf:** Nur Admin

**Request:**

```json
{
  "action": "reject",
  "reason": "Zertifikat ist abgelaufen. Bitte aktuelles Dokument hochladen."
}
```

**Workflow:**

```
1. Update Certificate:
   UPDATE certificate
   SET status = 'REJECTED',
       rejectionReason = :reason,
       verifiedBy = req.user.userId,
       verifiedAt = NOW()
   WHERE id = :id

2. E-Mail an Verkäufer (Modul 10):
   "Zertifikat wurde abgelehnt. Grund: {reason}"
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Zertifikat abgelehnt",
  "data": {
    "certificateId": "cert-123",
    "status": "REJECTED",
    "reason": "Zertifikat ist abgelaufen..."
  }
}
```

---

## 4. Business-Logik

### 4.1 Automatische Ablauf-Prüfung (Cronjob)

**Was:** Jeden Tag um 2 Uhr morgens prüfen, ob Zertifikate abgelaufen sind.

**Workflow:**

```
1. Finde alle abgelaufenen Zertifikate:
   SELECT * FROM certificate
   WHERE status = 'VERIFIED'
   AND expiryDate < TODAY

2. Für jedes abgelaufene Zertifikat:

   a) Update Certificate:
      UPDATE certificate SET status = 'EXPIRED' WHERE id = :id

   b) Für alle verknüpften Produkte:
      UPDATE products
      SET verifiedCertificateCount = verifiedCertificateCount - 1
      WHERE id IN (
        SELECT productId FROM product_certificate WHERE certificateId = :id
      )

   c) Deaktiviere Produkte ohne Zertifikat:
      UPDATE products
      SET status = 'INACTIVE'
      WHERE status = 'ACTIVE'
      AND id IN (...)
      AND verifiedCertificateCount < 1

   d) E-Mail an Verkäufer (Modul 10):
      "Zertifikat {number} ist abgelaufen. Produkte wurden deaktiviert."
```

**Pseudo-Code:**

```
function checkExpiredCertificates():

  expiredCerts = SELECT * FROM certificate
                 WHERE status = 'VERIFIED'
                 AND expiryDate < TODAY

  for cert in expiredCerts:

    # Certificate expiren
    UPDATE certificate SET status = 'EXPIRED' WHERE id = cert.id

    # Produkte finden
    products = SELECT productId FROM product_certificate WHERE certificateId = cert.id

    # Zähler dekrementieren
    UPDATE products
    SET verifiedCertificateCount = verifiedCertificateCount - 1
    WHERE id IN (products)

    # Produkte deaktivieren
    UPDATE products
    SET status = 'INACTIVE'
    WHERE status = 'ACTIVE'
    AND id IN (products)
    AND verifiedCertificateCount < 1

    # E-Mail senden
    sendEmail(cert.sellerId, "certificate_expired", { certificate: cert })
```

---

### 4.2 Ablauf-Erinnerungen (Cronjob)

**Was:** E-Mails vor Ablauf senden (30 Tage + 7 Tage vorher).

**Workflow:**

```
1. 30 Tage vor Ablauf:
   SELECT * FROM certificate
   WHERE status = 'VERIFIED'
   AND expiryDate = TODAY + 30 DAYS

   → E-Mail: "Zertifikat läuft in 30 Tagen ab"

2. 7 Tage vor Ablauf:
   SELECT * FROM certificate
   WHERE status = 'VERIFIED'
   AND expiryDate = TODAY + 7 DAYS

   → E-Mail: "DRINGEND: Zertifikat läuft in 7 Tagen ab"
```

**E-Mail-Inhalt:**

```
Betreff: Zertifikat läuft bald ab - {certificateNumber}

Hallo {sellerName},

Ihr Zertifikat läuft bald ab:
- Typ: {certificateType}
- Nummer: {certificateNumber}
- Ablaufdatum: {expiryDate}

Betroffen sind folgende Produkte:
- {productName1}
- {productName2}

Bitte laden Sie ein neues Zertifikat hoch, bevor das aktuelle abläuft.
Sonst werden Ihre Produkte automatisch deaktiviert.

[Jetzt neues Zertifikat hochladen]
```

---

### 4.3 SLA-Überwachung (24h Bearbeitungszeit)

**Was:** Admins sollen Zertifikate innerhalb 24h bearbeiten.

**Monitoring:**

```
SELECT * FROM certificate
WHERE status = 'PENDING'
AND createdAt < NOW() - INTERVAL '24 hours'
```

**Eskalation:**

```
Wenn > 24h:
  - E-Mail an alle Admins
  - Dashboard-Warnung
  - Slack-Benachrichtigung (optional)
```

---

## 5. Wichtige Hinweise für Entwickler

### 5.1 Transaktionale Integrität

**Bei Verifizierung:**

```
BEGIN TRANSACTION;

  # 1. Certificate updaten
  UPDATE certificate SET status = 'VERIFIED' ...

  # 2. Produkte updaten
  UPDATE products SET verifiedCertificateCount = ...

  # 3. Status-Änderung
  UPDATE products SET status = 'ACTIVE' WHERE ...

COMMIT;

Bei Fehler → ROLLBACK
```

**Warum wichtig?**

Wenn Schritt 2 fehlschlägt, darf Schritt 1 nicht committed werden.
Sonst: Certificate = VERIFIED, aber Produkte nicht aktiviert.

---

### 5.2 Kaskadierende Löschung

**Wenn Produkt gelöscht wird:**

```
# product_certificate-Einträge automatisch löschen
# ABER: Certificate selbst NICHT löschen
# (kann noch für andere Produkte gelten)

DELETE FROM product_certificate WHERE productId = :deletedProductId
```

**Wenn Zertifikat gelöscht wird:**

```
# product_certificate-Einträge löschen
DELETE FROM product_certificate WHERE certificateId = :deletedCertId

# Produkte aktualisieren
UPDATE products
SET verifiedCertificateCount = verifiedCertificateCount - 1
WHERE id IN (
  SELECT productId FROM product_certificate WHERE certificateId = :deletedCertId
)

# Produkte ggf. deaktivieren
UPDATE products SET status = 'INACTIVE'
WHERE verifiedCertificateCount < 1
```

---

### 5.3 Datenbank-Indizes

```sql
-- Certificate
CREATE INDEX idx_certificate_seller_status ON certificate(sellerId, status);
CREATE INDEX idx_certificate_expiry ON certificate(expiryDate, status);
CREATE INDEX idx_certificate_status ON certificate(status);

-- ProductCertificate
CREATE UNIQUE INDEX idx_product_certificate_unique
ON product_certificate(productId, certificateId);

CREATE INDEX idx_product_certificate_product ON product_certificate(productId);
CREATE INDEX idx_product_certificate_certificate ON product_certificate(certificateId);
```

---

### 5.4 File-Upload-Integration (Modul 08)

**Workflow:**

```
1. Frontend sendet File an Backend

2. Backend ruft Modul 08 auf:
   fileUrl = FileService.upload(file, {
     folder: 'certificates',
     allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
     maxSize: 10 * 1024 * 1024  // 10 MB
   })

3. Backend speichert URL in certificate.documentUrl

4. Bei Zertifikats-Löschung:
   FileService.delete(certificate.documentUrl)
```

---

## 6. Performance

### 6.1 Caching

**Was cachen:**

```
# Zertifikats-Typen (ändern sich nie)
Key: "certificate:types"
TTL: Permanent (oder bis Deployment)

# Verkäufer-Zertifikate
Key: "certificates:seller:{sellerId}"
TTL: 1 Stunde
Invalidierung: Bei Upload, Verifizierung, Ablauf
```

### 6.2 Pagination

**Admin-Übersicht:**

```
SELECT * FROM certificate
WHERE status = 'PENDING'
ORDER BY createdAt ASC
LIMIT 20 OFFSET 0
```

Niemals alle Zertifikate auf einmal laden.

---

## 7. Sicherheit

### 7.1 Zugriffskontrolle

**Verkäufer:**

- Darf nur eigene Zertifikate sehen (`certificate.sellerId == req.user.userId`)
- Darf nur eigene Produkte verknüpfen

**Admin:**

- Sieht alle Zertifikate
- Darf verifizieren/ablehnen

**Käufer:**

- Sieht nur verifizierte Zertifikate (öffentlich bei Produkten)

### 7.2 Dokument-Zugriff

**Zertifikats-PDFs:**

```
# Verkäufer: Eigene Dokumente
# Admin: Alle Dokumente
# Käufer: Nur bei verifizierten Zertifikaten
# Sonst: 403 Forbidden
```

---

**Der Entwickler entscheidet:**

- Backend-Technologie & Framework
- Datenbank (PostgreSQL empfohlen)
- Cronjob-System (Cron, Node-Cron, oder Task-Scheduler)
- File-Storage (S3, Cloudinary, lokales Filesystem)
- E-Mail-Service (SendGrid, AWS SES, oder SMTP)
- Projektstruktur
