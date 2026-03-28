> **ARCHIVIERT** — Dieses Dokument stammt aus der Planungsphase (Februar 2026) und beschreibt einen IONOS VPS + rsync-Deploy, der nie implementiert wurde. Tatsächliches Deployment: Render.com. Aktuelle Dokumentation: [README.md](../../README.md)

# CI/CD Pipeline Strategie

## Automated Deployment: Development → Test → Stage → Production

**Datum:** 09.02.2026  
**Zweck:** Vollautomatische Deployment-Pipeline mit Quality Gates

---

## 1. Pipeline-Übersicht

### 1.1 Gesamtablauf

```mermaid
graph LR
    A[Developer] -->|git push| B[GitHub]
    B -->|Trigger| C[GitHub Actions]
    C -->|1. Build| D[Build App]
    D -->|2. Test| E[Run Tests]
    E -->|3. Deploy| F[Stage Server]
    F -->|Manual Review| G[Production]

    E -->|Tests Failed| H[Notify Team]
    F -->|Smoke Tests| I[Health Check]
    I -->|Failed| H
```

### 1.2 Stages & Triggers

| Stage           | Trigger             | Tests              | Deploy | Approval  |
| --------------- | ------------------- | ------------------ | ------ | --------- |
| **Development** | Jeder Commit        | Lokal (optional)   | Lokal  | —         |
| **Test**        | Push zu `feature/*` | Unit + Integration | —      | —         |
| **Stage**       | Push zu `develop`   | Full Test Suite    | Auto   | —         |
| **Production**  | Tag `v*.*.*`        | Full + Smoke       | Auto   | ✅ Manual |

---

## 2. Branch-Strategie (Git Flow)

### 2.1 Branch-Struktur

```
main (production)
  ├── develop (staging)
  │   ├── feature/auth-module
  │   ├── feature/product-crud
  │   └── bugfix/login-validation
  └── hotfix/critical-security-patch
```

### 2.2 Regeln

| Branch      | Schutz    | Merge via                 | Deploy to  |
| ----------- | --------- | ------------------------- | ---------- |
| `main`      | Protected | Pull Request (1 Approval) | Production |
| `develop`   | Protected | Pull Request              | Stage      |
| `feature/*` | —         | Pull Request to develop   | —          |
| `hotfix/*`  | —         | Direct to main + develop  | Production |

**Branch Protection (GitHub Settings):**

```
Repository → Settings → Branches → Add Rule:

Branch: main
☑ Require pull request reviews (1 approval)
☑ Require status checks to pass
  - build
  - test
  - lint
☑ Require branches to be up to date
☑ Include administrators
```

---

## 3. Pipeline-Stages im Detail

### 3.1 Stage 1: Build & Lint

**Was passiert:**

- Code auschecken
- Dependencies installieren
- Code kompilieren/bauen
- Linting & Code-Style-Check

**GitHub Actions Workflow:**

```yaml
name: Build & Lint

on:
  push:
    branches: ["**"]
  pull_request:
    branches: [develop, main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Environment
        run: |
          # Entwickler-spezifisch (Node.js Beispiel)
          # node --version
          # npm install
          echo "Setup completed"

      - name: Lint Code
        run: |
          # Entwickler wählt Linter
          # npm run lint
          echo "Linting completed"

      - name: Build
        run: |
          # Entwickler-spezifisch
          # npm run build
          echo "Build completed"
```

**Erfolg = ✅ Weiter zu Tests**  
**Fehler = ❌ Pipeline stoppt, Developer wird benachrichtigt**

---

### 3.2 Stage 2: Tests

**Was passiert:**

- Unit-Tests
- Integration-Tests
- Code-Coverage-Report

**Workflow:**

```yaml
name: Tests

on:
  push:
    branches: ["**"]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: sustainability_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Environment
        run: |
          echo "Setup test environment"

      - name: Run Unit Tests
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/sustainability_test
        run: |
          # Entwickler-spezifisch
          # npm run test:unit
          echo "Unit tests passed"

      - name: Run Integration Tests
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/sustainability_test
        run: |
          # npm run test:integration
          echo "Integration tests passed"

      - name: Coverage Report
        run: |
          # npm run test:coverage
          echo "Coverage: 85%"

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
```

