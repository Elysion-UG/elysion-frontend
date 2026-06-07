# Contributing to Elysion

> Frontend-Repo für den Elysion Marketplace (Next.js 16, React 18, TypeScript).
> Backend-Repo: `../marketplace-backend/`

---

## Voraussetzungen

- **Bun** (primärer Package Manager — `npm install -g bun` oder [bun.sh](https://bun.sh))
- **Node.js 22** (LTS, als Fallback für Tools die Bun nicht unterstützen)
- Zugang zum Backend-Repo (`../marketplace-backend/`) für lokale Entwicklung

---

## Lokales Setup

```bash
# 1. Repo klonen
git clone <repo-url>
cd v0-sustainable-online-shop

# 2. Dependencies installieren
bun install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env.local
# NEXT_PUBLIC_API_URL leer lassen (empfohlen) → same-origin relative Pfade
# Nur setzen für direkten Backend-Zugriff ohne Next.js Proxy:
#   NEXT_PUBLIC_API_URL=http://localhost:8080   (lokales Backend)
#   NEXT_PUBLIC_API_URL=https://marketplace-backend-1-1w30.onrender.com  (Render)

# 4. Dev-Server starten
bun run dev
# → http://localhost:3000
```

---

## Branch-Strategie

```
main        — Production-Stand (geschützt)
develop     — Integrationsbranch (geschützt)
feature/*   — Neue Features
fix/*       — Bug-Fixes
chore/*     — Tooling, Dependencies, Konfiguration
```

**Neue Arbeit immer von `develop` abzweigen:**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/dein-feature-name
```

**Mergen:** Nur über Pull Request — direkte Pushes auf `main` und `develop` sind gesperrt.

---

## Commit-Konventionen

Wir verwenden [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <beschreibung>
```

| Typ        | Wann                                     |
| ---------- | ---------------------------------------- |
| `feat`     | Neues Feature                            |
| `fix`      | Bug-Fix                                  |
| `refactor` | Code-Umstrukturierung (kein Feature/Fix) |
| `docs`     | Nur Dokumentation                        |
| `test`     | Tests hinzufügen oder anpassen           |
| `chore`    | Build, Dependencies, Konfiguration       |
| `perf`     | Performance-Verbesserung                 |

```bash
# Beispiele
git commit -m "feat: add order cancellation button"
git commit -m "fix: correct total price in cart summary"
git commit -m "refactor: extract address validation to lib/validation"
git commit -m "test: add unit tests for AuthService"
```

**Vor jedem Commit prüft Husky automatisch:**

- ESLint (nur geänderte Dateien via lint-staged)
- Prettier Formatierung

---

## Pull Request Prozess

1. Branch von `develop` abzweigen
2. Änderungen committen (Conventional Commits)
3. PR gegen `develop` öffnen
4. CI muss grün sein (Quality + Tests + Build)
5. Code-Review abwarten
6. Nach Approval: Merge via Squash & Merge

**PR-Titel:** Folgt ebenfalls Conventional Commits (`feat: ...`, `fix: ...`)

**PR-Beschreibung sollte enthalten:**

- Was wurde geändert und warum
- Wie kann man es testen
- Screenshots bei UI-Änderungen

---

## Verfügbare Scripts

| Command                    | Beschreibung                            |
| -------------------------- | --------------------------------------- |
| `bun run dev`              | Dev-Server (localhost:3000)             |
| `bun run build`            | Production-Build                        |
| `bun run lint`             | ESLint                                  |
| `bun run format`           | Prettier (auto-fix)                     |
| `bun run format:check`     | Prettier (nur prüfen)                   |
| `bun run typecheck`        | TypeScript type check                   |
| `bun run test`             | Unit-Tests (einmalig)                   |
| `bun run test:watch`       | Unit-Tests (watch mode)                 |
| `bun run test:coverage`    | Unit-Tests + Coverage-Report            |
| `bun run test:integration` | Integrations-Tests (vitest.integration) |

---

## Code-Standards

Siehe [`docs/CODE_STANDARDS.md`](./docs/CODE_STANDARDS.md) für:

- Namenskonventionen
- Komponenten- und Service-Patterns
- API-Client-Nutzung
- Fehlerbehandlung
- Testing-Anforderungen

---

## CI Pipeline

Jeder Push und PR läuft automatisch durch die CI-Pipeline.
Details: [`docs/CICD_PIPELINE.md`](./docs/CICD_PIPELINE.md)

**Pflichtchecks vor Merge:**

- Lint + Format + Typecheck
- Unit-Tests (Vitest)
- Build (Next.js)

---

## Architektur-Überblick

Kurze Orientierung — vollständige Dokumentation in der [`README.md`](./README.md):

- **`src/lib/api-client.ts`** — Zentraler HTTP-Client, alle Backend-Requests laufen hier durch
- **`src/services/`** — Ein Service-File pro Domäne (z.B. `auth.service.ts`, `product.service.ts`)
- **`src/context/`** — React Contexts für globalen State (Auth, Cart)
- **`src/components/features/`** — Feature-Komponenten, nach Domäne gruppiert
- **`src/types/index.ts`** — Alle TypeScript-Typen und DTOs

**Neuen Service anlegen:** See [`docs/api-integration.md`](./docs/api-integration.md) for the complete API client service pattern and usage examples.
