# Modul 10: Email Service
## Spezifikation & Requirements

**Verantwortlichkeit:** E-Mail-Versand, Templates, Benachrichtigungen  
**Abhängigkeiten:** Alle Module (wird von allen genutzt)  
**Priorität:** HIGH

---

## 1. Überblick

Dieses Modul verwaltet alle E-Mail-Kommunikation der Plattform. Von Transaktions-E-Mails bis zu Marketing-Kampagnen.

### Was das Modul macht:

- **Transaktions-E-Mails** - Bestellbestätigung, Passwort-Reset, etc.
- **Benachrichtigungen** - Neue Bestellung, Zertifikat verifiziert, etc.
- **Template-Management** - HTML-E-Mail-Templates
- **Versand-Queue** - Asynchroner Versand
- **Tracking** - Öffnungsraten, Klickraten (optional)
- **Unsubscribe** - Abmeldung von Benachrichtigungen
- **Locale-Support** - Mehrsprachige E-Mails

### E-Mail-Typen:

| Kategorie | Beispiele | Abmeldbar? |
|-----------|-----------|------------|
| **Transaktional** | Bestellbestätigung, Passwort-Reset | ❌ Nein |
| **Benachrichtigung** | Neue Nachricht, Zertifikat verifiziert | ✅ Ja |
| **Marketing** | Newsletter, Angebote | ✅ Ja |

### Schnittstellen zu anderen Modulen:

**Wird aufgerufen von:**
- Modul 01: E-Mail-Verifizierung, Passwort-Reset
- Modul 02: Produkt aktiviert
- Modul 03: Zertifikat verifiziert/abgelehnt, Ablauf-Warnung
- Modul 05: Warenkorb-Erinnerung
- Modul 06: Bestellbestätigung, Versand-Benachrichtigung
- Modul 07: Zahlung erfolgreich, Auszahlung

**Bereitstellt:**

```
sendEmail(recipient, templateId, data)
  → Promise<boolean>
```

---

## 2. Datenmodell

### 2.1 EmailTemplate

E-Mail-Vorlagen (editierbar durch Admin).

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **templateId** | String | Ja | Eindeutige ID: "order_confirmation", "password_reset" |
| **name** | String | Ja | Lesbarer Name: "Bestellbestätigung" |
| **subject** | String | Ja | E-Mail-Betreff (kann Variablen enthalten) |
| **htmlBody** | Text | Ja | HTML-Template |
| **textBody** | Text | Ja | Plain-Text-Fallback |
| **category** | Enum | Ja | TRANSACTIONAL / NOTIFICATION / MARKETING |
| **locale** | String (5) | Ja | "de_DE", "en_US" |
| **isActive** | Boolean | Ja | Aktiv? |
| **variables** | JSONB | Ja | Liste der verfügbaren Variablen |
| **createdAt** | Timestamp | Ja | |
| **updatedAt** | Timestamp | Ja | |

**Beispiel:**

```json
{
  "templateId": "order_confirmation",
  "name": "Bestellbestätigung",
  "subject": "Bestellung {{orderNumber}} bestätigt",
  "htmlBody": "<html>...</html>",
  "textBody": "Ihre Bestellung {{orderNumber}} wurde bestätigt...",
  "category": "TRANSACTIONAL",
  "locale": "de_DE",
  "variables": ["orderNumber", "total", "items", "shippingAddress"]
}
```

**Indizes:**

```sql
CREATE UNIQUE INDEX idx_email_template_id_locale ON email_template(templateId, locale);
```

---

### 2.2 EmailLog

Protokolliert alle gesendeten E-Mails.

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **templateId** | String | Ja | Welches Template |
| **recipient** | String | Ja | E-Mail-Adresse |
| **userId** | UUID | Nein | Empfänger (falls User) |
| **subject** | String | Ja | Tatsächlicher Betreff |
| **status** | Enum | Ja | QUEUED / SENT / FAILED / BOUNCED / OPENED / CLICKED |
| **provider** | String | Ja | "sendgrid", "aws_ses", "smtp", etc. |
| **providerId** | String | Nein | Message-ID vom Provider |
| **errorMessage** | Text | Nein | Bei Fehler |
| **sentAt** | Timestamp | Nein | Wann versendet |
| **openedAt** | Timestamp | Nein | Wann geöffnet (Tracking) |
| **clickedAt** | Timestamp | Nein | Wann geklickt (Tracking) |
| **createdAt** | Timestamp | Ja | Wann erstellt |

