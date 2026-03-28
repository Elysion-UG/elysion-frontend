# Modul 01: Authentication & User Management

## Spezifikation & Requirements

**Verantwortlichkeit:** Authentifizierung, Nutzerverwaltung, Werteprofil-System  
**Geschätzte Entwicklungszeit:** 40-50 Stunden  
**Abhängigkeiten:** Keine (Basis-Modul)  
**Priorität:** CRITICAL

---

## 1. Überblick

### 1.1 Verantwortlichkeiten

- Nutzer-Registrierung (Käufer & Verkäufer)
- Login & Logout
- Session-/Token-Verwaltung
- E-Mail-Verifizierung
- Passwort-Zurücksetzen
- Werteprofil-Verwaltung (3 Stufen)
- Adressverwaltung
- Rollen-basierte Zugriffskontrolle

### 1.2 Schnittstellen zu anderen Modulen

**Bereitstellt:**

- Authentifizierungs-Mechanismus (alle Module benötigen)
- Autorisierungs-Mechanismus (Rollen-Prüfung)
- User-ID für alle Geschäftsprozesse

**Benötigt:**

- E-Mail-Service (Modul 10) für Verifizierung & Passwort-Reset

---

## 2. Datenmodell

### 2.1 User (Hauptentität)

| Feld          | Typ           | Pflicht | Einzigartig | Beschreibung                      |
| ------------- | ------------- | ------- | ----------- | --------------------------------- |
| id            | UUID          | Ja      | Ja          | Primärschlüssel                   |
| email         | String        | Ja      | Ja          | E-Mail-Adresse                    |
| password      | String (Hash) | Ja      | —           | Passwort-Hash (niemals Klartext!) |
| role          | Enum          | Ja      | —           | BUYER / SELLER / ADMIN            |
| firstName     | String        | Nein    | —           | Vorname                           |
| lastName      | String        | Nein    | —           | Nachname                          |
| phone         | String        | Nein    | —           | Telefonnummer                     |
| emailVerified | Boolean       | Ja      | —           | Standard: false                   |
| status        | Enum          | Ja      | —           | ACTIVE / SUSPENDED / DELETED      |
| createdAt     | Timestamp     | Ja      | —           |                                   |
| updatedAt     | Timestamp     | Ja      | —           |                                   |

**Relationen:**

- 1:1 → UserProfile
- 1:n → Address
- 1:1 → SellerProfile (nur wenn role = SELLER)
- 1:n → RefreshToken (oder Session-Management)

### 2.2 UserProfile (Werteprofil)

| Feld              | Typ       | Beschreibung                                                      |
| ----------------- | --------- | ----------------------------------------------------------------- |
| id                | UUID      | Primärschlüssel                                                   |
| userId            | UUID (FK) | Referenz zu User                                                  |
| activeProfileType | String    | "none" / "simple" / "extended"                                    |
| simpleProfile     | JSON      | Einfaches Profil: `{ "Kategorie": Gewicht }`                      |
| extendedProfile   | JSON      | Erweitertes Profil: `{ "Kategorie": { "Subkategorie": Gewicht }}` |
| createdAt         | Timestamp |                                                                   |
| updatedAt         | Timestamp |                                                                   |

**Beispiel simpleProfile:**

```json
{
  "Faire Arbeitsbedingungen": 90,
  "Umweltfreundliche Produktion": 80,
  "Tierwohl": 70,
  "Lokale Produktion": 50,
  "Ressourcenschonung": 85,
  "Chemikalienfreiheit": 95,
  "Soziale Verantwortung": 60
}
```

**Beispiel extendedProfile:**

```json
{
  "Faire Arbeitsbedingungen": {
    "Existenzsichernder Lohn": 95,
    "Gewerkschaftsfreiheit": 85,
    "Keine Kinderarbeit": 100
  },
  "Umweltfreundliche Produktion": {
    "CO₂-Reduzierung": 80,
    "Wasserverbrauch": 70,
    "Erneuerbare Energien": 90
  }
}
```

