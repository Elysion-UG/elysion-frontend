# Nachhaltigkeits-Zertifikat-Plattform - Dokumentation

**Projekt:** B2C-Plattform für nachhaltig zertifizierte Textilprodukte  
**Status:** Planungsphase  
**Version:** 1.0  
**Datum:** 05.02.2026

---

## 📋 Über dieses Projekt

Eine Web-Plattform, die Konsumenten mit nachhaltig zertifizierten Textilprodukten verbindet. Kunden können basierend auf ihren individuellen Nachhaltigkeitswerten (z.B. Faire Arbeitsbedingungen, Umweltfreundliche Produktion) Produkte finden, die zu ihnen passen. Die Plattform dient als Vermittlungsservice zwischen Endkunden und Textilproduzenten.

### Kernfeatures

- **Wertebasiertes Matching:** 3-stufiges Werteprofil-System (kein Profil, einfach mit 7 Kategorien, erweitert mit 21 Unterpunkten)
- **Verifizierte Zertifikate:** Manuelle Prüfung aller Nachhaltigkeitszertifikate innerhalb 24h
- **Multi-Shop-Support:** Verkäufer können mehrere Marken/Shops verwalten
- **Umfassende Analytics:** Datengetriebene Insights für Produzenten
- **Provisionsbasiertes Modell:** Zahlungsabwicklung über Plattform, automatische Auszahlungen

---

## 📚 Dokumentations-Struktur

Diese Dokumentation ist in mehrere Dokumente unterteilt, die zusammen einen vollständigen Entwicklungsplan bilden:

### 1. [Produktvision & Geschäftskonzept](01_Produktvision_und_Geschaeftskonzept.md)
**Executive Summary für alle Stakeholder**

- Produktvision & USPs
- Geschäftsmodell (Provisionsbasiert)
- Nutzergruppen (Käufer, Verkäufer, Admin)
- Werteprofil-System (3 Stufen)
- Zertifizierungssystem (IVN, später GOTS)
- Kernfunktionen-Überblick
- Entwicklungsphasen (MVP → Erweiterung → Skalierung)
- Technische Anforderungen (Überblick)
- Erfolgs-Metriken & KPIs
- Risiken & Mitigationsstrategien

**Zielgruppe:** Alle Team-Mitglieder, potentielle Investoren, Business-Stakeholder

---

### 2. [Funktionale Anforderungen](02_Funktionale_Anforderungen.md)
**Detaillierte Feature-Spezifikationen für Entwickler**

- **Nutzerverwaltung:** Rollen, Registrierung (Käufer/Verkäufer), Authentifizierung, Werteprofil-System (einfach & erweitert), Account-Management
- **Produktverwaltung:** CRUD-Operationen, Kategorien, Varianten (Größe/Farbe), Multi-Shop-Support, Lagerverwaltung, Suche & Filter, Matching-Transparenz
- **Zertifikatverwaltung:** Upload, Verifizierungsprozess (Admin), Produkt-Zuordnung, Ablauf-Management
- **Bestellsystem:** Warenkorb, Checkout (Multi-Step), Bestellhistorie, Versandstatus-Tracking, Stornierungen, Rücksendungen
- **Zahlungsabwicklung:** Stripe-Integration, Provisionsberechnung, Auszahlungen (wöchentlich), Rechnungserstellung
- **Empfehlungssystem:** Matching-Algorithmus (Placeholder → Komplex), Produktempfehlungen, Matching-Breakdown

**Zielgruppe:** Entwickler, Product Owner, QA

---

### 3. [Technische Architektur](03_Technische_Architektur.md)
**System-Design & Technologie-Stack**

- **System-Überblick:** High-Level Architektur, Komponenten-Diagramm
- **Technologie-Stack:**
  - Frontend: React.js/Next.js, Tailwind CSS, Zustand
  - Backend: Node.js/Express, TypeScript, Prisma
  - Datenbank: PostgreSQL, Redis (Caching)
  - File Storage: AWS S3
  - Search: Elasticsearch/Algolia
  - Payments: Stripe
  - Email: SendGrid