**Indizes:**

```sql
CREATE INDEX idx_email_log_recipient ON email_log(recipient, createdAt DESC);
CREATE INDEX idx_email_log_user ON email_log(userId, createdAt DESC);
CREATE INDEX idx_email_log_status ON email_log(status);
CREATE INDEX idx_email_log_provider_id ON email_log(providerId);
```

---

### 2.3 EmailPreference (Abmelde-Präferenzen)

User kann bestimmte E-Mail-Typen abbestellen.

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **userId** | UUID | Nein | User (NULL = Gast via E-Mail) |
| **email** | String | Nein | E-Mail (bei Gast) |
| **notificationEmails** | Boolean | Ja | Benachrichtigungen? (default: true) |
| **marketingEmails** | Boolean | Ja | Marketing? (default: true) |
| **unsubscribeToken** | String | Ja | Token für Abmelde-Link |
| **createdAt** | Timestamp | Ja | |
| **updatedAt** | Timestamp | Ja | |

**Constraint:**

```sql
CHECK (
  (userId IS NOT NULL AND email IS NULL) OR
  (userId IS NULL AND email IS NOT NULL)
)
```

**Indizes:**

```sql
CREATE INDEX idx_email_preference_user ON email_preference(userId);
CREATE INDEX idx_email_preference_email ON email_preference(email);
CREATE INDEX idx_email_preference_token ON email_preference(unsubscribeToken);
```

---

## 3. E-Mail-Templates

### 3.1 Template-Variablen

**Verfügbare Variablen je Template:**

**order_confirmation:**
```
{{userName}}
{{orderNumber}}
{{orderDate}}
{{total}}
{{items}} (Array)
{{shippingAddress}}
{{trackingUrl}}
```

**password_reset:**
```
{{userName}}
{{resetLink}}
{{expiresIn}} (z.B. "24 Stunden")
```

**certificate_verified:**
```
{{sellerName}}
{{certificateType}}
{{certificateNumber}}
{{productsCount}}
{{dashboardLink}}
```

---

### 3.2 Template-Engine

**Handlebars (empfohlen):**

```html
<h1>Hallo {{userName}}!</h1>

<p>Ihre Bestellung <strong>{{orderNumber}}</strong> wurde bestätigt.</p>

<table>
  {{#each items}}
  <tr>
    <td>{{this.name}}</td>
    <td>{{this.quantity}}×</td>
    <td>{{this.price}} EUR</td>
  </tr>
  {{/each}}
</table>

<p>Gesamtsumme: <strong>{{total}} EUR</strong></p>
```

**Alternative:** Mustache, EJS, Pug

---

### 3.3 Standard-Templates

**Liste aller Templates:**

| Template ID | Kategorie | Trigger |
|-------------|-----------|---------|
| `email_verification` | TRANSACTIONAL | User registriert sich |
| `password_reset` | TRANSACTIONAL | User fordert Reset an |
| `order_confirmation` | TRANSACTIONAL | Bestellung erfolgreich |
| `order_shipped` | NOTIFICATION | OrderGroup versendet |
| `order_delivered` | NOTIFICATION | OrderGroup zugestellt |
| `certificate_verified` | NOTIFICATION | Zertifikat verifiziert |
| `certificate_rejected` | NOTIFICATION | Zertifikat abgelehnt |
| `certificate_expiring` | NOTIFICATION | Zertifikat läuft ab (30d + 7d) |
| `seller_approved` | NOTIFICATION | Verkäufer freigeschaltet |
| `payout_completed` | NOTIFICATION | Auszahlung erfolgt |
| `new_message` | NOTIFICATION | Neue Nachricht (falls Chat-System) |
| `cart_abandoned` | MARKETING | Warenkorb > 24h |
| `product_recommendation` | MARKETING | Neue Produkte passend zu Profil |

