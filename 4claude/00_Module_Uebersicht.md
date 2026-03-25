# Module-Übersicht
## Nachhaltigkeits-Zertifikat-Plattform

**Zweck:** Strukturvorlage und Übersicht für alle Module

---

## Modul-Liste

| Nr | Modul | Priorität | Zeit (h) | Abhängigkeiten | Dokument |
|----|-------|-----------|----------|----------------|----------|
| 01 | Authentication & User Management | CRITICAL | 40–50 | — | Modul_01_Authentication.md |
| 02 | Product Management | CRITICAL | 50–60 | 01 | Modul_02_Product_Management.md |
| 03 | Certificate Management | CRITICAL | 40–50 | 01, 02 | Modul_03_Certificate_Management.md |
| 04 | Matching Engine | HIGH | 30–40 | 01, 02, 03 | Modul_04_Matching_Engine.md |
| 05 | Shopping Cart & Checkout | CRITICAL | 35–45 | 01, 02 | Modul_05_Shopping_Cart_Checkout.md |
| 06 | Order Management | CRITICAL | 45–55 | 01, 02, 05 | Module_04-10_Komplett.md |
| 07 | Payment Processing | CRITICAL | 40–50 | 01, 05, 06 | Module_04-10_Komplett.md |
| 08 | File Upload & Storage | HIGH | 25–35 | 01 | Module_04-10_Komplett.md |
| 09 | Admin Panel | MEDIUM | 35–45 | 01, 02, 03, 06 | Module_04-10_Komplett.md |
| 10 | Email Service | HIGH | 20–30 | 01 | Module_04-10_Komplett.md |

**Gesamt:** 360–460 Stunden

---

## Entwicklungs-Reihenfolge

```
Phase 1 — Foundation:
  Woche 1–2:   Modul 01 (Auth)          CRITICAL
  Woche 2–3:   Modul 08 (Files)         parallel
  Woche 2–3:   Modul 10 (Email)         parallel

Phase 2 — Core Features:
  Woche 4–6:   Modul 02 (Products)      CRITICAL
  Woche 5–6:   Modul 04 (Matching)      parallel
  Woche 6–8:   Modul 03 (Certificates)  CRITICAL

Phase 3 — Commerce:
  Woche 8–10:  Modul 05 (Cart)          CRITICAL
  Woche 9–11:  Modul 07 (Payments)      CRITICAL
  Woche 10–12: Modul 06 (Orders)        CRITICAL

Phase 4 — Admin:
  Woche 12–16: Modul 09 (Admin Panel)
```

---

## Modul-Schnittstellen

```
Modul 01 → ALLE:   authenticate, authorize Middleware
Modul 02 → 03:     ProductsService.findById(), updateStock()
Modul 03 → 02:     CertificatesService.verify() → Cascade-Aktivierung
Modul 04 → 02:     calculateScore() wird in Produktliste integriert
Modul 05 → 06:     CheckoutService.complete() → OrdersService.create()
Modul 06 → 07:     OrdersService → PaymentsService
Modul 08 → 02, 03: FileService wird von Products & Certificates genutzt
Modul 10 → ALLE:   EmailService wird von allen Modulen bei Events aufgerufen
```

---

## Modul 01: Authentication & User Management

### Verantwortlichkeiten
- Registrierung & Login (Käufer, Verkäufer)
- JWT-Token-Management (Access + Refresh)
- Passwort-Hashing und -Reset
- Werteprofil-Verwaltung (einfach & erweitert)
- Adress-Verwaltung
- Verkäufer-Profil & Admin-Freigabe
- Rollen-basierte Zugriffskontrolle
- DSGVO-konforme Account-Löschung

### Prisma Schema (Auszug)

```prisma
model User {
  id            String        @id @default(uuid())
  email         String        @unique
  password      String
  firstName     String
  lastName      String
  role          UserRole      @default(BUYER)
  status        UserStatus    @default(ACTIVE)
  emailVerified Boolean       @default(false)
  createdAt     DateTime      @default(now())

  profile       UserProfile?
  sellerProfile SellerProfile?
  addresses     Address[]
  refreshTokens RefreshToken[]
}

enum UserRole   { BUYER SELLER ADMIN }
enum UserStatus { ACTIVE SUSPENDED DELETED }

model UserProfile {
  id                String  @id @default(uuid())
  userId            String  @unique
  activeProfileType String  @default("none") // none | simple | extended
  simpleProfile     Json?   // { "Faire Arbeit": 80, "Umwelt": 90 ... }
  extendedProfile   Json?   // { "Faire Arbeit": { "Faire Löhne": 90 ... } }
}

model SellerProfile {
  id           String       @id @default(uuid())
  userId       String       @unique
  companyName  String
  vatId        String?
  iban         String?
  status       SellerStatus @default(PENDING)
}

enum SellerStatus { PENDING APPROVED SUSPENDED }
```

