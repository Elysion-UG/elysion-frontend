# CI/CD-Pipeline

Fünf Workflows in `.github/workflows/`. Package-Manager ist überall **Bun**.

| Workflow        | Datei             | Auslöser                                                                                           |
| --------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| **CI**          | `ci.yml`          | Push auf `main`, `stage`, `dev`, `feature/**`, `fix/**`, `chore/**`; PR auf `main`, `stage`, `dev` |
| **PR Check**    | `pr-check.yml`    | PR auf `main`, `stage`, `dev` (opened / synchronize / reopened)                                    |
| **Stage Smoke** | `stage-smoke.yml` | Push auf `stage`, täglich 6:00 UTC, manuell                                                        |
| **E2E Tests**   | `e2e.yml`         | nur manuell (`workflow_dispatch`)                                                                  |
| **Claude Code** | `claude.yml`      | `@claude`-Erwähnung in Issue/PR/Review                                                             |

---

## CI (`ci.yml`)

```
quality ──┐
          ├──► build
test    ──┘
```

| Job            | Schritte                                                                     |
| -------------- | ---------------------------------------------------------------------------- |
| **Quality**    | `bun run lint` · `bun run format:check` · `bun run typecheck`                |
| **Unit Tests** | `bun run test:coverage` → Artefakt `coverage/`, 14 Tage                      |
| **Build**      | `bun run build` → Artefakt `.next/`, 3 Tage. Läuft erst nach Quality + Tests |

## PR Check (`pr-check.yml`)

Läuft zusätzlich auf jedem PR und ergänzt CI um einen Dependency-Audit. Quality,
Unit Tests und Build sind mit `ci.yml` inhaltlich deckungsgleich; unterschiedlich
sind nur die Artefakt-Namen (pro PR-Nummer) und die Retention (7 Tage).

| Job                | Schritte                                                             |
| ------------------ | -------------------------------------------------------------------- |
| **Security Audit** | `bun install --frozen-lockfile` · `bun audit --audit-level=moderate` |
| **Quality**        | lint · format:check · typecheck                                      |
| **Unit Tests**     | `bun run test:coverage`                                              |
| **Build**          | `bun run build`                                                      |

## Stage Smoke (`stage-smoke.yml`)

Basis-Verifikation der Staging-Umgebung (FE#24): Buyer-Shop rendert Produkte
(prüft Hydration), Seller- und Admin-Login erreichen ihre Dashboards, keine
CSP-Verstöße. Führt `playwright test --project=stage-smoke` aus.

Der Job wartet vor dem Test bis zu 15 Minuten auf das Backend — Render braucht nach
einem Push ~10 min für den Docker-Build, dazu kommt der Free-Tier-Kaltstart. Nach
einem Push auf `stage` puffert er zusätzlich 120 s, bis Vercel den neuen Stand an
die branch-gebundenen Domains gehängt hat.

## E2E (`e2e.yml`)

Playwright gegen eine wählbare `base_url` (Standard: Staging; ohne Angabe wird die
App lokal gebaut und gestartet).

**Nur manuell.** Der tägliche Cron ist stillgelegt: Der Workflow war in 40 Läufen
nie grün und hat jeden Morgen eine Fehler-Mail erzeugt. Er kommt erst zurück, wenn
der Lauf tatsächlich grün ist — Ursachen und die offene Designfrage (wogegen soll
die Suite laufen?) in #144.

## Claude Code (`claude.yml`)

Reagiert auf `@claude` in Issues, PRs und Reviews — aber nur, wenn der Auslöser
`OWNER`, `MEMBER` oder `COLLABORATOR` ist. Das Repo ist öffentlich; ohne diese
Einschränkung könnte jeder den Job mit Schreibrechten starten.

---

## Vor dem Merge

Ein PR nach `dev`, `stage` oder `main` braucht: Lint, Format-Check, Typecheck,
Unit-Tests und Build grün. Merge-Regeln und Promotion-Prozess:
[`CONTRIBUTING.md`](../CONTRIBUTING.md) §4/§5.

E2E-Tests sind **kein** Pflicht-Gate — sie laufen manuell bzw. als Stage-Smoke nach
dem Merge.

## Pre-commit (lokal)

Husky (`.husky/pre-commit`) startet lint-staged (`.lintstagedrc`):

| Dateityp                  | Aktion                              |
| ------------------------- | ----------------------------------- |
| `*.ts`, `*.tsx`           | `eslint --fix` + `prettier --write` |
| `*.json`, `*.css`, `*.md` | `prettier --write`                  |

Typecheck und Tests laufen **nicht** im Hook. Sie vor dem Push lokal auszuführen,
erspart rote CI-Läufe: `bun run typecheck && bun run lint && bun run test`.

---

## Deployment

Vercel deployt **automatisch**, branch-gebunden — es gibt keinen Deploy-Schritt in
den Workflows:

- Push auf `stage` → Staging-Domains
- Push auf `main` → Produktion

Domains und Backend-URLs: [`INDEX.md`](./INDEX.md#umgebungen). Das Backend
(Render) hängt ebenfalls am Branch. Änderungen erreichen Staging also erst über
einen `dev → stage`-Merge, Produktion erst über `stage → main`.
