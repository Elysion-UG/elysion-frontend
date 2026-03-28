# CI/CD Pipeline

## Overview

Every push and every pull request runs through the GitHub Actions CI pipeline. There is currently no automated deployment — deployment is triggered manually (see [Deployment](#deployment)).

---

## Workflows

Two workflows are defined in `.github/workflows/`:

| Workflow     | File           | Trigger                                                                                  |
| ------------ | -------------- | ---------------------------------------------------------------------------------------- |
| **CI**       | `ci.yml`       | Push to `main`, `develop`, `feature/**`, `fix/**`, `chore/**`; PR to `main` or `develop` |
| **PR Check** | `pr-check.yml` | PR opened / updated / reopened targeting `main` or `develop`                             |

---

## CI Workflow (`ci.yml`)

Runs on every push and PR. Three sequential jobs:

```
quality ──┐
           ├──► build
test    ──┘
```

### Job 1: Quality

| Step         | Command                |
| ------------ | ---------------------- |
| Lint         | `npm run lint`         |
| Format check | `npm run format:check` |
| Type check   | `npm run typecheck`    |

### Job 2: Unit Tests

| Step                 | Command                          |
| -------------------- | -------------------------------- |
| Run tests + coverage | `npm run test:coverage`          |
| Upload artifact      | `coverage/` retained for 14 days |

### Job 3: Build

Runs only after Quality and Unit Tests pass.

| Step            | Command                      |
| --------------- | ---------------------------- |
| Build           | `npm run build`              |
| Upload artifact | `.next/` retained for 3 days |

Build uses `NEXT_PUBLIC_API_URL=https://marketplace-backend-1-1w30.onrender.com`.

---

## PR Check Workflow (`pr-check.yml`)

Runs additionally on every PR targeting `main` or `develop`. Adds a security audit job:

| Job            | Steps                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Security Audit | `npm audit --audit-level=moderate`                                        |
| Quality        | lint + format check + typecheck (`continue-on-error: true` for typecheck) |
| Unit Tests     | `npm run test:coverage` (artifact retained 7 days, named per PR number)   |
| Build          | `npm run build`                                                           |

---

## Required Checks Before Merge

A PR cannot be merged into `develop` or `main` unless all these checks pass:

- Lint (ESLint)
- Format check (Prettier)
- Unit tests (Vitest)
- Build (Next.js)

---

## Pre-commit Hooks (Local)

Before a commit lands in the pipeline, Husky runs lint-staged locally:

| File type                 | Check             |
| ------------------------- | ----------------- |
| `*.ts`, `*.tsx`           | ESLint + Prettier |
| `*.json`, `*.css`, `*.md` | Prettier          |

Hook file: `.husky/pre-commit`
Config: `.lintstagedrc`

---

## Deployment

There is currently no automated deployment step in CI. Deployment is done manually.

**Frontend build:** `npm run build` → `.next/` output directory
**Backend:** hosted on Render at `https://marketplace-backend-1-1w30.onrender.com`
**Frontend hosting:** TBD — configure `NEXT_PUBLIC_API_URL` in hosting environment before deployment.