### API-Endpoints

| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| POST | `/auth/register` | — | Registrierung |
| POST | `/auth/login` | — | Login |
| POST | `/auth/logout` | Ja | Logout |
| POST | `/auth/refresh` | — | Token erneuern |
| POST | `/auth/verify-email` | — | E-Mail bestätigen |
| POST | `/auth/forgot-password` | — | Passwort-Reset anfordern |
| POST | `/auth/reset-password` | — | Passwort zurücksetzen |
| GET | `/users/me` | Ja | Eigenes Profil |
| PATCH | `/users/me` | Ja | Profil aktualisieren |
| DELETE | `/users/me` | Ja | Account löschen |
| GET | `/users/me/profile` | Ja | Werteprofil abrufen |
| PUT | `/users/me/profile` | Ja | Werteprofil speichern |
| GET | `/users/me/addresses` | Ja | Adressen abrufen |
| POST | `/users/me/addresses` | Ja | Adresse hinzufügen |
| DELETE | `/users/me/addresses/:id` | Ja | Adresse löschen |
| GET | `/admin/users` | Admin | Alle Nutzer |
| PATCH | `/admin/users/:id/suspend` | Admin | Nutzer sperren |
| PATCH | `/admin/sellers/:id/approve` | Admin | Verkäufer freigeben |

### Schnittstellen

**Exportiert (für andere Module):**
```typescript
authenticate    // Middleware: JWT prüfen, req.user setzen
authorize(roles) // Middleware: Rollen prüfen
```

**Details:** Siehe `Modul_01_Authentication.md`

---

## Modul 02: Product Management

### Verantwortlichkeiten
- Produkt-CRUD für Verkäufer
- Kategorien-Verwaltung (3 Ebenen)
- Varianten (Größe, Farbe, Custom)
- Lagerbestand & Reservierung
- Multi-Shop-Support
- Produktsuche & Filter
- Matching-Score-Integration

### API-Endpoints (Auszug)

```
GET    /products              Produktliste (public)
GET    /products/:id          Produktdetails
POST   /products              Erstellen (Seller)
PATCH  /products/:id          Bearbeiten (Seller)
DELETE /products/:id          Löschen (Seller)
POST   /products/:id/images   Bilder hochladen
GET    /categories            Kategorienbaum
GET    /shops/:slug           Shop-Seite
```

**Details:** Siehe `Modul_02_Product_Management.md`

---

## Modul 03: Certificate Management

### Verantwortlichkeiten
- Zertifikats-Upload (Verkäufer)
- Verifizierung (Admin, 24h SLA)
- Ablauf-Management & Erinnerungen
- Produkt-Zertifikat-Zuordnung
- Cascade-Aktivierung

**Details:** Siehe `Modul_03_Certificate_Management.md`

---

## Modul 04: Matching Engine

### Verantwortlichkeiten
- Match-Score-Berechnung
- Bulk-Berechnung für Produktlisten
- Persönliche Empfehlungen
- Match-Breakdown (Transparenz)

**Details:** Siehe `Modul_04_Matching_Engine.md`

---

## Modul 05: Shopping Cart & Checkout

### Verantwortlichkeiten
- Warenkorb (Gast + User)
- Gast-Cart-Merge bei Login
- Multi-Step Checkout
- Lagerbestand-Validierung

**Details:** Siehe `Modul_05_Shopping_Cart_Checkout.md`

---

## Module 06–10

Alle weiteren Module sind in `Module_04-10_Komplett.md` vollständig dokumentiert:

| Modul | Inhalt |
|-------|--------|
| **06** | Order Management — Bestellverwaltung, Status-Tracking |
| **07** | Payment Processing — Zahlungsabwicklung, Auszahlungen |
| **08** | File Upload & Storage — Bilder, Zertifikatsdokumente |
| **09** | Admin Panel — Dashboard, Nutzerverwaltung |
| **10** | Email Service — Transaktions-E-Mails, Benachrichtigungen |

---

## Standard-Modul-Template

Jedes Modul-Dokument folgt dieser Struktur:

```
1. Überblick
   - Verantwortlichkeiten
   - Abhängigkeiten
   - Schnittstellen (Input/Output)

2. Datenbank-Schema (Prisma)

3. API-Endpoints

4. Backend-Implementierung
   4.1 DTOs & Validation
   4.2 Repository
   4.3 Service
   4.4 Controller
   4.5 Routes

5. Frontend-Integration
   5.1 API-Client
   5.2 Hooks
   5.3 Komponenten

6. Tests
   6.1 Unit-Tests
   6.2 Integration-Tests

7. Checkliste
```