**Quality Gates:**

- ✅ Alle Tests grün
- ✅ Coverage > 60% (konfigurierbar)
- ❌ Ein Test rot = Pipeline stoppt

---

### 3.3 Stage 3: Deploy to Stage

**Trigger:** Push zu `develop` Branch

**Was passiert:**

1. Build Docker Image (optional)
2. Upload zu Server
3. Datenbank-Migration
4. Anwendung neu starten
5. Health-Check

**Workflow:**

```yaml
name: Deploy to Stage

on:
  push:
    branches: [develop]

jobs:
  deploy-stage:
    runs-on: ubuntu-latest
    needs: [build, test] # Nur wenn Build+Test erfolgreich

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.STAGE_SSH_KEY }}

      - name: Deploy to Stage Server
        env:
          STAGE_HOST: ${{ secrets.STAGE_HOST }}
          STAGE_USER: ${{ secrets.STAGE_USER }}
        run: |
          # Code auf Server kopieren
          rsync -avz --delete \
            --exclude 'node_modules' \
            --exclude '.git' \
            ./ $STAGE_USER@$STAGE_HOST:/var/www/sustainability-stage/

      - name: Run Database Migrations
        run: |
          ssh $STAGE_USER@$STAGE_HOST << 'EOF'
            cd /var/www/sustainability-stage
            # Entwickler-spezifisch (z.B. Prisma)
            # npm run migrate:deploy
            echo "Migrations completed"
          EOF

      - name: Restart Application
        run: |
          ssh $STAGE_USER@$STAGE_HOST << 'EOF'
            sudo systemctl restart sustainability-stage
          EOF

      - name: Health Check
        run: |
          sleep 10
          curl --fail https://stage.yourplatform.com/health || exit 1

      - name: Notify Team
        if: success()
        run: |
          # Slack/Discord/E-Mail Benachrichtigung
          echo "✅ Stage deployed successfully"

      - name: Notify on Failure
        if: failure()
        run: |
          echo "❌ Stage deployment failed"
```

**Secrets in GitHub:**

```
Repository → Settings → Secrets → Actions:

STAGE_SSH_KEY       = [Private SSH Key]
STAGE_HOST          = stage-server-ip
STAGE_USER          = deploy
STAGE_DB_URL        = postgresql://...
```

---

### 3.4 Stage 4: Smoke Tests (Stage)

**Was passiert:**

- Automatische Tests gegen deployed Stage
- Kritische User-Journeys prüfen

**Workflow:**

```yaml
name: Smoke Tests (Stage)

on:
  workflow_run:
    workflows: ["Deploy to Stage"]
    types: [completed]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest

    steps:
      - name: Test Health Endpoint
        run: |
          curl --fail https://stage.yourplatform.com/health

      - name: Test API Endpoints
        run: |
          # Login
          TOKEN=$(curl -X POST https://stage.yourplatform.com/api/v1/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"test@example.com","password":"TestPass123!"}' \
            | jq -r '.data.accessToken')

          # Get User Profile
          curl --fail https://stage.yourplatform.com/api/v1/users/me \
            -H "Authorization: Bearer $TOKEN"

      - name: Test Database Connection
        run: |
          # Prüfe ob DB erreichbar
          echo "DB connection OK"
```

---

### 3.5 Stage 5: Deploy to Production

**Trigger:** Git Tag `v1.0.0`, `v1.0.1`, etc.