### 2.3 SellerProfile (Verkäufer-Daten)

| Feld        | Typ       | Pflicht | Beschreibung                    |
| ----------- | --------- | ------- | ------------------------------- |
| id          | UUID      | Ja      | Primärschlüssel                 |
| userId      | UUID (FK) | Ja      | Referenz zu User                |
| companyName | String    | Ja      | Firmenname                      |
| vatId       | String    | Nein    | Umsatzsteuer-ID                 |
| iban        | String    | Nein    | Bankverbindung für Auszahlungen |
| status      | Enum      | Ja      | PENDING / APPROVED / SUSPENDED  |
| approvedAt  | Timestamp | Nein    | Zeitpunkt der Admin-Freigabe    |
| approvedBy  | UUID (FK) | Nein    | Admin, der freigegeben hat      |

**Business-Regel:** Verkäufer können erst Produkte einstellen, wenn `status = APPROVED`.

### 2.4 Address (Lieferadressen)

| Feld        | Typ       | Pflicht |
| ----------- | --------- | ------- | ------------------------- |
| id          | UUID      | Ja      |
| userId      | UUID (FK) | Ja      |
| type        | Enum      | Ja      | SHIPPING / BILLING / BOTH |
| firstName   | String    | Ja      |
| lastName    | String    | Ja      |
| street      | String    | Ja      |
| houseNumber | String    | Ja      |
| postalCode  | String    | Ja      |
| city        | String    | Ja      |
| country     | String    | Ja      | Standard: "DE"            |
| isDefault   | Boolean   | Ja      | Standard: false           |

**Business-Regel:** Maximal eine Adresse pro Nutzer darf `isDefault = true` sein.

### 2.5 RefreshToken / Session

**Zweck:** Persistent-Login ermöglichen

| Feld      | Typ       | Beschreibung                     |
| --------- | --------- | -------------------------------- |
| id        | UUID      | Primärschlüssel                  |
| userId    | UUID (FK) | Referenz zu User                 |
| token     | String    | Hash des Tokens (nicht Klartext) |
| expiresAt | Timestamp | Ablaufzeitpunkt                  |
| createdAt | Timestamp |                                  |

**Business-Regel:** Abgelaufene Tokens regelmäßig löschen (Cleanup-Job).

---

## 3. API-Endpoints

### 3.1 Authentifizierung

| Methode | Pfad                    | Auth | Beschreibung                                 |
| ------- | ----------------------- | ---- | -------------------------------------------- |
| POST    | `/auth/register`        | —    | Registrierung (Käufer oder Verkäufer)        |
| POST    | `/auth/login`           | —    | Login (E-Mail + Passwort)                    |
| POST    | `/auth/logout`          | Ja   | Logout (Token ungültig machen)               |
| POST    | `/auth/refresh`         | —    | Neues Access-Token (mit Refresh-Token)       |
| POST    | `/auth/verify-email`    | —    | E-Mail-Verifizierung (mit Token aus E-Mail)  |
| POST    | `/auth/forgot-password` | —    | Passwort-Reset-Link anfordern                |
| POST    | `/auth/reset-password`  | —    | Passwort zurücksetzen (mit Token aus E-Mail) |

#### POST /auth/register

**Request:**

```json
{
  "email": "max@example.com",
  "password": "SecurePass123!",
  "firstName": "Max",
  "lastName": "Mustermann",
  "role": "BUYER",

  // Nur wenn role = SELLER:
  "companyName": "Öko-Textil GmbH",
  "vatId": "DE123456789",
  "iban": "DE89370400440532013000"
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Registrierung erfolgreich. Bitte E-Mail bestätigen.",
  "data": {
    "userId": "uuid",
    "email": "max@example.com"
  }
}
```

**Validierung:**

