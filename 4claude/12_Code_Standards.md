# Code-Standards & Best Practices
## Nachhaltigkeits-Zertifikat-Plattform

**Zweck:** Einheitlicher Code-Stil und Best Practices für das gesamte Team

---

## 1. Allgemeine Prinzipien

### 1.1 Clean Code
- Verständliche Variablen- und Funktionsnamen — kein Kommentar nötig
- Keine Magic Numbers/Strings → Konstanten verwenden
- Funktionen tun genau eine Sache
- Keine auskommentierten Code-Blöcke im Repository
- Kein Debug-Output im produktiven Code

### 1.2 Naming-Konventionen

| Was | Stil | Beispiel |
|-----|------|---------|
| Variablen & Funktionen | camelCase | `getUserById`, `totalPrice` |
| Klassen & Interfaces | PascalCase | `ProductService`, `UserProfile` |
| Konstanten | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_BASE_URL` |
| Datenbank-Tabellen | snake_case | `order_items`, `user_profiles` |
| Dateinamen (Backend) | kebab-case | `auth.service.ts`, `cart.routes.ts` |
| Dateinamen (Frontend) | PascalCase | `ProductCard.tsx`, `CartContext.tsx` |
| Enum-Werte | UPPER_SNAKE_CASE | `ORDER_STATUS.PENDING` |

### 1.3 Kein Code ohne Tests
- Business-Logik → Unit-Tests
- API-Endpunkte → Integration-Tests
- Kritische Flows (Checkout, Payment) → E2E-Tests
- Mindest-Coverage: 60 %

---

## 2. Projektstruktur

### Backend

```
src/
├── modules/              # Feature-Module (ein Ordner pro Modul)
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.middleware.ts
│   │   ├── dto/
│   │   └── __tests__/
│   └── products/
│       └── ... (gleiche Struktur)
├── shared/               # Geteilter Code
│   ├── errors/
│   ├── middleware/
│   └── utils/
├── config/               # Konfiguration & Umgebungsvariablen
├── jobs/                 # Cron-Jobs
├── app.ts
└── index.ts
```

### Frontend

```
src/
├── app/                  # Routing (Next.js App Router)
├── components/           # UI-Komponenten
│   ├── ui/               # Basiskomponenten (Button, Input, Modal)
│   ├── auth/
│   ├── products/
│   └── layout/
├── hooks/                # Custom Hooks
├── contexts/             # State-Management
├── lib/
│   └── api/              # API-Client-Funktionen
└── types/                # Globale Typen
```

---

## 3. Architektur-Patterns

### 3.1 Schichtenarchitektur (Backend)

```
HTTP-Request
    ↓
Controller       — HTTP-Handler, keine Business-Logik
    ↓
Service          — Business-Logik
    ↓
Repository       — Datenbankzugriff
    ↓
Datenbank
```

**Regel:** Keine direkte Datenbankabfrage im Controller. Keine HTTP-spezifischen Konzepte im Service.

### 3.2 Fehlerbehandlung

- Spezifische Fehler-Klassen verwenden (z.B. `NotFoundError`, `ValidationError`)
- Fehler werden **geworfen**, nicht als Return-Wert
- Zentraler Error-Handler fängt alle Fehler ab
- Niemals rohe Datenbankfehler an den Client durchleiten

```
// ✅ RICHTIG
if (!user) throw new NotFoundError('Nutzer nicht gefunden');

// ❌ FALSCH
if (!user) return { error: 'not found' };
```

### 3.3 Input-Validierung

- **Immer serverseitig** — Frontend-Validierung ist nur UX, kein Schutz
- Validierung so früh wie möglich (Controller-Ebene)
- Strukturierte Fehlermeldungen mit Feldangabe

---

## 4. API-Design

### 4.1 REST-Konventionen

| Operation | Methode | Beispiel |
|-----------|---------|---------|
| Liste abrufen | GET | `GET /products` |
| Einzeln abrufen | GET | `GET /products/:id` |
| Erstellen | POST | `POST /products` |
| Aktualisieren (partial) | PATCH | `PATCH /products/:id` |
| Löschen | DELETE | `DELETE /products/:id` |

### 4.2 Response-Format

**Erfolg:**
```json
{
  "status": "success",
  "data": { ... }
}
```

**Fehler:**
```json
{
  "status": "error",
  "message": "Produkt nicht gefunden"
}
```

**Validierungsfehler:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Ungültige E-Mail-Adresse" }
  ]
}
```

