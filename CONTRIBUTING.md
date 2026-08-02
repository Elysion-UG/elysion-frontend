# Contributing — Elysion

> **Synchron halten:** Die Policy-Abschnitte **1–6** existieren **identisch** in
> `elysion-frontend` und `elysion-marketplace-backend` — Änderungen daran immer in beiden
> Repos im selben Zug. Abschnitt 7 ist repo-spezifisch.

Verbindliche Regeln für Issues, Branches, Commits, Pull Requests und Releases.
Ergänzend gilt die `CLAUDE.md` des jeweiligen Repos (API-Konventionen, Doku-Sync, Domain-Regeln).
Sprache für Issues, PRs und Projektdokumente: **Deutsch**.

---

## 1. Branch-Modell

```
feature/* ──PR──▶ dev ──PR──▶ stage ──PR──▶ main
```

| Branch               | Bedeutung                        | Regeln                                                                               |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| `main`               | **Produktion**                   | Nur via Promotions-PR von `stage` (oder Hotfix-PR). Niemals direkt pushen.           |
| `stage`              | **Staging / Abnahme**            | Nur via Promotions-PR von `dev`.                                                     |
| `dev`                | **Integration** (Default-Branch) | Ziel aller Feature-PRs. Direkte Commits nur für Trivialitäten (s. 2.1).              |
| `feature/*`, `fix/*` | Arbeitsbranches                  | Von `dev` abzweigen, per PR zurück. Nach Merge wird der Branch automatisch gelöscht. |
| `hotfix/*`           | Notfall-Fix                      | Von `main` abzweigen; PR nach `main`, danach nach `stage` und `dev` zurückmergen.    |

---

## 2. Issues

### 2.1 Wann ein Issue?

**Jede nicht-triviale Arbeit beginnt mit einem Issue** — Features, Bugs, Refactorings,
Ops-/Konfigurationsaufgaben. **Ausnahmen** (kein Issue nötig): Typos, reine Formatierung,
kleine Doc-Korrekturen.

### 2.2 Struktur

Issues über die **Issue-Forms** anlegen (Bug / Feature / Ops). Aufbau immer:

| Abschnitt     | Inhalt                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| `## Kontext`  | Warum? Hintergrund, betroffene Stellen, Verweise auf Doku/Entscheidungen |
| `## Aufgaben` | Abhakbare Checkboxen (`- [ ]`) — konkret und einzeln verifizierbar       |
| `## Referenz` | Spezifikationen, Doku-Abschnitte, verwandte Issues                       |

**Titel:** prägnant, ohne Punkt am Ende. Präfix in eckigen Klammern, wenn es Ordnung schafft —
Launch-Bezug (`[B2]`, `[W5]`), Modul (`[Auth]`, `[Payments]`).

### 2.3 Labels

Pro Issue: **genau ein Typ-Label**, Status- und Bereichs-Labels nach Bedarf.

| Kategorie | Labels                                                                              |
| --------- | ----------------------------------------------------------------------------------- |
| Typ       | `bug` · `enhancement` · `documentation` · `testing`                                 |
| Priorität | `launch-blocker` (🔴 muss vor Go-Live)                                              |
| Status    | `in-progress` · `back-to-dev` (aus Review zurück) · `blocked` (Grund im Kommentar!) |
| Bereich   | `ops` (Betrieb/Deployment) · `config` (Umgebung) · `a11y` (Barrierefreiheit)        |

### 2.4 Lifecycle

```
open ──▶ in-progress ──▶ geschlossen durch PR-Merge (Closes #nr)
              ▲                    │
              └── back-to-dev ◀────┘  (Review/Abnahme nicht bestanden)
```

- Issues werden **durch den PR geschlossen** (`Closes #nr` im PR-Body) — nicht manuell.
  Manuelles Schließen nur mit Begründungs-Kommentar (z. B. obsolet, Duplikat).
- `blocked` immer mit Kommentar, **woran** es hängt (Issue, Entscheidung, externer Dienst).

### 2.5 Repo-übergreifende Verweise

Immer voll qualifiziert: `Elysion-UG/elysion-frontend#10` bzw.
`Elysion-UG/elysion-marketplace-backend#117`. FE/BE-Gegenstücke verlinken sich **gegenseitig**.

---

## 3. Branches & Commits

- **Branch-Name:** `feature/<issue-nr>-<kurzer-slug>` (z. B. `feature/120-contact-endpoint`),
  Bugfix: `fix/<issue-nr>-<slug>`, Hotfix: `hotfix/<issue-nr>-<slug>`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) —
  `<type>(<scope>): <beschreibung>` mit `feat | fix | refactor | docs | test | chore | perf | ci`.
- Issue-Bezug im Commit, wo er nicht schon aus dem PR hervorgeht: `(refs #nr)`.

---

## 4. Pull Requests

### 4.1 Anlegen

