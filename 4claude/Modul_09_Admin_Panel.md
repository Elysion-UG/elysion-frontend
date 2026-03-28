# Modul 09: Admin Panel

## Spezifikation & Requirements

**Verantwortlichkeit:** Admin-Dashboard, Verwaltung, Moderation  
**Abhängigkeiten:** Alle Module (01-08)  
**Priorität:** MEDIUM

---

## 1. Überblick

Dieses Modul stellt Admin-Funktionen bereit. Admins können die Plattform verwalten, moderieren und überwachen.

### Was das Modul macht:

- **Dashboard** - Statistiken & Übersicht
- **User-Verwaltung** - Nutzer sperren, Rollen ändern
- **Verkäufer-Freigabe** - Neue Verkäufer prüfen & freischalten
- **Zertifikats-Verifizierung** - Zertifikate prüfen (Modul 03)
- **Produkt-Moderation** - Unangemessene Produkte entfernen
- **Order-Support** - Bestellungen einsehen & unterstützen
- **Content-Moderation** - Beschreibungen, Bilder prüfen
- **Reports** - Exporte, Statistiken
- **System-Konfiguration** - Gebühren, Kategorien, etc.

### Wichtig:

**Dieses Modul definiert nur Backend-Endpoints!**

Frontend-Design ist Entwickler-Entscheidung:

- React Admin
- Vue Admin
- Custom Dashboard
- Oder: Keine UI (API-only für Admins)

---

## 2. Keine eigenen Tabellen

Admin-Panel nutzt nur existierende Daten aus anderen Modulen.

**Optional:** Audit-Log für Admin-Aktionen

```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100),  -- 'user_suspended', 'certificate_verified', etc.
  entity_type VARCHAR(50),  -- 'user', 'certificate', 'product'
  entity_id UUID,
  details JSONB,  -- Zusätzliche Infos
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_id, created_at DESC);
CREATE INDEX idx_audit_entity ON admin_audit_log(entity_type, entity_id);
```

---

## 3. API-Endpoints

### 3.1 GET /admin/dashboard (Übersicht)

**Wer darf:** Nur Admin

**Response:**

```json
{
  "status": "success",
  "data": {
    "statistics": {
      "users": {
        "total": 1523,
        "buyers": 1342,
        "sellers": 181,
        "newToday": 12,
        "newThisWeek": 87
      },
      "products": {
        "total": 4521,
        "active": 3892,
        "draft": 421,
        "pending": 208
      },
      "orders": {
        "total": 892,
        "todayRevenue": 12450.5,
        "thisMonthRevenue": 345678.9,
        "pending": 23,
        "processing": 45
      },
      "certificates": {
        "pending": 15,
        "verified": 523,
        "rejected": 12,
        "avgProcessingTime": "14.5 hours"
      }
    },
    "recentActivity": [
      {
        "type": "new_order",
        "orderId": "order-123",
        "amount": 76.28,
        "timestamp": "2024-02-19T10:30:00Z"
      },
      {
        "type": "new_seller",
        "userId": "user-456",
        "companyName": "Öko-Fashion",
        "timestamp": "2024-02-19T09:15:00Z"
      }
    ],
    "alerts": [
      {
        "type": "pending_certificates",
        "count": 15,
        "message": "15 Zertifikate warten auf Prüfung (SLA: 24h)"
      },
      {
        "type": "sla_breach",
        "count": 3,
        "message": "3 Zertifikate überschreiten 24h SLA"
      }
    ]
  }
}
```

---

### 3.2 GET /admin/users (Nutzer-Verwaltung)

**Wer darf:** Nur Admin

**Query-Parameter:**

```
?role=SELLER
&status=ACTIVE
&search=max@example.com
&page=1
&limit=50
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "user-123",
        "email": "max@example.com",
        "firstName": "Max",
        "lastName": "Mustermann",
        "role": "SELLER",
        "status": "ACTIVE",
        "emailVerified": true,
        "createdAt": "2024-01-15T10:00:00Z",
        "sellerProfile": {
          "companyName": "Öko-Fashion",
          "status": "APPROVED"
        },
        "stats": {
          "productsCount": 23,
          "ordersCount": 145,
          "revenue": 12450.5
        }
      }
    ],
    "pagination": {
      "page": 1,
      "total": 1523,
      "totalPages": 31
    }
  }
}
```

---

### 3.3 PATCH /admin/users/:id/suspend (User sperren)

**Wer darf:** Nur Admin

**Request:**

```json
{
  "reason": "Verstoß gegen Nutzungsbedingungen",
  "duration": 30 // Tage (optional, permanent wenn leer)
}
```

**Workflow:**

```
1. User sperren:
   UPDATE users
   SET status = 'SUSPENDED'
   WHERE id = :id

2. Wenn Verkäufer:
   # Alle Produkte deaktivieren
   UPDATE products
   SET status = 'INACTIVE'
   WHERE sellerId = :id AND status = 'ACTIVE'

3. Audit-Log:
   INSERT INTO admin_audit_log (
     admin_id, action, entity_type, entity_id, details
   ) VALUES (
     req.user.userId, 'user_suspended', 'user', :id,
     JSON { reason: '...', duration: 30 }
   )

4. E-Mail an User (Modul 10):
   "Ihr Account wurde gesperrt. Grund: ..."
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "User gesperrt"
}
```