### 4.3 Versionierung

- API-Präfix: `/api/v1/`
- Breaking Changes → neue Version `/api/v2/`

---

## 5. Sicherheits-Richtlinien

### 5.1 Authentifizierung & Autorisierung
- Jeder geschützte Endpoint überprüft das JWT
- Rollen-Check **vor** dem Datenbankzugriff
- Nie sensible Daten im Token speichern

### 5.2 Datenzugriff
- Nutzer dürfen nur **eigene Daten** lesen/schreiben
- Verkäufer dürfen nur **eigene Produkte** bearbeiten
- Admin-Endpunkte sind durch eine separate Middleware geschützt

### 5.3 Sensible Daten
- Passwörter werden nie zurückgegeben
- IBAN/Zahlungsdaten: nur maskiert anzeigen
- Keine Secrets/Credentials im Code oder Git

### 5.4 Allgemein
- Input immer validieren und sanitisieren
- Parameterized Queries (kein String-Concatenation bei DB-Abfragen)
- Datei-Uploads: Typ und Größe prüfen

---

## 6. Testing-Standards

### 6.1 Test-Aufbau (AAA-Pattern)

```
// Arrange  — Vorbedingungen setzen
// Act      — Aktion ausführen
// Assert   — Ergebnis prüfen
```

### 6.2 Test-Naming

```
"should [erwartetes Verhalten] when [Bedingung]"

Beispiele:
  "should return 404 when product does not exist"
  "should activate products when certificate is verified"
  "should throw error when email already exists"
```

### 6.3 Was zu testen ist

| Ebene | Was | Wann |
|-------|-----|------|
| Unit | Service-Methoden, Algorithmen | Immer |
| Integration | API-Endpunkte mit echter DB | Immer |
| E2E | Checkout, Zahlung, Registrierung | Kritische Flows |

### 6.4 Mocking

- Externe Services (E-Mail, Payment, Storage) immer mocken
- Datenbank in Unit-Tests mocken, in Integration-Tests echte Test-DB verwenden
- Keine echten API-Keys in Tests

---

## 7. Git & Code-Review

### 7.1 Commit-Konventionen (Conventional Commits)

```
<type>(<scope>): <beschreibung>

Typen:
  feat     — neues Feature
  fix      — Bug-Fix
  docs     — Dokumentation
  refactor — Code-Umstrukturierung (kein Feature, kein Fix)
  test     — Tests
  chore    — Build, Dependencies

Beispiele:
  feat(auth): implement password reset
  fix(cart): correct total price calculation
  test(products): add unit tests for product service
```

### 7.2 Vor jedem Commit prüfen
- [ ] Code funktioniert lokal
- [ ] Tests grün
- [ ] Kein Debug-Output
- [ ] Keine Secrets committed
- [ ] Commit-Message folgt Konvention

### 7.3 Code-Review-Checkliste

**Allgemein**
- [ ] Logik ist klar und nachvollziehbar
- [ ] Keine unnötige Komplexität
- [ ] Fehlerbehandlung vorhanden

**Sicherheit**
- [ ] Input-Validierung vorhanden
- [ ] Keine sensiblen Daten exponiert
- [ ] Autorisierung korrekt

**Performance**
- [ ] Keine N+1-Queries
- [ ] Nur benötigte Felder aus DB geladen

**Tests**
- [ ] Business-Logik getestet
- [ ] Edge-Cases berücksichtigt

---

## 8. Dokumentations-Standards

### 8.1 Wann JSDoc schreiben
- Öffentliche Service-Methoden
- Komplexe Algorithmen
- Nicht-offensichtliche Business-Logik

### 8.2 README in jedem Modul

Jedes Modul enthält eine kurze `README.md` mit:
- Verantwortlichkeiten
- API-Endpunkte
- Abhängigkeiten zu anderen Modulen
- Benötigte Umgebungsvariablen

---

**Grundsatz:** Code wird öfter gelesen als geschrieben — schreib für den nächsten Entwickler, nicht für den Compiler.