- Ziel ist **immer `dev`** (außer Promotions- und Hotfix-PRs).
- **Titel im Conventional-Commit-Stil** — er wird beim Squash der Commit-Titel auf `dev`.
- Body nach PR-Template: Was/Warum, `Closes #<nr>`, Test-Nachweis, Doku-Sync-Bestätigung.

### 4.2 Merge-Regeln

| PR                  | Methode          | Bedingungen                                   |
| ------------------- | ---------------- | --------------------------------------------- |
| `feature/*` → `dev` | **Squash**       | CI grün, Issue-Aufgaben abgehakt              |
| `dev` → `stage`     | **Merge-Commit** | CI grün, manueller Smoke-Test auf `dev`-Stand |
| `stage` → `main`    | **Merge-Commit** | Abnahme auf `stage` erfolgt                   |
| `hotfix/*` → `main` | **Squash**       | danach nach `stage` und `dev` zurückmergen    |

- **Selbst-Merge ist erlaubt** (0 Pflicht-Approvals) — bei riskanten Änderungen
  (Auth, Payments, Migrationen) aktiv ein Review einholen.
- Gemergte Branches werden automatisch gelöscht (Repo-Setting); lokale Reste selbst aufräumen.
- Rebase-Merge ist deaktiviert.

### 4.3 Definition of Done

- [ ] CI grün (Lint, Typecheck/Build, Tests)
- [ ] Neue Logik ist getestet; die Coverage-Schwellen des Repos werden gehalten
- [ ] **Doku-Sync:** API-Vertrag geändert ⇒ Backend `docs/api/` **und** Frontend
      `docs/api-integration.md` im selben Arbeitsgang aktualisiert
- [ ] Keine Secrets, keine hardcodierten Werte
- [ ] Issue-Checkboxen abgehakt, Issue wird durch den Merge geschlossen

---

## 5. Releases (Promotion)

1. `dev → stage`, wenn ein Stand abnahmebereit ist — Promotions-PR **ohne neue Commits**.
2. Abnahme/Smoke-Test auf `stage`.
3. `stage → main` = **Release**. Danach Prod-Smoke-Test
   (Backend: `docs/backend/go-live-checklist.md`).

Hotfixes: von `main` abzweigen, nach Merge in `main` sofort nach `stage` und `dev` zurückmergen,
damit kein Drift entsteht.

---

## 6. Dokumentationspflichten

| Änderung                         | Zu aktualisieren                                                     |
| -------------------------------- | -------------------------------------------------------------------- |
| API-Vertrag (Pfade, DTOs, Enums) | BE `docs/api/` + FE `docs/api-integration.md` — im selben PR-Paar    |
| Architektur-/Domain-Entscheidung | `CLAUDE.md` bzw. `docs/architecture/` · FE `MANAGEMENT_DECISIONS.md` |
| Betrieb/Deployment               | BE `docs/backend/operations-runbook.md` / `deployment.md`            |
| Diese Policy (Abschnitte 1–6)    | **Beide** `CONTRIBUTING.md` synchron ändern                          |

---

## 7. Repo-spezifisch: Frontend-Setup

> Dieser Abschnitt gilt nur für `elysion-frontend`.

### Voraussetzungen

- **Bun** (primärer Package Manager — `npm install -g bun` oder [bun.sh](https://bun.sh))
- **Node.js 22** (LTS, als Fallback für Tools, die Bun nicht unterstützen)
- Zugang zum Backend-Repo (`../elysion-marketplace-backend/`) für lokale Entwicklung

### Lokales Setup

```bash
bun install
cp .env.example .env.local
# NEXT_PUBLIC_API_URL leer lassen (empfohlen) → same-origin relative Pfade
# Nur setzen für direkten Backend-Zugriff ohne Next.js Proxy:
#   NEXT_PUBLIC_API_URL=http://localhost:8080
bun run dev   # → http://localhost:3000
```

### Scripts

| Command                                         | Beschreibung                 |
| ----------------------------------------------- | ---------------------------- |
| `bun run dev`                                   | Dev-Server (localhost:3000)  |
| `bun run build` / `bun run start`               | Production-Build / -Server   |
| `bun run lint` / `bun run format`               | ESLint / Prettier (auto-fix) |
| `bun run format:check`                          | Prettier-Check (wie in CI)   |
| `bun run typecheck`                             | TypeScript type check        |
| `bun run test` / `test:watch` / `test:coverage` | Unit-Tests (Vitest)          |
| `bun run test:integration`                      | Integrations-Tests           |
| `bun run test:e2e` / `test:e2e:ui`              | E2E-Tests (Playwright)       |

**Vor jedem Commit prüft Husky automatisch:** ESLint + Prettier (lint-staged).
Typecheck und Tests laufen nicht im Hook — vor dem Push lokal ausführen:
`bun run typecheck && bun run lint && bun run test`.

### Weiterführend

Alle Dokumente: [`docs/INDEX.md`](./docs/INDEX.md).