- **Architektur-Muster:** Monolith (MVP) → Microservices (später), Repository-Pattern, Service-Layer
- **Frontend-Architektur:** Projektstruktur, Routing (Next.js App Router), State-Management, API-Kommunikation
- **Backend-Architektur:** Projektstruktur, Module-Design, Error-Handling, Validation (Zod)
- **Datenbank-Design:** ER-Diagramm, vollständiges Prisma-Schema
- **API-Design:** RESTful Konventionen, Endpoint-Übersicht, Request/Response-Formate
- **Authentifizierung:** JWT (Access + Refresh Token), Password-Hashing (bcrypt)
- **Datei-Verwaltung:** Multer, S3-Integration, Image-Optimization
- **Drittanbieter-Integration:** Stripe (Details), SendGrid, Elasticsearch
- **Deployment & Infrastructure:** AWS-Setup, Docker, CI/CD (GitHub Actions)
- **Monitoring & Logging:** Winston, Sentry, CloudWatch

**Zielgruppe:** Entwickler, DevOps, Tech-Lead

---

### 4. [User Stories & Use Cases](04_User_Stories_und_Use_Cases.md)
**Szenarien aus Nutzerperspektive**

- **User Stories - Käufer:** Registrierung, Profil, Suche, Warenkorb, Checkout, Bestellverwaltung, Wunschliste (60+ Stories)
- **User Stories - Verkäufer:** Registrierung, Produktverwaltung, Zertifikate, Bestellungen, Analytics, Auszahlungen (40+ Stories)
- **User Stories - Admin:** Nutzer-Verwaltung, Zertifikats-Verifizierung, Plattform-Verwaltung (20+ Stories)
- **Use Cases - Detailliert:**
  - UC-001: Käufer erstellt erweitertes Werteprofil
  - UC-002: Verkäufer lädt Zertifikat hoch
  - UC-003: Käufer bestellt als Gast
  - UC-004: Admin verifiziert Zertifikat
- **User Journeys:**
  - Journey 1: Neuer Käufer findet passendes Produkt
  - Journey 2: Verkäufer onboarded Produkte
  - Journey 3: Admin managed Plattform

**Zielgruppe:** Entwickler, Product Owner, UX-Designer

---

### 5. [Entwicklungs-Roadmap](05_Entwicklungs_Roadmap.md)
**Sprint-Planung & Meilensteine**

- **Entwicklungsphasen-Überblick:** Phase 1 (MVP, 4 Monate) → Phase 2 (Erweiterung, 3 Monate) → Phase 3 (Skalierung, 3 Monate)
- **Phase 1 - MVP (Sprints 1-8):**
  - Sprint 1: Projekt-Setup & Infrastruktur
  - Sprint 2: Authentifizierung & Nutzerverwaltung
  - Sprint 3: Produktverwaltung
  - Sprint 4: Werteprofil & Matching (Einfach)
  - Sprint 5: Warenkorb & Checkout
  - Sprint 6: Stripe-Integration
  - Sprint 7: Zertifikatsverwaltung
  - Sprint 8: Bestellverwaltung & MVP-Finish
- **Phase 2 - Erweiterung (Sprints 9-14):**
  - Sprint 9: Erweitertes Werteprofil
  - Sprint 10: Gast-Checkout & Wunschliste
  - Sprint 11: Verkäufer-Analytics
  - Sprint 12: GOTS-Zertifikat
  - Sprint 13: Rücksendungs-Management
  - Sprint 14: UX-Optimierung, SEO
- **Phase 3 - Skalierung (Sprints 15-24):** Admin-Dashboard, Erweiterte Analytics, weitere Zertifikate, Review-System
- **Technische Schulden & Refactoring:** Code-Qualität, Testing-Coverage, Dokumentation
- **Deployment-Strategie:** Umgebungen (Dev/Staging/Prod), CI/CD-Pipeline, Release-Prozess
- **Ressourcen-Planung:** Entwickler-Aufteilung, externe Unterstützung
- **Kosten-Schätzung:** 1.400-4.000 EUR für MVP (4 Monate)
- **Erfolgskriterien:** MVP (40-100 Verkäufer, 500 Produkte), Public-Launch (200 Verkäufer, 2.000 Produkte)