---

## 4. API-Endpoints

### 4.1 Internes API (wird von anderen Modulen aufgerufen)

**Nicht öffentlich! Nur Server-to-Server.**

```
EmailService.sendEmail(options)
```

**Options:**

```javascript
{
  templateId: 'order_confirmation',
  recipient: 'kunde@example.com',
  userId: 'user-123',  // optional
  locale: 'de_DE',
  data: {
    userName: 'Max Mustermann',
    orderNumber: 'ORD-2024-00123',
    total: 76.28,
    items: [...]
  }
}
```

**Implementierung:**

```
function sendEmail(options):
  
  1. Template holen:
     template = SELECT * FROM email_template
                WHERE templateId = :templateId
                AND locale = :locale
                AND isActive = true
  
  2. Prüfen ob User abgemeldet (wenn NOTIFICATION/MARKETING):
     if (template.category != 'TRANSACTIONAL'):
       pref = SELECT * FROM email_preference
              WHERE (userId = :userId OR email = :recipient)
       
       if (pref.notificationEmails == false && category == 'NOTIFICATION'):
         return false  # Nicht senden
       
       if (pref.marketingEmails == false && category == 'MARKETING'):
         return false  # Nicht senden
  
  3. Template rendern:
     subject = Handlebars.compile(template.subject)(data)
     htmlBody = Handlebars.compile(template.htmlBody)(data)
     textBody = Handlebars.compile(template.textBody)(data)
  
  4. Unsubscribe-Link hinzufügen (wenn NOTIFICATION/MARKETING):
     if (template.category != 'TRANSACTIONAL'):
       token = getOrCreateUnsubscribeToken(userId, recipient)
       htmlBody += '<p><a href="{{unsubscribeUrl}}">Abmelden</a></p>'
       htmlBody = htmlBody.replace('{{unsubscribeUrl}}', `https://example.com/unsubscribe/${token}`)
  
  5. In Queue stellen:
     INSERT INTO email_queue (
       templateId, recipient, userId, subject, htmlBody, textBody, status
     ) VALUES (...)
  
  6. Worker verarbeitet Queue (siehe 4.2)
```

---

### 4.2 Queue-Worker (Background-Job)

**Läuft permanent, verarbeitet Queue:**

```
while (true):
  
  # Hole nächste E-Mail
  email = SELECT * FROM email_log
          WHERE status = 'QUEUED'
          ORDER BY createdAt ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
  
  if (!email):
    sleep(1 second)
    continue
  
  try:
    # Provider-API aufrufen
    if (EMAIL_PROVIDER == 'SENDGRID'):
      result = sendgrid.send({
        to: email.recipient,
        subject: email.subject,
        html: email.htmlBody,
        text: email.textBody
      })
    
    else if (EMAIL_PROVIDER == 'AWS_SES'):
      result = ses.sendEmail({
        Destination: { ToAddresses: [email.recipient] },
        Message: {
          Subject: { Data: email.subject },
          Body: {
            Html: { Data: email.htmlBody },
            Text: { Data: email.textBody }
          }
        }
      })
    
    # Erfolg
    UPDATE email_log
    SET status = 'SENT',
        providerId = result.messageId,
        sentAt = NOW()
    WHERE id = email.id
  
  catch (error):
    # Fehler
    UPDATE email_log
    SET status = 'FAILED',
        errorMessage = error.message
    WHERE id = email.id
    
    # Retry (max. 3×)
    if (email.retryCount < 3):
      INSERT INTO email_queue (...)  # Nochmal in Queue
```

---

### 4.3 GET /unsubscribe/:token (Abmelden)

**Öffentlich:** Jeder mit Token kann abmelden.

**Response (HTML-Seite):**

```html
<h1>Abmeldung</h1>

<form method="POST" action="/unsubscribe/{{token}}">
  <label>
    <input type="checkbox" name="notifications" checked>
    Benachrichtigungen (Bestellstatus, etc.)
  </label>
  
  <label>
    <input type="checkbox" name="marketing" checked>
    Marketing (Newsletter, Angebote)
  </label>
  
  <button>Abmelden</button>
