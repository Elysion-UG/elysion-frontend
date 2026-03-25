# Entwicklungs-Roadmap & Sprint-Planung
## Nachhaltigkeits-Zertifikat-Plattform

**Version:** 1.0  
**Datum:** 05.02.2026  
**Team-Größe:** 2 Entwickler (Gründer)

---

## Inhaltsverzeichnis
1. [Entwicklungsphasen-Überblick](#1-entwicklungsphasen-überblick)
2. [Phase 1 - MVP (Sprints 1-8)](#2-phase-1---mvp-sprints-1-8)
3. [Phase 2 - Feature-Erweiterung (Sprints 9-14)](#3-phase-2---feature-erweiterung-sprints-9-14)
4. [Phase 3 - Skalierung & Optimierung](#4-phase-3---skalierung--optimierung)
5. [Technische Schulden & Refactoring](#5-technische-schulden--refactoring)
6. [Deployment-Strategie](#6-deployment-strategie)

---

## 1. Entwicklungsphasen-Überblick

### 1.1 Timeline

```
├─ Phase 1: MVP (3-4 Monate) ─────────────────────────┤
│  Ziel: Funktionsfähige Plattform mit Kernfeatures   │
│  Sprint 1-8 (2-Wochen-Sprints)                       │
│                                                       │
├─ Phase 2: Erweiterung (2-3 Monate) ─────────────────┤
│  Ziel: Erweiterte Features, UX-Verbesserungen       │
│  Sprint 9-14                                         │
│                                                       │
├─ Phase 3: Skalierung (2-3 Monate) ──────────────────┤
│  Ziel: Performance, Analytics, zusätzliche Features │
│  Sprint 15-20                                        │
│                                                       │
└─ Kontinuierliche Verbesserung ──────────────────────►
```

### 1.2 Meilensteine

| Meilenstein | Datum (geschätzt) | Beschreibung |
|-------------|-------------------|--------------|
| **M1: Dev-Setup** | Woche 1 | Repository, CI/CD, Infrastruktur |
| **M2: Authentifizierung** | Woche 3 | Login, Registrierung, JWT |
| **M3: Produkt-CRUD** | Woche 5 | Verkäufer können Produkte anlegen |
| **M4: Werteprofil** | Woche 7 | Einfaches Profil implementiert |
| **M5: Checkout** | Woche 10 | Bestellprozess funktioniert |
| **M6: Stripe-Integration** | Woche 11 | Zahlungen möglich |
| **M7: Zertifikate** | Woche 13 | Upload & Verifizierung |
| **M8: MVP-Launch** | Woche 16 | Soft-Launch mit ersten Verkäufern |
| **M9: Erweitertes Profil** | Woche 20 | 21 Unterpunkte implementiert |
| **M10: Gast-Checkout** | Woche 22 | Gäste können bestellen |
| **M11: Analytics** | Woche 26 | Verkäufer-Dashboard mit Daten |
| **M12: Public Launch** | Woche 28 | Marketing-Start |

### 1.3 Risikoanalyse

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Matching-Algorithmus zu komplex | Hoch | Mittel | Placeholder in MVP, Experten-Algorithmus später |
| Stripe-Integration Probleme | Mittel | Hoch | Früh testen, Sandbox nutzen, Support kontaktieren |
| Zu wenig Verkäufer bei Launch | Mittel | Hoch | Pre-Launch Akquise, 40-100 Partner sichern |
| Performance-Probleme | Niedrig | Mittel | Load-Testing, Caching, DB-Optimierung |
| DSGVO-Verstöße | Niedrig | Hoch | Rechtliche Beratung, Privacy by Design |

---

## 2. Phase 1 - MVP (Sprints 1-8)

**Ziel:** Funktionsfähige Plattform für 40-100 Verkäufer und erste Käufer  
**Dauer:** 16 Wochen (8 × 2-Wochen-Sprints)  
**Team:** 2 Full-Stack Entwickler

### Sprint 1 (Wochen 1-2): Projekt-Setup & Infrastruktur

**Ziel:** Fundament legen, Dev-Umgebung funktionsfähig

**Tasks:**
- [ ] Repository Setup (GitHub/GitLab)
  - Monorepo-Struktur: `/frontend`, `/backend`
  - Branch-Strategie: `main`, `develop`, `feature/*`
  - .gitignore konfigurieren
- [ ] Backend-Setup
  - Node.js, Express, TypeScript
  - Prisma Schema (Initial: User, Product, Order)
  - ESLint, Prettier
- [ ] Frontend-Setup
  - Next.js 14 initialisieren
  - Tailwind CSS konfigurieren
  - Folder-Struktur erstellen
- [ ] Docker-Compose für lokale Entwicklung
  - PostgreSQL
  - Redis
  - (Optional: Elasticsearch später)
- [ ] CI/CD Pipeline (GitHub Actions)
  - Linting & Tests bei jedem Push
  - Auto-Deploy zu Dev-Environment
- [ ] Cloud-Infrastruktur (AWS)
  - VPC, Subnets erstellen
  - RDS PostgreSQL (dev)
  - S3 Bucket für Uploads
  - EC2 oder Fargate (dev)
- [ ] Domain & SSL
  - Domain registrieren
  - Route 53 konfigurieren
  - SSL-Zertifikat (ACM)

**Deliverables:**
- ✓ Lokale Dev-Umgebung läuft (docker-compose up)
- ✓ CI/CD deployed automatisch zu dev.yourplatform.com
- ✓ Healthcheck-Endpoint: `GET /health` → 200 OK

**Aufwandsschätzung:** 60-80h (30-40h pro Entwickler)

---

### Sprint 2 (Wochen 3-4): Authentifizierung & Nutzerverwaltung

**Ziel:** User können sich registrieren, einloggen, Profile verwalten

**Tasks:**
- [ ] **Backend:**
  - User-Model (Prisma Schema)
  - Registrierung (POST /auth/register)
    - Passwort-Hashing (bcrypt)
    - E-Mail-Validierung
    - Double-Opt-In (E-Mail-Verifizierung)
  - Login (POST /auth/login)
    - JWT-Generierung (Access + Refresh Token)
  - Token-Refresh (POST /auth/refresh)
  - Passwort-Reset (POST /auth/forgot-password, /auth/reset-password)
  - Middleware: authenticate, authorize
- [ ] **Frontend:**
  - Login-Seite
  - Registrierungs-Seite (Käufer & Verkäufer)
  - Password-Reset-Flow
  - JWT-Storage (httpOnly Cookie oder localStorage)
  - axios Interceptor für Token-Handling
  - Protected Routes (HOC/Middleware)
- [ ] **E-Mail-Service:**
  - SendGrid-Integration
  - Templates: Verifizierung, Password-Reset
- [ ] **Testing:**
  - Unit-Tests für Auth-Service
  - Integration-Tests für Auth-Endpoints

**Deliverables:**
- ✓ Nutzer kann sich registrieren und einloggen
- ✓ E-Mail-Verifizierung funktioniert
- ✓ JWT-basierte Authentifizierung

**Aufwandsschätzung:** 70-90h

---

### Sprint 3 (Wochen 5-6): Produktverwaltung (Verkäufer)

**Ziel:** Verkäufer können Produkte anlegen, bearbeiten, löschen

**Tasks:**
- [ ] **Backend:**
  - Product, Category, Shop Models (Prisma)
  - CRUD-Endpoints für Produkte
    - POST /products (nur Seller)
    - GET /products (public, mit Filtern)
    - GET /products/:id (public)
    - PATCH /products/:id (nur Seller, nur eigene)
    - DELETE /products/:id (Soft-Delete)
  - File-Upload (Multer + S3)
    - POST /products/:id/images
    - Image-Optimierung (Sharp)
    - Thumbnail-Generierung
  - Varianten-Management (ProductVariant Model)
  - Kategorien-Endpoints (GET /categories)
- [ ] **Frontend:**
  - Verkäufer-Dashboard-Layout
  - Produktliste (Verkäufer-Sicht)
  - Produkt-Formular (Create/Edit)
    - Drag & Drop Image-Upload
    - Varianten-Editor (Größe, Farbe)
  - Produktdetails (Public View)
    - Image-Galerie
    - Varianten-Auswahl
- [ ] **Admin:**
  - Kategorie-Management (einfaches CRUD)

**Deliverables:**
- ✓ Verkäufer kann Produkte mit Bildern und Varianten anlegen
- ✓ Produkte sind öffentlich sichtbar (Detailseite)
- ✓ Image-Upload funktioniert (S3)

**Aufwandsschätzung:** 80-100h

---

### Sprint 4 (Wochen 7-8): Werteprofil & Matching (Einfach)

**Ziel:** Käufer können einfaches Profil erstellen, Match-Scores werden berechnet

**Tasks:**
- [ ] **Backend:**
  - UserProfile Model (JSON-Felder)
  - CRUD für Profil
    - GET /users/me/profile
    - PATCH /users/me/profile
  - Matching-Service (Placeholder-Algorithmus)
    - Funktion: `calculateMatchScore(userProfile, product)`
    - Einfache Logik: Gewichtete Summe
  - Produkt-Endpoints erweitern
    - GET /products?matchMin=70 (nur Produkte mit Score >= 70%)
    - Response enthält `matchScore` Feld
- [ ] **Frontend:**
  - Werteprofil-Seite
    - 7 Kategorien mit Schiebereglern (0-100%)
    - "Kategorie deaktivieren" Checkbox
    - Auto-Save (nach 1s Inaktivität)
  - Produktliste zeigt Match-Score
    - Farb-Codierung (Grün >80%, Gelb 60-80%, Grau <60%)
  - Sortierung nach Match-Score
  - Filter: "Min. Match-Score" Slider
- [ ] **Testing:**
  - Unit-Tests für Matching-Algorithmus
  - E2E-Test: Profil erstellen → Produkte sehen Match

**Deliverables:**
- ✓ Käufer kann einfaches Werteprofil erstellen
- ✓ Produkte zeigen Match-Score (Placeholder-Algorithmus)
- ✓ Sortierung/Filter nach Match funktioniert

**Aufwandsschätzung:** 70-90h

---

### Sprint 5 (Wochen 9-10): Warenkorb & Checkout-Flow

**Ziel:** Käufer können Bestellung abschließen (ohne Zahlung noch)

**Tasks:**
- [ ] **Backend:**
  - Cart-Logik
    - Session-basiert (Redis) oder DB
    - POST /cart/items (Artikel hinzufügen)
    - PATCH /cart/items/:id (Menge ändern)
    - DELETE /cart/items/:id
    - GET /cart
  - Order, OrderItem Models (Prisma)
  - Order-Endpoints
    - POST /orders (Bestellung erstellen, Status: PENDING)
    - GET /orders (User-Orders)
    - GET /orders/:id
  - Lagerbestand-Logik
    - Bei Order-Erstellung: Stock reservieren
    - Bei Stornierung: Stock freigeben
- [ ] **Frontend:**
  - Warenkorb-Seite
    - Artikel-Liste, Menge ändern, Entfernen
    - Zwischensumme, Versandkosten
    - "Zur Kasse" Button
  - Checkout-Flow (Multi-Step)
    - Schritt 1: Login/Gast
    - Schritt 2: Lieferadresse
    - Schritt 3: Versandart
    - Schritt 4: Übersicht (Zahlung in nächstem Sprint)
    - Progress-Indikator
  - Validierung pro Schritt
- [ ] **Address-Management:**
  - Address Model (Prisma)
  - CRUD für Adressen
  - Frontend: Adressbuch, neue Adresse anlegen

**Deliverables:**
- ✓ Warenkorb funktioniert (Artikel hinzufügen/entfernen)
- ✓ Checkout bis Schritt 3 (vor Zahlung) funktioniert
- ✓ Bestellung kann erstellt werden (Status: PENDING)

**Aufwandsschätzung:** 80-100h

---

### Sprint 6 (Wochen 11-12): Stripe-Integration & Zahlungen

**Ziel:** Zahlungen funktionieren, Bestellungen werden abgeschlossen

**Tasks:**
- [ ] **Backend:**
  - Stripe-Account erstellen (Test-Modus)
  - Payment Model (Prisma)
  - Payment-Endpoints
    - POST /payments/intent (Payment Intent erstellen)
    - POST /payments/webhook (Stripe Webhook)
  - Order-Status-Update
    - Bei payment.succeeded → Order.status = PAID
  - E-Mail-Service erweitern
    - Bestellbestätigung an Käufer
    - Bestellbenachrichtigung an Verkäufer
- [ ] **Frontend:**
  - Stripe Elements Integration
    - PaymentElement Component
  - Checkout Schritt 4: Zahlung
    - Zahlungsmethoden-Auswahl
    - Stripe-Form einbinden
  - Bestellbestätigung-Seite
    - Nach erfolgreicher Zahlung
    - Bestellnummer, Zusammenfassung
- [ ] **Testing:**
  - Stripe Test-Karten verwenden
  - Webhook-Testing (Stripe CLI)
  - E2E: Gesamter Checkout-Flow

**Deliverables:**
- ✓ Käufer können mit Stripe bezahlen
- ✓ Bestellungen werden korrekt abgeschlossen
- ✓ E-Mails werden versendet

**Aufwandsschätzung:** 70-90h

---

### Sprint 7 (Wochen 13-14): Zertifikatsverwaltung

**Ziel:** Verkäufer können Zertifikate hochladen, Admin kann verifizieren

**Tasks:**
- [ ] **Backend:**
  - Certificate, ProductCertificate Models (Prisma)
  - Certificate-Endpoints
    - POST /certificates (Verkäufer-Upload)
    - GET /certificates (Verkäufer: nur eigene, Admin: alle)
    - PATCH /certificates/:id (Verkäufer: Edit)
    - PATCH /certificates/:id/verify (Admin)
    - PATCH /certificates/:id/reject (Admin)
  - File-Upload für PDFs (S3)
  - Validierung (Ablaufdatum, Größe)
  - Cascade-Logik
    - Bei Verifizierung: Produkte aktivieren
    - Bei Ablauf: Produkte deaktivieren
  - Cron-Job (oder Scheduler)
    - Täglich ablaufende Zertifikate prüfen
    - E-Mail-Erinnerungen (30/14/7 Tage)
- [ ] **Frontend:**
  - Verkäufer: Zertifikate-Seite
    - Liste aller Zertifikate
    - Upload-Formular
    - Produkt-Zuordnung
    - Status-Anzeige
  - Admin: Verifizierungs-Interface
    - Liste offener Zertifikate (SLA-Sortierung)
    - PDF-Viewer inline
    - Prüf-Checkliste
    - Freigeben/Ablehnen/Nachfrage
  - Produkt-Formular erweitern
    - Zertifikat-Auswahl (Dropdown)

**Deliverables:**
- ✓ Verkäufer können Zertifikate hochladen
- ✓ Admin kann Zertifikate verifizieren/ablehnen
- ✓ Produkte werden automatisch aktiviert bei Verifizierung
- ✓ Ablauf-Reminder funktioniert

**Aufwandsschätzung:** 80-100h

---

### Sprint 8 (Wochen 15-16): Bestellverwaltung & MVP-Finish

**Ziel:** Verkäufer können Bestellungen verwalten, MVP ist produktionsbereit

**Tasks:**
- [ ] **Backend:**
  - Seller-Order-Endpoints
    - GET /seller/orders (nur eigene Produkte)
    - PATCH /orders/:id/ship (Tracking-Nummer)
  - Order-Status-Update-Logik
    - Bei /ship → Status = SHIPPED, Stock endgültig abgezogen
  - Payout Model & Logik (einfach)
    - Wöchentliche Berechnung (Cron-Job)
    - Provision-Berechnung
  - Stornierung & Rücksendungen (Basic)
    - PATCH /orders/:id/cancel (Käufer)
    - POST /orders/:id/return (Käufer)
- [ ] **Frontend:**
  - Verkäufer-Dashboard
    - Übersicht: Neue Bestellungen, Umsatz (basic)
    - Bestellliste
    - Bestellung-Details
    - "Als versendet markieren" Formular
  - Käufer: Bestellhistorie
    - Liste aller Bestellungen
    - Bestellung-Details
    - Stornieren-Button (wenn möglich)
    - Rechnung-Download (PDF generieren)
- [ ] **Testing & Bugfixing:**
  - Kompletter E2E-Test des Flows
  - Performance-Testing (Load-Test)
  - Security-Audit (Basic)
  - Bug-Fixing
- [ ] **Deployment:**
  - Production-Umgebung aufsetzen (AWS)
  - Database-Migration (Prod)
  - SSL/TLS (Production-Zertifikat)
  - Monitoring (Sentry, Logs)
- [ ] **Dokumentation:**
  - API-Dokumentation (Swagger/OpenAPI)
  - Deployment-Guide
  - User-Guides (Verkäufer-Onboarding)

**Deliverables:**
- ✓ Verkäufer können Bestellungen verwalten
- ✓ MVP ist vollständig funktionsfähig
- ✓ Production-Deployment erfolgreich
- ✓ Soft-Launch mit 10-20 Verkäufern

**Aufwandsschätzung:** 90-110h

---

### MVP-Zusammenfassung

**Gesamt-Aufwand Phase 1:** 600-760h (75-95 Arbeitstage pro Entwickler)  
**Dauer:** 16 Wochen (bei 2 Entwicklern parallel)

**MVP-Features:**
- ✅ Authentifizierung (Käufer, Verkäufer, Admin)
- ✅ Produktverwaltung (CRUD, Bilder, Varianten)
- ✅ Einfaches Werteprofil (7 Kategorien)
- ✅ Matching-Algorithmus (Placeholder)
- ✅ Warenkorb & Checkout
- ✅ Stripe-Zahlungen
- ✅ Zertifikatsverwaltung (Upload, Verifizierung)
- ✅ Bestellverwaltung (Verkäufer & Käufer)
- ✅ E-Mail-Benachrichtigungen
- ✅ Basis-Auszahlungen (wöchentlich)

**Nicht in MVP:**
- ❌ Erweitertes Werteprofil (21 Unterpunkte)
- ❌ Gast-Checkout
- ❌ Wunschliste
- ❌ Analytics-Dashboard
- ❌ Admin-Dashboard
- ❌ GOTS-Zertifikat (nur IVN)
- ❌ Rücksendungs-Management (komplexer Flow)
- ❌ Review-System

---

## 3. Phase 2 - Feature-Erweiterung (Sprints 9-14)

**Ziel:** Erweiterte Features, UX-Verbesserungen, mehr Zertifikate  
**Dauer:** 12 Wochen (6 × 2-Wochen-Sprints)

### Sprint 9 (Wochen 17-18): Erweitertes Werteprofil

**Tasks:**
- [ ] Backend: UserProfile erweitern (21 Unterpunkte)
- [ ] Matching-Algorithmus erweitern
  - Unterpunkt-Gewichtung berücksichtigen
  - Konfiguration via JSON/YAML
- [ ] Frontend: Erweiterte Profil-UI
  - Accordion pro Hauptkategorie
  - 2-3 Unterpunkte pro Kategorie
  - Gewichtungs-Berechnung visualisieren
- [ ] Migration: Bestehende Profile konvertieren

**Aufwand:** 60-80h

---

### Sprint 10 (Wochen 19-20): Gast-Checkout & Wunschliste

**Tasks:**
- [ ] Gast-Checkout implementieren
  - Backend: Temporäre Order ohne User-ID
  - Frontend: "Als Gast fortfahren" Flow
  - Nach Bestellung: Account-Erstellung anbieten
- [ ] Wunschliste
  - Backend: Wishlist Model
  - Frontend: Herz-Icon, Wunschliste-Seite
  - Benachrichtigung bei Preissenkung (Cron-Job)

**Aufwand:** 70-90h

---

### Sprint 11 (Wochen 21-22): Verkäufer-Analytics

**Tasks:**
- [ ] Analytics-Service
  - Aggregierte Daten: Umsatz, Bestellungen, Conversion
  - GET /seller/analytics?period=30d
- [ ] Dashboard-Widgets
  - Umsatz-Verlauf (Chart.js)
  - Top-Produkte
  - Matching-Insights (Durchschnitt-Score)
- [ ] Export-Funktion (CSV, PDF)

**Aufwand:** 70-90h

---

### Sprint 12 (Wochen 23-24): GOTS-Zertifikat & Multi-Cert

**Tasks:**
- [ ] Backend: GOTS-Zertifikatstyp hinzufügen
- [ ] Produkte können mehrere Zertifikate haben
- [ ] Matching-Algorithmus: Multiple Certs berücksichtigen
- [ ] Frontend: Zertifikats-Filter erweitern

**Aufwand:** 50-70h

---

### Sprint 13 (Wochen 25-26): Rücksendungs-Management

**Tasks:**
- [ ] Return Model & Flow (Prisma)
- [ ] Backend-Endpoints
  - POST /orders/:id/return (Käufer)
  - PATCH /returns/:id/approve (Verkäufer)
  - PATCH /returns/:id/refund (nach Wareneingang)
- [ ] Frontend: Rücksende-UI
  - Käufer: Rücksendung anfordern
  - Verkäufer: Rücksendungen verwalten
- [ ] Rückerstattungs-Logik (Stripe Refunds)

**Aufwand:** 80-100h

---

### Sprint 14 (Wochen 27-28): UX-Optimierung & Bugfixing

**Tasks:**
- [ ] Performance-Optimierung
  - Elasticsearch-Integration (Produktsuche)
  - Caching (Redis für Match-Scores)
  - Image-CDN (CloudFront)
- [ ] UX-Improvements
  - Loading-States
  - Error-Handling verbessern
  - Mobile-Optimierung
- [ ] SEO
  - Meta-Tags (Next.js)
  - Sitemap-Generierung
  - Open Graph Tags
- [ ] Bug-Fixing (aus User-Feedback)
- [ ] Public Launch vorbereiten

**Aufwand:** 70-90h

---

### Phase 2 Zusammenfassung

**Gesamt-Aufwand:** 400-520h (50-65 Arbeitstage pro Entwickler)  
**Neue Features:**
- ✅ Erweitertes Werteprofil (21 Unterpunkte)
- ✅ Gast-Checkout
- ✅ Wunschliste
- ✅ Verkäufer-Analytics
- ✅ GOTS-Zertifikat
- ✅ Rücksendungen (vollständig)
- ✅ Performance-Optimierungen
- ✅ SEO

---

## 4. Phase 3 - Skalierung & Optimierung

**Ziel:** Skalierung auf 1.000+ Verkäufer, 100.000+ Produkte  
**Dauer:** 12 Wochen (6 Sprints)

### Sprint 15-16: Admin-Dashboard

**Tasks:**
- [ ] Admin-Dashboard (KPIs, Statistiken)
- [ ] User-Management-Interface
- [ ] Plattform-Metriken (Prometheus + Grafana)

**Aufwand:** 100-120h

---

### Sprint 17-18: Erweiterte Analytics

**Tasks:**
- [ ] Matching-Score-Korrelation mit Verkäufen
- [ ] Conversion-Trichter
- [ ] Kohortenanalyse
- [ ] Predictive Analytics (ML-basiert, optional)

**Aufwand:** 100-120h

---

### Sprint 19-20: Weitere Zertifikate & Automatisierung

**Tasks:**
- [ ] 5+ weitere Zertifikate (Fair Trade, EU Ecolabel, etc.)
- [ ] Teilautomatisierung der Verifizierung
  - OCR für Zertifikatsnummer-Extraktion
  - API-Integration mit Zertifizierern (wenn möglich)

**Aufwand:** 80-100h

---

### Sprint 21-22: Review-System & Community

**Tasks:**
- [ ] Review Model & Endpoints
- [ ] Frontend: Bewertungen auf Produktseite
- [ ] Moderation (Admin kann Reviews löschen)
- [ ] Verkäufer-Bewertungen

**Aufwand:** 80-100h

---

### Sprint 23-24: Mobile App (Optional)

**Tasks:**
- [ ] React Native App (iOS + Android)
- [ ] Basis-Features: Produktsuche, Checkout, Profil
- [ ] Push-Notifications

**Aufwand:** 150-200h (wenn priorisiert)

---

## 5. Technische Schulden & Refactoring

**Kontinuierlich über alle Phasen:**

### 5.1 Code-Qualität

- [ ] **Sprint 4:** Erste Refactoring-Session
  - Code-Review aller bisherigen Features
  - Duplicate-Code eliminieren
  - Type-Safety verbessern
- [ ] **Sprint 8:** Zweite Refactoring-Session
  - Services extrahieren (aus Controllern)
  - Repository-Pattern konsequent nutzen
- [ ] **Sprint 14:** Dritte Refactoring-Session
  - Frontend: Component-Composition verbessern
  - Custom-Hooks extrahieren

### 5.2 Testing-Coverage

**Ziel: 80%+ Coverage**
- [ ] Sprint 1-8: Unit-Tests für kritische Services
- [ ] Sprint 9-14: Integration-Tests für alle Endpoints
- [ ] Sprint 15+: E2E-Tests (Cypress/Playwright)

### 5.3 Dokumentation

- [ ] Sprint 8: API-Dokumentation (Swagger)
- [ ] Sprint 14: User-Guides (Käufer, Verkäufer, Admin)
- [ ] Sprint 20: Developer-Docs (Onboarding für neue Devs)

---

## 6. Deployment-Strategie

### 6.1 Umgebungen

| Umgebung | URL | Zweck | Auto-Deploy |
|----------|-----|-------|-------------|
| **Local** | localhost | Entwicklung | Nein |
| **Dev** | dev.yourplatform.com | Testen von Features | Ja (bei Push zu `develop`) |
| **Staging** | staging.yourplatform.com | Pre-Production Testing | Ja (bei Push zu `main`) |
| **Production** | yourplatform.com | Live-System | Manuell (nach Review) |

### 6.2 CI/CD-Pipeline

```yaml
# .github/workflows/deploy.yml

on:
  push:
    branches: [develop, main]

jobs:
  test:
    - Run Linter
    - Run Unit Tests
    - Run Integration Tests
    
  build:
    - Build Docker Image
    - Push to ECR
    
  deploy-dev:
    if: branch == 'develop'
    - Deploy to Dev-Environment
    
  deploy-staging:
    if: branch == 'main'
    - Deploy to Staging
    
  deploy-production:
    if: manual-trigger
    - Deploy to Production
    - Smoke-Tests
    - Rollback on Error
```

### 6.3 Release-Prozess

**Sprint-Ende (jede 2. Woche):**
1. Feature-Branch → `develop` (via Pull Request)
2. Code-Review (gegenseitig)
3. Auto-Deploy zu Dev
4. QA-Testing (1-2 Tage)
5. `develop` → `main` (Merge)
6. Auto-Deploy zu Staging
7. Final-Testing
8. Manueller Deploy zu Production (Freitag Abend)

**Hotfixes:**
- Separate `hotfix/*` Branches
- Direkt zu `main` mergen
- Sofortiger Deploy

### 6.4 Database-Migrations

**Bei jedem Deploy:**
```bash
# In CI/CD:
npx prisma migrate deploy

# Rollback (wenn nötig):
npx prisma migrate reset --force
```

**Backup-Strategie:**
- Automated RDS-Snapshots (täglich)
- Vor jedem Production-Deploy: Manueller Snapshot

---

## 7. Ressourcen-Planung

### 7.1 Entwickler-Aufteilung (Vorschlag)

**Entwickler A (Frontend-Fokus):**
- Sprints 1-4: Frontend-Setup, Auth-UI, Produktansicht
- Sprints 5-8: Checkout-Flow, Zertifikate-UI, Verkäufer-Dashboard
- Sprints 9-14: Erweitertes Profil, Analytics-Dashboards
- Sprints 15+: Admin-Dashboard, UX-Optimierung

**Entwickler B (Backend-Fokus):**
- Sprints 1-4: Backend-Setup, Auth-Service, Produkt-API
- Sprints 5-8: Warenkorb, Stripe, Zertifikats-Logik
- Sprints 9-14: Matching-Algorithmus, Analytics-Service
- Sprints 15+: Performance-Optimierung, Microservices (optional)

**Gemeinsam:**
- Sprint-Planning (Montag, 2h)
- Daily Standups (15 Min)
- Code-Reviews
- Sprint-Review (Freitag, 1h)
- Retrospektive (Freitag, 30 Min)

### 7.2 Externe Unterstützung (Optional)

**Designer (Freelance):**
- UI/UX-Design (Wochen 1-4): 40-60h
- Redesign nach MVP-Feedback (Wochen 17-18): 20-30h

**QA-Tester (Freelance):**
- Pre-Launch Testing (Wochen 15-16): 40h
- Public-Launch Testing (Wochen 27-28): 40h

**Rechtliche Beratung:**
- AGB, Datenschutz, Impressum (Woche 1): 10-20h
- DSGVO-Audit (Woche 14): 10-20h

---

## 8. Kosten-Schätzung (Phase 1 - MVP)

| Kategorie | Kosten/Monat | Kosten 4 Monate |
|-----------|--------------|-----------------|
| **Cloud (AWS)** | 200-300 EUR | 800-1200 EUR |
| - EC2/Fargate | 100 EUR | 400 EUR |
| - RDS PostgreSQL | 50 EUR | 200 EUR |
| - S3 + CloudFront | 30 EUR | 120 EUR |
| - ElastiCache | 20 EUR | 80 EUR |
| **SaaS-Tools** | 150-200 EUR | 600-800 EUR |
| - Stripe | 0 (Provision) | 0 |
| - SendGrid | 15 EUR | 60 EUR |
| - Sentry | 26 EUR | 104 EUR |
| - GitHub | 0 (Free) | 0 |
| - Domain + SSL | 10 EUR | 40 EUR |
| **Externe Hilfe** | 0-500 EUR | 0-2000 EUR |
| - Designer | - | 1000-1500 EUR |
| - Rechtlich | - | 500-1000 EUR |
| **Gesamt** | 350-1000 EUR | 1400-4000 EUR |

**Hinweis:** Entwickler-Kosten nicht eingerechnet (da Gründer selbst entwickeln)

---

## 9. Erfolgskriterien

### 9.1 MVP-Launch (Sprint 8)

- [ ] 40-100 registrierte Verkäufer
- [ ] 500+ Produkte online
- [ ] 100+ registrierte Käufer
- [ ] 50+ erfolgreiche Bestellungen
- [ ] 95% Zertifikats-SLA eingehalten
- [ ] < 5 kritische Bugs
- [ ] Page-Load < 2s (Desktop)

### 9.2 Public-Launch (Sprint 14)

- [ ] 200+ Verkäufer
- [ ] 2.000+ Produkte
- [ ] 1.000+ Käufer
- [ ] 500+ Bestellungen
- [ ] 2%+ Conversion-Rate
- [ ] 80%+ Test-Coverage
- [ ] SEO-Optimierung (Page Speed > 90)

### 9.3 Skalierung (Sprint 24)

- [ ] 1.000+ Verkäufer
- [ ] 50.000+ Produkte
- [ ] 10.000+ Käufer
- [ ] 5.000+ Bestellungen/Monat
- [ ] 40%+ User-Retention (3 Monate)
- [ ] < 1s API-Response-Zeit (95. Perzentil)

---

**Ende Roadmap**

Diese Roadmap ist realistisch für 2 erfahrene Full-Stack-Entwickler. Die Schätzungen basieren auf agilen Best-Practices und beinhalten Buffer für unvorhergesehene Probleme. Regelmäßige Sprint-Reviews ermöglichen Anpassungen basierend auf Fortschritt und Feedback.