**Zielgruppe:** Entwickler, Project Manager, Stakeholder

---

## 🎯 Schnellstart für Entwickler

### 1. Dokumentation lesen (in dieser Reihenfolge)

1. **Start:** [Produktvision](01_Produktvision_und_Geschaeftskonzept.md) (30 Min) - Verständnis des Business-Modells
2. **Features:** [Funktionale Anforderungen](02_Funktionale_Anforderungen.md) (2h) - Was gebaut werden soll
3. **Tech:** [Technische Architektur](03_Technische_Architektur.md) (2h) - Wie es gebaut werden soll
4. **Szenarien:** [User Stories](04_User_Stories_und_Use_Cases.md) (1h) - Nutzerperspektive verstehen
5. **Plan:** [Roadmap](05_Entwicklungs_Roadmap.md) (1h) - Wann was gebaut wird

**Gesamt-Lesezeit:** ~6-7 Stunden

### 2. Setup (Sprint 1)

```bash
# Repository klonen (nach Erstellung)
git clone https://github.com/your-org/sustainability-platform.git
cd sustainability-platform

# Backend-Setup
cd backend
npm install
cp .env.example .env  # Dann .env ausfüllen
npx prisma migrate dev --name init
npx prisma generate

# Frontend-Setup
cd ../frontend
npm install
cp .env.example .env.local  # Dann .env.local ausfüllen

# Lokale Umgebung starten (mit Docker)
cd ..
docker-compose up -d
```

### 3. Erste Schritte