---

### 3.4 GET /admin/sellers/pending (Verkäufer-Freigabe)

Neue Verkäufer, die auf Freigabe warten.

**Wer darf:** Nur Admin

**Response:**

```json
{
  "status": "success",
  "data": {
    "sellers": [
      {
        "id": "seller-123",
        "email": "shop@example.com",
        "companyName": "Öko-Fashion GmbH",
        "vatId": "DE123456789",
        "iban": "DE89370400440532013000",
        "status": "PENDING",
        "createdAt": "2024-02-18T14:30:00Z",
        "waitingTime": "18 hours"
      }
    ]
  }
}
```

---

### 3.5 PATCH /admin/sellers/:id/approve (Verkäufer freischalten)

**Wer darf:** Nur Admin

**Request:**

```json
{
  "action": "approve"
}
```

**Workflow:**

```
1. Verkäufer-Profil aktualisieren:
   UPDATE seller_profiles
   SET status = 'APPROVED',
       approved_at = NOW(),
       approved_by = req.user.userId
   WHERE userId = :id

2. Audit-Log

3. E-Mail an Verkäufer (Modul 10):
   "Ihr Verkäufer-Account wurde freigeschaltet!"
```

---

### 3.6 GET /admin/certificates (Zertifikats-Verifizierung)

**Hinweis:** Hauptsächlich definiert in Modul 03, hier nur Admin-Übersicht.

**Wer darf:** Nur Admin

**Response:** Siehe Modul 03 (GET /admin/certificates)

---

### 3.7 GET /admin/products (Produkt-Moderation)

**Wer darf:** Nur Admin

**Query-Parameter:**

```
?status=REVIEW  # Produkte zur Prüfung
&flagged=true   # Von Nutzern gemeldet
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": "product-123",
        "name": "Bio-T-Shirt",
        "seller": {
          "id": "seller-1",
          "companyName": "Öko-Fashion"
        },
        "status": "REVIEW",
        "flaggedCount": 3,
        "flags": [
          {
            "reason": "Unangemessene Beschreibung",
            "reportedBy": "user-456",
            "createdAt": "2024-02-19T08:00:00Z"
          }
        ]
      }
    ]
  }
}
```

---

### 3.8 PATCH /admin/products/:id/reject (Produkt ablehnen)

**Wer darf:** Nur Admin

**Request:**

```json
{
  "reason": "Beschreibung entspricht nicht den Richtlinien"
}
```

**Workflow:**

```
1. Produkt ablehnen:
   UPDATE products
   SET status = 'REJECTED'
   WHERE id = :id

2. E-Mail an Verkäufer (Modul 10):
   "Produkt '{name}' wurde abgelehnt. Grund: ..."
```

---

### 3.9 GET /admin/orders (Order-Support)

**Wer darf:** Nur Admin

**Response:** Alle Bestellungen mit Filter-Optionen

---

### 3.10 GET /admin/reports/revenue (Umsatz-Report)

**Wer darf:** Nur Admin

**Query-Parameter:**

```
?from=2024-01-01
&to=2024-01-31
&groupBy=day  # day, week, month
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "revenue": [
      {
        "date": "2024-01-01",
        "orders": 23,
        "totalRevenue": 1845.5,
        "platformCommission": 184.55
      },
      {
        "date": "2024-01-02",
        "orders": 31,
        "totalRevenue": 2567.3,
        "platformCommission": 256.73
      }
    ],
    "summary": {
      "totalOrders": 892,
      "totalRevenue": 67890.5,
      "totalCommission": 6789.05,
      "avgOrderValue": 76.12
    }
  }
}
```

---

### 3.11 POST /admin/reports/export (Daten exportieren)

**Wer darf:** Nur Admin

**Request:**

```json
{
  "type": "users" | "orders" | "products" | "revenue",
  "format": "csv" | "xlsx" | "pdf",
  "filters": {
    "dateFrom": "2024-01-01",
    "dateTo": "2024-01-31"
  }
}
```

**Workflow:**

```
1. Daten abfragen (je nach type)
2. Format konvertieren (CSV/XLSX/PDF)
3. Datei generieren
4. URL zurückgeben (temporär, 1h gültig)
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "downloadUrl": "https://example.com/exports/users-2024-01.csv",
    "expiresAt": "2024-02-19T11:30:00Z"
  }
}
```

---

### 3.12 GET /admin/config (System-Konfiguration)

**Wer darf:** Nur Admin

**Response:**

```json
{
  "status": "success",
  "data": {
    "commissionRates": {
      "default": 10.0,
      "categories": {
        "Elektronik": 15.0
      }
    },
    "payoutSchedule": "7 days",
    "maxProductImages": 10,
    "maxFileSize": {
      "productImage": 5242880,
      "certificate": 10485760
    }
  }
}
```

---