- E-Mail: gültiges Format, noch nicht registriert
- Passwort: Min. 8 Zeichen, 1 Großbuchstabe, 1 Zahl
- Verkäufer: `companyName` ist Pflicht

**Prozess:**

1. Input validieren
2. E-Mail-Duplikat prüfen
3. Passwort hashen
4. User + ggf. SellerProfile anlegen
5. Verifizierungs-Token generieren
6. Verifizierungs-E-Mail senden
7. Response

#### POST /auth/login

**Request:**

```json
{
  "email": "max@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "max@example.com",
      "firstName": "Max",
      "lastName": "Mustermann",
      "role": "BUYER",
      "emailVerified": true
    }
  }
}
```

**Business-Regeln:**

- Account `status = ACTIVE` erforderlich
- Rate-Limiting: Max. 5 Versuche / 15 Min

#### POST /auth/verify-email

**Request:**

```json
{
  "token": "verification-token-aus-email"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "E-Mail erfolgreich verifiziert"
}
```

#### POST /auth/forgot-password

**Request:**

```json
{
  "email": "max@example.com"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Falls die E-Mail existiert, wurde ein Link gesendet."
}
```

**Sicherheit:** Gleiche Antwort immer (verhindert E-Mail-Enumeration).

#### POST /auth/reset-password

**Request:**

```json
{
  "token": "reset-token-aus-email",
  "newPassword": "NeuesPasswort123!"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Passwort erfolgreich zurückgesetzt"
}
```

### 3.2 Profil-Verwaltung

| Methode | Pfad                | Auth | Beschreibung            |
| ------- | ------------------- | ---- | ----------------------- |
| GET     | `/users/me`         | Ja   | Eigenes Profil abrufen  |
| PATCH   | `/users/me`         | Ja   | Profil aktualisieren    |
| DELETE  | `/users/me`         | Ja   | Account löschen (DSGVO) |
| GET     | `/users/me/profile` | Ja   | Werteprofil abrufen     |
| PUT     | `/users/me/profile` | Ja   | Werteprofil speichern   |

#### GET /users/me

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "max@example.com",
    "firstName": "Max",
    "lastName": "Mustermann",
    "phone": "+49 123 456789",
    "role": "BUYER",
    "emailVerified": true,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

**Sicherheit:** Passwort-Hash niemals zurückgeben!

#### PATCH /users/me

**Request (alle Felder optional):**

```json
{
  "firstName": "Maximilian",
  "lastName": "Muster",
  "phone": "+49 987 654321"
}
```

**Nicht änderbar:** `email`, `role`, `emailVerified`

#### DELETE /users/me

**DSGVO-Anforderungen:**

- Soft-Delete (Status → DELETED)
- Persönliche Daten anonymisieren
- Bestellhistorie bleibt erhalten
- Prozess dokumentieren

#### PUT /users/me/profile

**Request (Einfach):**

```json
{
  "activeProfileType": "simple",
  "simpleProfile": {
    "Faire Arbeitsbedingungen": 90,
    "Umweltfreundliche Produktion": 80,
    "Tierwohl": 70
  }
}
```

**Request (Erweitert):**

```json
{
  "activeProfileType": "extended",
  "extendedProfile": {
    "Faire Arbeitsbedingungen": {
      "Existenzsichernder Lohn": 95,
      "Gewerkschaftsfreiheit": 85
    }
  }
}
```

**Validierung:**

- Gewichte: 0–100
- Einfach: 7 Kategorien
- Erweitert: 7 Kategorien × 2-3 Subkategorien

### 3.3 Adressen

| Methode | Pfad                                  | Auth | Beschreibung        |
| ------- | ------------------------------------- | ---- | ------------------- |
| GET     | `/users/me/addresses`                 | Ja   | Alle Adressen       |
| POST    | `/users/me/addresses`                 | Ja   | Neue Adresse        |
| PATCH   | `/users/me/addresses/:id`             | Ja   | Adresse bearbeiten  |
| DELETE  | `/users/me/addresses/:id`             | Ja   | Adresse löschen     |
| PATCH   | `/users/me/addresses/:id/set-default` | Ja   | Als Standard setzen |

