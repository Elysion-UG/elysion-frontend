# IONOS Managed PostgreSQL Setup

## Stage & Production Datenbanken

**Datum:** 09.02.2026  
**Zweck:** Managed PostgreSQL für Stage & Production mit automatischen Backups

---

## 1. Voraussetzungen

- IONOS Cloud Account (nicht Webhosting!)
- Zugang zum IONOS Cloud Panel: https://cloud.ionos.com
- Kreditkarte für Abrechnung

**Wichtig:** IONOS **Cloud** ≠ IONOS **Webhosting**  
Du brauchst einen **separaten IONOS Cloud Account** für DBaaS!

---

## 2. IONOS Cloud Account einrichten

### 2.1 Registrierung

1. Gehe zu: https://cloud.ionos.com
2. "Kostenlos testen" oder "Anmelden"
3. E-Mail-Verifizierung
4. Zahlungsmethode hinterlegen

### 2.2 Data Center Designer (DCD) öffnen

- Nach Login: "Data Center Designer" aufrufen
- Hier werden alle Cloud-Ressourcen verwaltet

---

## 3. Stage-Datenbank erstellen

### 3.1 Über DCD (Web-Interface)

**Schritt 1: DBaaS-Bereich öffnen**

1. Im DCD: Linkes Menü → "Database as a Service"
2. "PostgreSQL" auswählen
3. "+ Create Cluster" klicken

**Schritt 2: Konfiguration**

| Parameter               | Wert (Stage)              | Beschreibung                    |
| ----------------------- | ------------------------- | ------------------------------- |
| **Cluster Name**        | `sustainability-stage-db` | Eindeutiger Name                |
| **PostgreSQL Version**  | `16` (neueste)            | Aktuelle stabile Version        |
| **Location**            | `de/fra` (Frankfurt)      | Nähe zu Deutschland             |
| **Number of Instances** | `1`                       | Single-Node (günstiger)         |
| **CPU Cores**           | `2`                       | Für Stage ausreichend           |
| **RAM**                 | `4 GB`                    | Für Stage ausreichend           |
| **Storage**             | `20 GB`                   | SSD-Storage                     |
| **Connections**         | `100`                     | Max. gleichzeitige Verbindungen |
| **Backup Time**         | `03:00 UTC`               | Nachts (wenig Last)             |
| **Maintenance Window**  | `Sunday 03:00-05:00 UTC`  | Sonntag nachts                  |

**Schritt 3: Credentials festlegen**

```
Database Name:     sustainability_stage
Database User:     stage_admin
Database Password: [SICHERES PASSWORT GENERIEREN]
```

**Passwort-Anforderungen:**

- Min. 10 Zeichen
- Groß- & Kleinbuchstaben
- Zahlen & Sonderzeichen
- Beispiel-Generator: https://passwordsgenerator.net

**Schritt 4: Erstellen**

- "Create Database Cluster" klicken
- Provisionierung dauert ~5-10 Minuten
- Status wird angezeigt: "BUSY" → "AVAILABLE"

**Schritt 5: Connection Details notieren**

Nach Erstellung:

```
Host:     <cluster-id>.db.ionos.com
Port:     5432
Database: sustainability_stage
User:     stage_admin
Password: [dein-passwort]
SSL Mode: require
```

### 3.2 Über API (Alternative - für Automation)

```bash
# IONOS Cloud Token generieren (DCD → API → Tokens)
export IONOS_TOKEN="your-api-token"

# Cluster erstellen
curl -X POST https://api.ionos.com/databases/postgresql/clusters \
  -H "Authorization: Bearer $IONOS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "displayName": "sustainability-stage-db",
      "postgresVersion": "16",
      "location": "de/fra",
      "instances": 1,
      "cores": 2,
      "ram": 4096,
      "storageSize": 20480,
      "connections": 100,
      "backupLocation": "de",
      "synchronizationMode": "ASYNCHRONOUS",
      "credentials": {
        "username": "stage_admin",
        "password": "SECURE_PASSWORD_HERE"
      }
    }
  }'
```

---

## 4. Production-Datenbank erstellen

**Wiederhole Schritt 3 mit folgenden Unterschieden:**