### 3.13 PATCH /admin/config (Konfiguration ändern)

**Wer darf:** Nur Admin

**Request:**

```json
{
  "commissionRates": {
    "default": 12.0
  }
}
```

**Wichtig:** Neue Rates gelten nur für neue Orders!

---

## 4. Berechtigungen

### 4.1 Admin-Rollen (optional)

**Wenn verschiedene Admin-Ebenen gewünscht:**

```
SUPER_ADMIN:
  - Alles

MODERATOR:
  - Zertifikate verifizieren
  - Produkte moderieren
  - User sperren

SUPPORT:
  - Bestellungen einsehen
  - Tickets beantworten
  - Keine Änderungen

Implementierung:
  - Feld: user.adminRole
  - Oder: Separate Permissions-Tabelle
```

---

## 5. Audit-Logging

**Jede Admin-Aktion loggen:**

```
INSERT INTO admin_audit_log (
  admin_id,
  action,
  entity_type,
  entity_id,
  details
) VALUES (
  :adminId,
  'user_suspended',
  'user',
  :userId,
  JSON { reason: '...', duration: 30 }
)
```

**Wichtige Actions:**

- `user_suspended`
- `user_deleted`
- `seller_approved`
- `certificate_verified`
- `certificate_rejected`
- `product_rejected`
- `order_refunded`
- `config_changed`

**Zweck:**

- Nachvollziehbarkeit
- Compliance (DSGVO)
- Fehleranalyse

---

## 6. Performance

### 6.1 Dashboard-Caching

```
Dashboard-Statistiken ändern sich nicht sekündlich.

Cache:
  Key: "admin:dashboard"
  TTL: 5 Minuten

Invalidierung:
  - Manuell (Button "Refresh")
  - Bei wichtigen Events (neue Bestellung)
```

### 6.2 Report-Generation

```
Große Reports nicht im HTTP-Request!

Stattdessen:
  1. Job in Queue stellen
  2. Response: "Report wird generiert..."
  3. Background-Worker erstellt Report
  4. E-Mail an Admin mit Download-Link
```

---

## 7. Sicherheit

### 7.1 2FA für Admins (empfohlen)

```
Admins haben volle Kontrolle → 2FA Pflicht!

Implementierung:
  - TOTP (Google Authenticator, Authy)
  - SMS (weniger sicher)
  - Hardware-Token (YubiKey)
```

### 7.2 IP-Whitelist (optional)

```
Admins nur von bestimmten IPs:
  - Büro-Netzwerk
  - VPN

Bei Login von anderer IP:
  - E-Mail-Benachrichtigung
  - 2FA erforderlich
```

### 7.3 Rate-Limiting

```
Admin-Endpoints aggressiver limitieren:
  - 100 Requests / Minute (statt 1000 für normale User)
  - Verhindert Account-Kompromittierung
```

---

## 8. Monitoring & Alerts

### 8.1 Admin-Aktivität überwachen

```
Alert wenn:
  - > 10 User pro Stunde gesperrt
  - > 50 Produkte pro Stunde abgelehnt
  - Konfiguration mehrfach geändert

→ Könnte kompromittierter Admin-Account sein
```

### 8.2 SLA-Monitoring

```
Zertifikate > 24h PENDING:
  - E-Mail an Admins
  - Slack-Benachrichtigung
  - Dashboard-Alert
```

---

## 9. Wichtige Hinweise für Entwickler

### 9.1 Frontend-Framework

**Nicht vorgegeben!**

Empfehlungen:

- **React Admin:** Schnell, viele Features out-of-the-box
- **Vue Admin:** Ähnlich wie React Admin
- **Custom Dashboard:** Volle Kontrolle

**Beispiel (React Admin):**

```jsx
// Nutzer-Liste
<List>
  <Datagrid>
    <TextField source="email" />
    <TextField source="role" />
    <DateField source="createdAt" />
    <EditButton />
  </Datagrid>
</List>

// Zertifikats-Verifizierung
<Edit>
  <SimpleForm>
    <TextInput source="certificateNumber" disabled />
    <SelectInput source="status" choices={[
      { id: 'VERIFIED', name: 'Verifizieren' },
      { id: 'REJECTED', name: 'Ablehnen' }
    ]} />
  </SimpleForm>
</Edit>
```

### 9.2 API-Design

```
Konsistente Responses:
  - Immer { status, data, message }
  - Fehler immer mit Code

Pagination:
  - Immer { page, limit, total, totalPages }

Filter:
  - Query-Parameter standardisieren
```

### 9.3 Export-Formate

```
CSV:
  - Einfachste Option
  - Excel-kompatibel

XLSX:
  - Bessere Formatierung
  - Formeln möglich

PDF:
  - Nicht editierbar
  - Für Berichte
```

---

**Der Entwickler entscheidet:**

- Frontend-Framework (React Admin, Vue Admin, Custom)
- Dashboard-Design
- Chart-Library (Chart.js, Recharts, D3)
- Export-Library (csv-writer, exceljs, pdfkit)
- 2FA-Implementierung
- Projektstruktur