#### POST /users/me/addresses

**Request:**

```json
{
  "type": "SHIPPING",
  "firstName": "Max",
  "lastName": "Mustermann",
  "street": "Musterstraße",
  "houseNumber": "42",
  "postalCode": "12345",
  "city": "Berlin",
  "country": "DE",
  "isDefault": true
}
```

**Business-Regel:** Wenn `isDefault = true`, andere auf `false` setzen.

### 3.4 Admin-Funktionen

| Methode | Pfad                         | Auth  | Beschreibung            |
| ------- | ---------------------------- | ----- | ----------------------- |
| GET     | `/admin/users`               | Admin | Alle Nutzer (paginated) |
| GET     | `/admin/users/:id`           | Admin | Nutzer-Details          |
| PATCH   | `/admin/users/:id/suspend`   | Admin | Nutzer sperren          |
| PATCH   | `/admin/users/:id/activate`  | Admin | Nutzer aktivieren       |
| PATCH   | `/admin/sellers/:id/approve` | Admin | Verkäufer freigeben     |
| PATCH   | `/admin/sellers/:id/reject`  | Admin | Verkäufer ablehnen      |

**Autorisierung:** Nur `role = ADMIN`.

---

## 4. Business-Logik

### 4.1 Registrierung

**Käufer:**

1. E-Mail + Passwort + Name
2. E-Mail-Verifizierung erforderlich
3. Sofort nutzbar (eingeschränkt)

**Verkäufer:**

1. Wie Käufer + Firmendaten
2. Status: `PENDING`
3. Admin-Freigabe erforderlich
4. Nach Freigabe: Produkte einstellen möglich

### 4.2 Passwort-Sicherheit

- Niemals Klartext speichern
- Hashing-Algorithmus (Empfehlung: bcrypt, Argon2)
- Policy: Min. 8 Zeichen, 1 Großbuchstabe, 1 Zahl

### 4.3 Session-/Token-Management

**Konzept:**

- Access-Token: Kurz (15 Min – 1h), enthält User-ID + Rolle
- Refresh-Token: Lang (7–30 Tage), zum Erneuern
- Speicherung: Refresh gehashed in DB

**Logout:**

- Refresh-Token löschen
- Access-Token invalidieren

### 4.4 Werteprofil-System

| Stufe | Name        | Kategorien                |
| ----- | ----------- | ------------------------- |
| 0     | Kein Profil | —                         |
| 1     | Einfach     | 7 Hauptkategorien (0–100) |
| 2     | Erweitert   | 7 × (2-3 Subkategorien)   |

**Speicherung:** JSON (flexibel)

### 4.5 Autorisierung

**Middleware-Konzept:**

1. `authenticate`: Token prüfen, User-ID extrahieren
2. `authorize(roles)`: Rollen-Prüfung

---

## 5. Sicherheit

- ✅ Passwörter nur gehashed
- ✅ Rate-Limiting (Login: 5/15 Min)
- ✅ HTTPS-only
- ✅ Token-Lebensdauer begrenzt
- ✅ Input-Validierung (alle Endpoints)
- ✅ DSGVO-konforme Löschung

---

**Der Entwickler entscheidet:**

- Welche Technologie (Node.js, Python, Go, Rust, Java, ...)
- Welches Framework (Express, FastAPI, Gin, Actix, Spring, ...)
- Welche Datenbank (PostgreSQL, MySQL, MongoDB, ...)
- Welcher Hashing-Algorithmus (bcrypt, Argon2, scrypt, ...)
- Welches Token-Format (JWT, Opaque, Session-Cookies, ...)
- Testing-Strategie & Tools
- Projektstruktur & Code-Organisation