| Parameter               | Wert (Production)           |
| ----------------------- | --------------------------- |
| **Cluster Name**        | `sustainability-prod-db`    |
| **Number of Instances** | `2-3` (Multi-Node für HA)   |
| **CPU Cores**           | `4`                         |
| **RAM**                 | `8 GB`                      |
| **Storage**             | `50 GB` (wächst mit Bedarf) |
| **Database Name**       | `sustainability_prod`       |
| **Database User**       | `prod_admin`                |

**Wichtig für Production:**

- ✅ Multi-Node aktivieren (Failover!)
- ✅ Größere Ressourcen
- ✅ Separates Passwort (nicht gleich wie Stage!)

---

## 5. Backups & Recovery

### 5.1 Automatische Backups

**Bereits konfiguriert:**

- Täglich um 03:00 UTC
- Aufbewahrung: 7 Tage
- Point-in-Time Recovery: Ja

### 5.2 Manuelles Backup erstellen

**Über DCD:**

1. Cluster auswählen
2. "Backups" Tab
3. "Create Backup Now"

**Über API:**

```bash
curl -X POST https://api.ionos.com/databases/postgresql/clusters/{clusterId}/backups \
  -H "Authorization: Bearer $IONOS_TOKEN"
```

### 5.3 Restore durchführen

**Über DCD:**

1. Cluster auswählen
2. "Backups" → Backup auswählen
3. "Restore" klicken
4. Zeitpunkt wählen (Point-in-Time)

**ACHTUNG:** Restore überschreibt aktuelle Daten!

### 5.4 Backup-Download (Export)

**Für lokale Sicherung:**

```bash
# Mit pg_dump über Netzwerk
pg_dump -h <cluster-id>.db.ionos.com \
        -U stage_admin \
        -d sustainability_stage \
        -F c \
        -f backup_$(date +%Y%m%d).dump
```

---

## 6. Datenbank-Schema einrichten

### 6.1 Lokale Verbindung herstellen

**Voraussetzung:** PostgreSQL Client installiert

```bash
# Ubuntu/Debian
sudo apt install postgresql-client

# macOS
brew install postgresql

# Windows
# Download von: https://www.postgresql.org/download/windows/
```

**Verbindung testen:**

```bash
psql "postgresql://stage_admin:PASSWORD@cluster-id.db.ionos.com:5432/sustainability_stage?sslmode=require"
```

### 6.2 Schema aus Dokumentation laden

**Option A: SQL-Datei verwenden**

Erstelle `schema.sql` aus allen Modul-Dokumentationen:

```sql
-- Aus Modul 01: User Management
CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'BUYER' NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    email_verified BOOLEAN DEFAULT FALSE,
    status user_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Weitere Tabellen aus allen Modulen...
-- (siehe modules/Modul_XX_*.md für vollständiges Schema)
```

**Schema laden:**

```bash
psql "postgresql://..." < schema.sql
```

**Option B: Mit Migration-Tool (z.B. wenn Prisma genutzt wird)**

Entwickler erstellt Migrations später selbst.

---

## 7. Connection Strings für Anwendung

### 7.1 Stage

```bash
# .env.stage
DATABASE_URL="postgresql://stage_admin:PASSWORD@cluster-id.db.ionos.com:5432/sustainability_stage?sslmode=require"
```

### 7.2 Production

```bash
# .env.production
DATABASE_URL="postgresql://prod_admin:PASSWORD@cluster-id-prod.db.ionos.com:5432/sustainability_prod?sslmode=require"
```

### 7.3 Sicherheit

**NIEMALS committen!**

- `.env*` in `.gitignore`
- Secrets in CI/CD-Umgebungsvariablen
- Entwickler erhalten Connection Strings separat

---

## 8. Monitoring & Wartung

### 8.1 Monitoring aktivieren

**Im DCD:**

1. Cluster auswählen
2. "Metrics" Tab
3. Überwache:
   - CPU-Auslastung
   - RAM-Nutzung
   - Storage-Nutzung
   - Connections
   - Query-Performance

### 8.2 Alerts einrichten

**Empfohlene Alerts:**

- CPU > 80% für 5 Min
- RAM > 90% für 5 Min
- Storage > 85%
- Failed Connections > 50

### 8.3 Maintenance Windows

**Bereits konfiguriert:**

- Sonntag 03:00-05:00 UTC
- Automatische Updates & Patches
- Downtime: ~wenige Sekunden (Failover bei Multi-Node)