</form>
```

---

### 4.4 POST /unsubscribe/:token (Abmeldung speichern)

**Request:**

```
notifications: off
marketing: off
```

**Workflow:**

```
1. Token validieren:
   pref = SELECT * FROM email_preference WHERE unsubscribeToken = :token
   
   if (!pref):
     throw 404 Not Found

2. Präferenzen updaten:
   UPDATE email_preference
   SET notificationEmails = :notifications,
       marketingEmails = :marketing
   WHERE id = pref.id

3. Bestätigung anzeigen:
   "Sie wurden erfolgreich abgemeldet."
```

---

## 5. E-Mail-Provider

### 5.1 SendGrid (empfohlen)

**Vorteile:**
- Günstig (100 E-Mails/Tag kostenlos)
- Einfache API
- Tracking (Öffnungsrate, Klickrate)
- Webhooks

**Setup:**

```
1. SendGrid-Account erstellen
2. API-Key generieren
3. Domain verifizieren (SPF, DKIM)
4. Webhook für Events einrichten
```

**Code:**

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: 'kunde@example.com',
  from: 'noreply@myplatform.com',
  subject: 'Bestellung bestätigt',
  html: '<html>...</html>',
  text: 'Ihre Bestellung wurde bestätigt...'
});
```

---

### 5.2 AWS SES (Alternative)

**Vorteile:**
- Sehr günstig ($0.10 pro 1000 E-Mails)
- AWS-Integration

**Nachteile:**
- Komplexere Setup (IAM, Sandbox)
- Kein eingebautes Tracking

---

### 5.3 SMTP (Fallback)

**Für kleine Plattformen:**

```
SMTP-Server: smtp.example.com
Port: 587 (TLS)
Username: noreply@myplatform.com
Password: ***
```

**Nachteile:**
- Langsamer
- Kein Tracking
- Rate-Limits

---

## 6. Tracking & Analytics

### 6.1 Öffnungsrate (Open Tracking)

**Wie funktioniert's:**

```
1×1 Pixel-Bild in E-Mail einfügen:
  <img src="https://track.myplatform.com/open/{{emailLogId}}" width="1" height="1">

Wenn User E-Mail öffnet:
  → Browser lädt Bild
  → Server registriert:
     UPDATE email_log SET status = 'OPENED', openedAt = NOW() WHERE id = :id
```

---

### 6.2 Klickrate (Click Tracking)

**Wie funktioniert's:**

```
Links in E-Mail umschreiben:
  Original: https://myplatform.com/products/bio-tshirt
  Tracking: https://track.myplatform.com/click/{{emailLogId}}/{{linkId}}

Wenn User klickt:
  1. Server registriert Klick:
     UPDATE email_log SET status = 'CLICKED', clickedAt = NOW()
  
  2. Redirect zum Original:
     Response: 302 Redirect → https://myplatform.com/products/bio-tshirt
```

---

### 6.3 Metrics-Dashboard (für Admins)

```
GET /admin/email/metrics

Response:
{
  "last30Days": {
    "sent": 15234,
    "opened": 8521,
    "clicked": 3421,
    "bounced": 45,
    "openRate": 55.9,  # %
    "clickRate": 22.4  # %
  },
  "byTemplate": [
    {
      "templateId": "order_confirmation",
      "sent": 892,
      "openRate": 78.3,
      "clickRate": 12.1
    }
  ]
}
```

---

## 7. Webhooks (Provider-Events)

### 7.1 SendGrid Webhooks

**Events:**
- `delivered` - E-Mail zugestellt
- `bounce` - E-Mail nicht zustellbar
- `open` - E-Mail geöffnet
- `click` - Link geklickt
- `spam` - Als Spam markiert

**Endpoint:**

```
POST /webhooks/sendgrid

Request:
[
  {
    "event": "delivered",
    "email": "kunde@example.com",
    "sg_message_id": "xxx",
    "timestamp": 1677491234
  }
]

Handler:
  for event in events:
    UPDATE email_log
    SET status = event.event.toUpperCase(),
        sentAt = FROM_UNIXTIME(event.timestamp)
    WHERE providerId = event.sg_message_id
```

