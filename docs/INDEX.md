# Doku-Index

Welches Thema steht wo? Diese Datei ist die einzige Übersicht — wer eine Doku
ergänzt, trägt sie hier ein.

## Dokumente

| Datei                                                   | Inhalt                                                                |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| [`README.md`](../README.md)                             | Projekt-Überblick, Tech-Stack, Setup                                  |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md)                 | Issues, Branches, Commits, PRs, Releases, Scripts                     |
| [`MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md) | Geschäfts- und Architekturentscheidungen, offene Fragen               |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                  | Frontend-Architektur: Schichten, Datenfluss, Auth, Fehlerbehandlung   |
| [`api-integration.md`](./api-integration.md)            | HTTP-Vertrag zum Backend: Client, alle Endpoints, Fehlerbehandlung    |
| [`BACKEND_QUIRKS.md`](./BACKEND_QUIRKS.md)              | Abweichungen der Backend-Responses von den Frontend-Erwartungen       |
| [`CODE_STANDARDS.md`](./CODE_STANDARDS.md)              | Namenskonventionen, Patterns, Barrierefreiheit, Testabdeckung         |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)                | Umsetzung des Elysion Design System v1.3, bewusste Abweichungen       |
| [`CICD_PIPELINE.md`](./CICD_PIPELINE.md)                | GitHub-Actions-Workflows, Quality Gates, Pre-commit-Hooks, Deployment |
| [`LAUNCH_READINESS.md`](./LAUNCH_READINESS.md)          | Konsolidierter Launch-Stand FE+BE, Blocker mit Begründung             |
| [`COMPLIANCE.md`](./COMPLIANCE.md)                      | DE/EU-Recht: DSGVO, Impressum, AGB, BFSG, UWG                         |
| [`PRE_MORTEM.md`](./PRE_MORTEM.md)                      | Risikoanalyse: Ausfallszenarien, Gegenmittel, Ops-Readiness-Lücken    |
| [`ROADMAP.md`](./ROADMAP.md)                            | Phasen-Planung                                                        |
| [`monitoring-api.md`](./monitoring-api.md)              | Spec: Backend-Persistenz für Frontend-Fehler (Backend offen)          |

## Thema → Quelle

| Thema                               | Quelle                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Was ist noch offen?                 | **GitHub-Issues** (Label `launch-blocker` = 🔴); Hintergrund in [`LAUNCH_READINESS.md`](./LAUNCH_READINESS.md) |
| Umgebungsvariablen                  | [`.env.example`](../.env.example)                                                                              |
| Backend-URLs, Portal-Domains        | Umgebungen (unten)                                                                                             |
| API-Endpoints, Client-Verhalten     | [`api-integration.md`](./api-integration.md)                                                                   |
| Bekannte Backend-Abweichungen       | [`BACKEND_QUIRKS.md`](./BACKEND_QUIRKS.md)                                                                     |
| Projektstruktur, Schichten          | [`ARCHITECTURE.md`](./ARCHITECTURE.md)                                                                         |
| Namenskonventionen, Testabdeckung   | [`CODE_STANDARDS.md`](./CODE_STANDARDS.md)                                                                     |
| Farben, Schriften, Tokens           | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)                                                                       |
| Branch-Modell, PR-Prozess           | [`CONTRIBUTING.md`](../CONTRIBUTING.md)                                                                        |
| CI-Workflows, Deployment            | [`CICD_PIPELINE.md`](./CICD_PIPELINE.md)                                                                       |
| Rechtliche Pflichten                | [`COMPLIANCE.md`](./COMPLIANCE.md)                                                                             |
| Provision, Payouts, Geschäftsregeln | [`MANAGEMENT_DECISIONS.md`](../MANAGEMENT_DECISIONS.md)                                                        |
| TypeScript-Typen                    | [`src/types/`](../src/types/) (Domain-Dateien, Barrel `index.ts`)                                              |

## Umgebungen

Feature → `dev` → `stage` → `main`. `dev` ist **nicht** Staging — die Staging-Domains
hängen am Branch `stage`. Details: [`CICD_PIPELINE.md`](./CICD_PIPELINE.md).

| Umgebung       | Branch  | Frontend                                                                                          | Backend                                       |
| -------------- | ------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Staging**    | `stage` | `elysion-stage.vercel.app` · `elysion-stage-seller.vercel.app` · `elysion-stage-admin.vercel.app` | `elysion-backend-stage.onrender.com`          |
| **Produktion** | `main`  | `v0-sustainable-online-shop.vercel.app`                                                           | — derzeit außer Betrieb, Neuaufbau vor Launch |

Staging läuft auf Render Free-Tier → Kaltstart ~60–90 s. Test-Logins:
Seed-Credentials im Backend-Repo (`docs/seed-data-credentials.md`).