**Workflow:**

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - "v*.*.*"

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://yourplatform.com

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      # Manual Approval erforderlich (GitHub Environment Protection)

      - name: Create Backup
        run: |
          ssh $PROD_USER@$PROD_HOST << 'EOF'
            # Backup vor Deployment
            pg_dump sustainability_prod > /backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql
          EOF

      - name: Deploy to Production
        env:
          PROD_HOST: ${{ secrets.PROD_HOST }}
          PROD_USER: ${{ secrets.PROD_USER }}
        run: |
          rsync -avz --delete ./ $PROD_USER@$PROD_HOST:/var/www/sustainability-prod/

      - name: Run Migrations
        run: |
          ssh $PROD_USER@$PROD_HOST << 'EOF'
            cd /var/www/sustainability-prod
            npm run migrate:deploy
          EOF

      - name: Restart Application
        run: |
          ssh $PROD_USER@$PROD_HOST "sudo systemctl restart sustainability-prod"

      - name: Health Check
        run: |
          sleep 15
          curl --fail https://yourplatform.com/health

      - name: Rollback on Failure
        if: failure()
        run: |
          ssh $PROD_USER@$PROD_HOST << 'EOF'
            cd /var/www/sustainability-prod
            git reset --hard HEAD~1
            sudo systemctl restart sustainability-prod
          EOF

      - name: Notify Team
        if: always()
        run: |
          # Slack/E-Mail Notification
          echo "Production deployment: ${{ job.status }}"
```

**Manual Approval (GitHub Environment):**

```
Repository → Settings → Environments → New Environment:

Name: production
Protection Rules:
  ☑ Required reviewers (1-6 Personen)
  ☑ Wait timer: 0 minutes (oder z.B. 10 Min Denkzeit)
```

---

## 4. Deployment-Strategien

### 4.1 Rolling Deployment (empfohlen für Start)

```
Server 1: v1.0.0 (läuft)
   ↓
Deploy v1.0.1
   ↓
Server 1: v1.0.1 (neu gestartet)

Downtime: ~10-30 Sekunden
```

**Umsetzung:**

```bash
# Im Deployment-Script
systemctl stop app
# Update Code
# Run Migrations
systemctl start app
```

### 4.2 Blue-Green Deployment (später, kein Downtime)

```
Blue (v1.0.0) ← Traffic
Green (v1.0.1) ← Deploy hier

Health-Check OK?
  ↓
Switch Traffic: Green ← Traffic
Blue = Backup

Downtime: 0 Sekunden
```

### 4.3 Canary Deployment (fortgeschritten)

```
v1.0.0: 90% Traffic
v1.0.1: 10% Traffic (Canary)