---

## 8. Locale-Support (Mehrsprachigkeit)

### 8.1 User-Sprache erkennen

```
function getLocale(userId):
  
  # 1. User-Profil
  if (userId):
    user = SELECT * FROM users WHERE id = userId
    return user.preferredLocale || 'de_DE'
  
  # 2. Default
  return 'de_DE'
```

### 8.2 Fallback

```
Template-Suche:
  1. templateId = 'order_confirmation', locale = 'en_US'
     → Nicht gefunden
  
  2. Fallback: locale = 'de_DE'
     → Gefunden
```

---

## 9. Testing

### 9.1 Preview-Endpoint (für Admins)

```
GET /admin/email/preview/:templateId

Query-Parameter:
  ?locale=de_DE
  &data={"userName":"Max","orderNumber":"ORD-123"}

Response (HTML):
  Gerendertes E-Mail-Template
```

### 9.2 Test-E-Mail senden

```
POST /admin/email/test

Request:
{
  "templateId": "order_confirmation",
  "recipient": "admin@example.com",
  "data": { ... }
}

→ Sendet Test-E-Mail
```

---

## 10. Performance

### 10.1 Asynchrone Verarbeitung

**NIEMALS E-Mails im HTTP-Request senden!**

```
FALSCH:
  POST /checkout/complete
    → sendEmail(...)  # Blockiert 2-5 Sekunden!
    → Response

RICHTIG:
  POST /checkout/complete
    → emailQueue.add(...)  # In Queue stellen
    → Response (sofort)
  
  Worker (Background):
    → sendEmail(...)
```

---

### 10.2 Rate-Limiting

**SendGrid Free:** 100/Tag  
**SendGrid Essentials:** 100k/Monat

**Bei Überschreitung:**

```
if (EMAIL_PROVIDER == 'SENDGRID' && dailyCount > 100):
  # Fallback zu SMTP
  sendViaSmtp(email)
```

---

## 11. Sicherheit

### 11.1 SPF & DKIM

**Wichtig für Zustellbarkeit!**

```
SPF (DNS TXT-Record):
  v=spf1 include:sendgrid.net ~all

DKIM (DNS CNAME):
  s1._domainkey.myplatform.com → s1.domainkey.u123.sendgrid.net
  s2._domainkey.myplatform.com → s2.domainkey.u123.sendgrid.net
```

### 11.2 Rate-Limiting (Anti-Spam)

```
Max. E-Mails pro User:
  - 10 / Stunde (Transaktional)
  - 1 / Tag (Marketing)

Bei Überschreitung:
  → Blockieren
  → Admin-Alert
```

### 11.3 Unsubscribe-Token

```
Token = HMAC-SHA256(userId + email + SECRET)

Nicht:
  - UUID (könnte geraten werden)
  - Sequentielle ID
```

---

## 12. Wichtige Hinweise für Entwickler

### 12.1 Retry-Logik

```
Bei fehlgeschlagenem Versand:
  1. Retry nach 1 Minute
  2. Retry nach 10 Minuten
  3. Retry nach 1 Stunde
  
Nach 3 Versuchen:
  → Status = FAILED
  → Admin-Benachrichtigung
```

### 12.2 Template-Versionierung

```
Wenn Admin Template ändert:
  → Neue Version erstellen, alte behalten
  → Emails in Queue nutzen alte Version
  
Warum?
  - Konsistenz
  - Rollback möglich
```

### 12.3 DSGVO-Compliance

```
E-Mail-Logs aufbewahren:
  - Transaktional: 10 Jahre (Rechnungen)
  - Notification: 1 Jahr
  - Marketing: 6 Monate

Nach Ablauf:
  → Löschen oder anonymisieren
```

---

**Der Entwickler entscheidet:**
- E-Mail-Provider (SendGrid, AWS SES, SMTP)
- Template-Engine (Handlebars, Mustache, EJS)
- Queue-System (Redis, RabbitMQ, Database)
- Tracking (aktivieren/deaktivieren)
- Template-Designer (WYSIWYG oder Code)
- Projektstruktur