---

## 9. Skalierung

### 9.1 Vertikal skalieren (mehr Ressourcen)

**Im DCD:**

1. Cluster auswählen
2. "Edit" klicken
3. CPU/RAM/Storage erhöhen
4. "Save" → Änderung wird angewendet

**Downtime:** Wenige Sekunden bei Multi-Node, ~2-5 Min bei Single-Node

### 9.2 Horizontal skalieren (mehr Nodes)

**Für Production:**

1. Von 1 → 2-3 Nodes
2. Automatisches Failover aktiviert
3. Read-Replicas für Lastenverteilung

---

## 10. Kosten

### 10.1 Stage-Datenbank (geschätzt)

```
2 CPU Cores:          ~15 €/Monat
4 GB RAM:             ~10 €/Monat
20 GB Storage:        ~3 €/Monat
Backups (inkl.):      0 €
─────────────────────────────────
Gesamt:               ~28 €/Monat
```

### 10.2 Production-Datenbank (geschätzt)

```
4 CPU Cores:          ~30 €/Monat
8 GB RAM:             ~20 €/Monat
50 GB Storage:        ~8 €/Monat
Multi-Node (×3):      ×3 Multiplikator
─────────────────────────────────
Gesamt:               ~174 €/Monat
```

**Minutengenaue Abrechnung:** Nur tatsächliche Nutzung wird berechnet

### 10.3 Kostenrechner

https://cloud.ionos.com/pricing

---

## 11. Security Best Practices

### 11.1 Netzwerk

✅ **SSL/TLS erzwungen** (Let's Encrypt)  
✅ **Firewall aktiviert** (nur erlaubte IPs)  
✅ **Private Networking** (optional: IONOS Cloud VDC)

### 11.2 Zugriff

✅ **Starke Passwörter** (min. 16 Zeichen)  
✅ **Separate User** für Anwendung (nicht admin)  
✅ **Read-Only User** für Analytics/Reporting  
✅ **Keine Root/Superuser** (IONOS-Restriktion)

### 11.3 Anwendungs-User erstellen

```sql
-- Read-Write User (für Backend)
CREATE USER app_backend WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE sustainability_stage TO app_backend;
GRANT USAGE ON SCHEMA public TO app_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_backend;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_backend;

-- Read-Only User (für Analytics)
CREATE USER analytics_readonly WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE sustainability_stage TO analytics_readonly;
GRANT USAGE ON SCHEMA public TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;
```

---

## 12. Troubleshooting

### Problem: Verbindung schlägt fehl

**Lösung:**

1. SSL-Mode prüfen: `?sslmode=require`
2. IP-Whitelist prüfen (Firewall)
3. Port 5432 offen?
4. Credentials korrekt?

### Problem: Langsame Queries

**Lösung:**

1. Query-Analyse: `EXPLAIN ANALYZE SELECT ...`
2. Indizes fehlen?
3. Mehr RAM/CPU nötig? (skalieren)
4. Connection Pooling aktivieren (PgBouncer)

### Problem: Out of Storage

**Lösung:**

1. Storage erhöhen (DCD)
2. Alte Daten archivieren
3. Backups extern speichern

---

## 13. Support

**IONOS Support:**

- Cloud Panel: "Support" → Ticket erstellen
- Telefon: +49 721 170 5436
- Dokumentation: https://docs.ionos.com/cloud/databases/postgresql

**PostgreSQL Community:**

- Forum: https://www.postgresql.org/community/
- Stack Overflow: Tag `postgresql`

---

## ✅ Checkliste Setup

- [ ] IONOS Cloud Account erstellt
- [ ] Stage-Cluster erstellt (1 Node, 2 CPU, 4 GB RAM, 20 GB)
- [ ] Production-Cluster erstellt (3 Nodes, 4 CPU, 8 GB RAM, 50 GB)
- [ ] Connection Strings notiert & sicher gespeichert
- [ ] Datenbank-Schema geladen
- [ ] Anwendungs-User erstellt (nicht admin)
- [ ] Backups geprüft (täglich um 03:00 UTC)
- [ ] Monitoring/Alerts aktiviert
- [ ] Firewall konfiguriert
- [ ] Dokumentation an Team verteilt

---

**Nächster Schritt:** CI/CD-Pipeline einrichten für automatisches Deployment zu Stage-DB