Fehler? → Rollback
Alles OK? → 100% zu v1.0.1
```

---

## 5. Monitoring & Rollback

### 5.1 Post-Deployment Monitoring

```yaml
- name: Monitor Error Rate
  run: |
    # 5 Minuten nach Deployment
    sleep 300

    # Error-Rate prüfen (z.B. via Sentry API)
    ERROR_RATE=$(curl https://sentry.io/api/.../stats)

    if [ $ERROR_RATE -gt 5 ]; then
      echo "❌ High error rate detected: $ERROR_RATE%"
      exit 1
    fi
```

### 5.2 Automatischer Rollback

```yaml
- name: Auto-Rollback on High Error Rate
  if: failure()
  run: |
    ssh $PROD_USER@$PROD_HOST << 'EOF'
      cd /var/www/sustainability-prod
      git reset --hard $PREVIOUS_COMMIT
      systemctl restart sustainability-prod
    EOF
```

### 5.3 Manual Rollback

```bash
# Auf Server einloggen
ssh deploy@production-server

# Zu vorherigem Commit zurück
cd /var/www/sustainability-prod
git log --oneline -5  # Letzten Commit finden
git reset --hard abc1234

# Datenbank-Migration rückgängig (falls nötig)
# npm run migrate:rollback

# Neustart
sudo systemctl restart sustainability-prod
```

---

## 6. Notification & Alerting

### 6.1 Slack-Integration

```yaml
- name: Notify Slack on Success
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "✅ Deployed to Stage: ${{ github.sha }}",
        "channel": "#deployments"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 6.2 E-Mail-Benachrichtigung

```yaml
- name: Send Email
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USER }}
    password: ${{ secrets.EMAIL_PASS }}
    subject: "❌ Deployment Failed: ${{ github.ref }}"
    to: team@yourplatform.com
    from: CI/CD <noreply@yourplatform.com>
    body: |
      Deployment to Stage failed!

      Commit: ${{ github.sha }}
      Branch: ${{ github.ref }}
      Author: ${{ github.actor }}

      See: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

---

## 7. Database-Migrations in Pipeline

### 7.1 Migrations-Workflow

```yaml
- name: Run Database Migrations
  run: |
    ssh $STAGE_USER@$STAGE_HOST << 'EOF'
      cd /var/www/sustainability-stage
      
      # Backup vor Migration
      pg_dump sustainability_stage > /tmp/pre-migration-backup.sql
      
      # Migration ausführen (Entwickler-Tool)
      npm run migrate:deploy
      
      # Migration erfolgreich?
      if [ $? -eq 0 ]; then
        echo "✅ Migration successful"
      else
        echo "❌ Migration failed - Rollback!"
        psql sustainability_stage < /tmp/pre-migration-backup.sql
        exit 1
      fi
    EOF
```

### 7.2 Migration Safety Checks

```yaml
- name: Check Migration Safety
  run: |
    # Prüfe ob Migration destruktiv ist (DROP TABLE, DROP COLUMN)
    if grep -q "DROP TABLE\|DROP COLUMN" migrations/*.sql; then
      echo "⚠️ Destructive migration detected!"
      echo "Manual review required"
      exit 1
    fi
```

---

## 8. Environment-Variablen Management

### 8.1 GitHub Secrets (für CI/CD)

```
Repository → Settings → Secrets and Variables → Actions

Secrets:
  STAGE_SSH_KEY
  STAGE_HOST
  STAGE_USER
  STAGE_DB_URL
  PROD_SSH_KEY
  PROD_HOST
  PROD_USER
  PROD_DB_URL
  SLACK_WEBHOOK
  EMAIL_USER
  EMAIL_PASS
```

### 8.2 .env-Dateien auf Servern

**Stage-Server:**

```bash
# /var/www/sustainability-stage/.env
NODE_ENV=staging
DATABASE_URL=postgresql://stage_app:PASSWORD@localhost:5432/sustainability_stage
API_URL=https://stage.yourplatform.com
FRONTEND_URL=https://stage.yourplatform.com
```

**Deployment-Script lädt diese NICHT hoch!**

```yaml
rsync ... --exclude '.env' --exclude '.env.*'
```

---

## 9. Kosten & Ressourcen

### 9.1 GitHub Actions

**Free Tier:**

- 2.000 Minuten/Monat (Public Repos)
- 500 MB Storage

**Geschätzt:**

- Build + Test: ~5-10 Min pro Run
- Deploy: ~2-5 Min
- Bei 50 Deployments/Monat: ~500 Min
- **Kosten: $0** (im Free Tier)

### 9.2 Server-Ressourcen

**Stage-Server (IONOS VPS M):**

- CPU: Minimal (nur bei Deployment)
- RAM: +100 MB während Deployment
- Disk: +50 MB pro Release
- **Zusätzliche Kosten: $0**

---

## 10. Checkliste Setup

### Initial Setup

- [ ] GitHub Repository erstellt
- [ ] Branches: main, develop
- [ ] Branch Protection aktiviert
- [ ] GitHub Secrets konfiguriert
- [ ] SSH-Key für Deployment erstellt
- [ ] Deploy-User auf Server erstellt

### Pipeline-Files

- [ ] `.github/workflows/build.yml`
- [ ] `.github/workflows/test.yml`
- [ ] `.github/workflows/deploy-stage.yml`
- [ ] `.github/workflows/deploy-prod.yml`

### Server-Setup

- [ ] Stage-Server vorbereitet
- [ ] Deploy-Scripts auf Server
- [ ] Systemd-Service eingerichtet
- [ ] Health-Check-Endpoint implementiert

### Testing

- [ ] Erster Commit → Build läuft?
- [ ] Push zu develop → Stage-Deployment?
- [ ] Tag erstellen → Production (mit Manual Approval)?

---

## 11. Nächste Schritte

1. **Jetzt:** Basis-Pipeline einrichten (Build + Test + Stage)
2. **Woche 2:** Monitoring & Alerts
3. **Monat 2:** Production-Pipeline
4. **Später:** Blue-Green oder Canary

---

**Ready to implement?** Ich erstelle dir die konkreten GitHub Actions Workflows! 🚀