- **Sprint-Planning lesen:** [Roadmap Sprint 1](05_Entwicklungs_Roadmap.md#sprint-1)
- **Prisma-Schema anschauen:** `backend/prisma/schema.prisma`
- **API-Endpoints definieren:** Siehe [Technische Architektur - API-Design](03_Technische_Architektur.md#7-api-design)
- **Erste User Story umsetzen:** [US-B-001: Registrierung](04_User_Stories_und_Use_Cases.md#11-registrierung--profil)

---

## 🔑 Wichtige Entscheidungen

### Technologie-Entscheidungen

| Bereich | Gewählt | Begründung |
|---------|---------|------------|
| **Frontend-Framework** | Next.js 14 | SSR für SEO, File-based Routing, Image-Optimization |
| **Backend-Framework** | Express.js | Flexibel, große Community, gute TypeScript-Unterstützung |
| **Datenbank** | PostgreSQL | Relational (passt zu Datenmodell), JSON-Support für Werteprofil |
| **ORM** | Prisma | Type-Safe, Migrationen, Developer Experience |
| **Styling** | Tailwind CSS | Utility-First, schnelle Entwicklung, geringe Bundle-Size |
| **State-Management** | Zustand + SWR | Leichtgewichtig, SWR für Server-State |
| **Zahlungen** | Stripe | Bewährt, PCI-DSS konform, gute Developer-Experience |
| **Cloud** | AWS | Skalierbar, alle benötigten Services verfügbar |
| **Suche** | Algolia (MVP) → Elasticsearch | Algolia: schneller Start, Elasticsearch: langfristig günstiger |

### Architektur-Entscheidungen

- **Monolith initial:** Schnellere Entwicklung, einfacher für 2 Entwickler
- **Microservices später:** Bei Skalierung auf 1.000+ Verkäufer
- **Repository-Pattern:** Abstrahierung der DB-Zugriffe, Testbarkeit
- **Matching-Algorithmus modular:** Einfach austauschbar wenn Experten-Algorithmus fertig
- **Soft-Delete für Produkte:** Bestellhistorie bleibt konsistent
- **Cascade-Aktivierung:** Zertifikatsbestätigung → automatische Produktfreigabe

---

## 📊 Projekt-Metriken

### MVP-Ziele (Sprint 8)

- **Verkäufer:** 40-100 registriert
- **Produkte:** 500+ online
- **Käufer:** 100+ registriert
- **Bestellungen:** 50+ erfolgreich
- **SLA:** 95% Zertifikats-Verifizierung < 24h
- **Performance:** Page-Load < 2s
- **Bugs:** < 5 kritische

### Entwicklungs-Aufwand (Schätzung)

| Phase | Dauer | Aufwand/Entwickler | Features |
|-------|-------|-------------------|----------|
| **Phase 1 (MVP)** | 16 Wochen | 75-95 Arbeitstage | Kernfeatures funktionsfähig |
| **Phase 2** | 12 Wochen | 50-65 Arbeitstage | Erweiterungen, UX |
| **Phase 3** | 12 Wochen | 60-75 Arbeitstage | Skalierung, Analytics |
| **Gesamt** | 40 Wochen | 185-235 Tage | Production-Ready Plattform |

---

## 🛠️ Tooling & Services

### Entwicklung

- **IDE:** VS Code (empfohlen)
- **Git:** GitHub / GitLab
- **API-Testing:** Postman / Insomnia
- **DB-Client:** Prisma Studio, TablePlus

### SaaS-Services

- **Stripe:** Zahlungsabwicklung
- **SendGrid:** Transaktions-E-Mails
- **AWS:** Cloud-Infrastruktur
- **Sentry:** Error-Tracking
- **Algolia:** Produktsuche (MVP)

### CI/CD

- **GitHub Actions:** Build, Test, Deploy
- **Docker:** Container für alle Umgebungen
- **AWS ECR:** Docker Registry

---

## 📞 Nächste Schritte

### Vor Sprint 1

1. **Team-Meeting:** Dokumentation gemeinsam durchgehen (4h)
2. **Fragen klären:** Unklarheiten dokumentieren
3. **Accounts erstellen:**
   - AWS-Account (mit Billing-Alerts)
   - Stripe-Account (Test-Modus)
   - SendGrid-Account
   - GitHub-Organization
4. **Design-Brief:** An Designer schicken (falls extern)
5. **Rechtliche Basics:** AGB, Datenschutz, Impressum vorbereiten lassen

### Sprint 1 Start (Woche 1)

1. **Sprint-Planning:** [Sprint 1 Tasks](05_Entwicklungs_Roadmap.md#sprint-1) durchgehen
2. **Repository erstellen:** Monorepo-Struktur aufsetzen
3. **Docker-Setup:** Lokale Entwicklungsumgebung
4. **Erste Commits:** Basis-Setup (Backend + Frontend)
5. **CI/CD:** GitHub Actions konfigurieren

---

## 🤝 Kontakte & Support

**Team:**
- Entwickler A: [Kontakt]
- Entwickler B: [Kontakt]

**Externe:**
- Designer: [Kontakt] (falls beauftragt)
- Rechtsberatung: [Kontakt]
- Nachhaltigkeits-Experten: [Kontakt] (für Matching-Algorithmus)

**Wichtige Links:**
- GitHub: [Repository-URL]
- Confluence/Notion: [Dokumentations-URL]
- Jira/Linear: [Projekt-Management-URL]
- Figma: [Design-URL] (falls vorhanden)
- Staging: https://staging.yourplatform.com (nach Sprint 1)
- Production: https://yourplatform.com (nach Sprint 8)

---

## 📝 Lizenz & Vertraulichkeit

**Vertraulich:** Diese Dokumentation ist vertraulich und nur für interne Verwendung bestimmt.

**Copyright:** © 2026 [Firmenname]. Alle Rechte vorbehalten.

---

**Version:** 1.0  
**Letzte Aktualisierung:** 05.02.2026  
**Erstellt von:** [Dein Name]

---

## 🎉 Los geht's!

Ihr habt jetzt einen vollständigen Plan für die Entwicklung eurer Plattform. Die Dokumentation ist detailliert genug, um direkt loszulegen, aber flexibel genug, um Anpassungen basierend auf Feedback und neuen Erkenntnissen vorzunehmen.

**Viel Erfolg beim Aufbau eurer nachhaltigen Textil-Plattform! 🌱👕💚**

---

## 📌 Anhang: Dokument-Änderungshistorie

| Version | Datum | Änderungen | Autor |
|---------|-------|------------|-------|
| 1.0 | 05.02.2026 | Initial release - Alle 5 Dokumente erstellt | [Name] |

Weitere Versionen werden hier dokumentiert, wenn Dokumente aktualisiert werden.
