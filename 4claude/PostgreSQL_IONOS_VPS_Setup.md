# PostgreSQL auf IONOS VPS einrichten

## Stage-Datenbank Self-Hosted

**Zweck:** PostgreSQL selbst auf IONOS VPS installieren für Stage-Environment  
**Voraussetzung:** IONOS VPS/Cloud Server mit Ubuntu  
**Kosten:** Nur VPS-Kosten (~5-20€/Monat), PostgreSQL ist kostenlos

---

## 1. Voraussetzungen prüfen

### 1.1 Was du brauchst

- **IONOS VPS** oder **Cloud Server** (Linux)
- **SSH-Zugang** zum Server
- **Root oder sudo-Rechte**
- **Min. 2 GB RAM** (empfohlen: 4 GB)
- **Min. 10 GB freier Speicher**

### 1.2 VPS-Zugang testen

```bash
# SSH-Verbindung herstellen
ssh root@deine-server-ip

# Oder mit Benutzername
ssh username@deine-server-ip
```

**IONOS VPS-Details findest du:**

- IONOS Cloud Panel → Server → Details
- E-Mail nach VPS-Erstellung (IP-Adresse, Root-Passwort)

---

## 2. Server vorbereiten

### 2.1 System aktualisieren

```bash
# Paketlisten aktualisieren
sudo apt update

# Installierte Pakete upgraden
sudo apt upgrade -y

# Neustarten (falls Kernel-Updates)
sudo reboot
```

### 2.2 Firewall einrichten (UFW)

```bash
# UFW installieren (falls nicht vorhanden)
sudo apt install ufw -y

# SSH erlauben (WICHTIG: Vorher, sonst ausgesperrt!)
sudo ufw allow OpenSSH
sudo ufw allow 22/tcp

# PostgreSQL-Port (später, nur für autorisierte IPs)
# NICHT jetzt! Erst nach Installation

# Firewall aktivieren
sudo ufw enable

# Status prüfen
sudo ufw status
```

---

## 3. PostgreSQL installieren

### 3.1 PostgreSQL Repository hinzufügen (neueste Version)

```bash
# PostgreSQL GPG-Key importieren
sudo apt install -y wget gnupg
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Repository hinzufügen (Ubuntu 22.04/24.04)
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# Paketliste aktualisieren
sudo apt update
```

### 3.2 PostgreSQL installieren

```bash
# PostgreSQL 16 installieren (neueste stabile Version)
sudo apt install postgresql-16 postgresql-contrib-16 -y

# Version prüfen
psql --version
# Ausgabe: psql (PostgreSQL) 16.x
```

### 3.3 Status prüfen

```bash
# PostgreSQL-Service Status
sudo systemctl status postgresql

# Sollte "active (running)" zeigen

# Bei Bedarf starten
sudo systemctl start postgresql

# Autostart aktivieren (bereits default)
sudo systemctl enable postgresql
```

---

## 4. PostgreSQL konfigurieren

### 4.1 Als postgres-User anmelden

```bash
# Zum postgres-User wechseln
sudo -i -u postgres

# PostgreSQL-CLI starten
psql
```

### 4.2 Stage-Datenbank erstellen

```sql
-- Datenbank erstellen
CREATE DATABASE sustainability_stage;

-- User für die Anwendung erstellen (NICHT "postgres" verwenden!)
CREATE USER stage_app WITH PASSWORD 'SICHERES_PASSWORT_HIER';

-- Alle Rechte für die Datenbank vergeben
GRANT ALL PRIVILEGES ON DATABASE sustainability_stage TO stage_app;

-- Schema-Rechte vergeben (PostgreSQL 15+)
\c sustainability_stage
GRANT ALL ON SCHEMA public TO stage_app;

-- Beenden
\q
```

**Passwort-Generator:** https://passwordsgenerator.net  
**Anforderungen:** Min. 16 Zeichen, Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen

### 4.3 Zurück zu deinem User

```bash
# postgres-User verlassen
exit

# Du bist jetzt wieder dein normaler User
```

---

## 5. Remote-Zugriff konfigurieren

**WICHTIG:** Standardmäßig akzeptiert PostgreSQL nur lokale Verbindungen!

### 5.1 postgresql.conf bearbeiten

```bash
# Datei öffnen
sudo nano /etc/postgresql/16/main/postgresql.conf

# Suche nach "listen_addresses" (ca. Zeile 59)
# Ändere von:
#listen_addresses = 'localhost'

# Zu:
listen_addresses = '*'

# Speichern: STRG+O, Enter, STRG+X
```

### 5.2 pg_hba.conf bearbeiten (Zugriffsrechte)

```bash
# Datei öffnen
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Ans Ende der Datei hinzufügen:

# Remote-Zugriff für stage_app
# WICHTIG: Ersetze "DEINE_APP_IP" mit der IP deiner Anwendung
host    sustainability_stage    stage_app    0.0.0.0/0    md5

# Für mehr Sicherheit: nur spezifische IP erlauben
# host    sustainability_stage    stage_app    123.45.67.89/32    md5

# Speichern: STRG+O, Enter, STRG+X
```

**Sicherheits-Hinweise:**

- `0.0.0.0/0` = **ALLE IPs** (nur für Stage ok, nicht für Production!)
- `123.45.67.89/32` = nur **eine spezifische IP**
- Für Production: Whitelisting mit spezifischen IPs!

### 5.3 PostgreSQL neu starten

```bash
sudo systemctl restart postgresql

# Status prüfen
sudo systemctl status postgresql
```

### 5.4 Firewall öffnen

```bash
# PostgreSQL-Port für Remote-Zugriff öffnen
sudo ufw allow 5432/tcp

# Status prüfen
sudo ufw status

# Sollte zeigen:
# 5432/tcp    ALLOW    Anywhere
```

---

## 6. Verbindung testen

### 6.1 Von lokalem Rechner aus

```bash
# Voraussetzung: PostgreSQL-Client installiert
# Mac: brew install postgresql
# Ubuntu: sudo apt install postgresql-client
# Windows: https://www.postgresql.org/download/windows/

# Verbindung testen
psql "postgresql://stage_app:DEIN_PASSWORT@DEINE_SERVER_IP:5432/sustainability_stage"

# Sollte funktionieren!
```

### 6.2 Connection String für Anwendung

```bash
# Format:
DATABASE_URL="postgresql://stage_app:PASSWORT@SERVER_IP:5432/sustainability_stage"

# Beispiel:
DATABASE_URL="postgresql://stage_app:MySecurePass123!@45.67.89.123:5432/sustainability_stage"
```

**Für .env.stage:**

```env
DATABASE_URL="postgresql://stage_app:PASSWORT@SERVER_IP:5432/sustainability_stage"
DB_HOST="SERVER_IP"
DB_PORT="5432"
DB_NAME="sustainability_stage"
DB_USER="stage_app"
DB_PASSWORD="PASSWORT"
```

---

## 7. Datenbank-Schema laden

### 7.1 Schema-Datei vorbereiten

Erstelle `schema.sql` lokal mit allen Tabellen aus den Modul-Dokumentationen:

```sql
-- Aus Modul 01: User Management
CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE seller_status AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

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

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active_profile_type VARCHAR(20) DEFAULT 'none',
    simple_profile JSONB,
    extended_profile JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    vat_id VARCHAR(50),
    iban VARCHAR(50),
    status seller_status DEFAULT 'PENDING',
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- SHIPPING, BILLING, BOTH
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    street VARCHAR(255) NOT NULL,
    house_number VARCHAR(20) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(2) DEFAULT 'DE',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weitere Tabellen aus Modul 02, 03, etc...
-- (siehe Modul-Dokumentationen für vollständiges Schema)
```

### 7.2 Schema hochladen

```bash
# Per psql (von lokalem Rechner)
psql "postgresql://stage_app:PASSWORT@SERVER_IP:5432/sustainability_stage" < schema.sql

# Oder per SCP hochladen und auf Server ausführen
scp schema.sql root@SERVER_IP:/tmp/
ssh root@SERVER_IP
sudo -u postgres psql sustainability_stage < /tmp/schema.sql
```

### 7.3 Schema prüfen

```sql
-- Mit psql verbinden
psql "postgresql://stage_app:PASSWORT@SERVER_IP:5432/sustainability_stage"

-- Tabellen anzeigen
\dt

-- Sollte alle Tabellen zeigen

-- Beenden
\q
```

---

## 8. Automatische Backups einrichten

### 8.1 Backup-Script erstellen

```bash
# Backup-Ordner erstellen
sudo mkdir -p /var/backups/postgresql
sudo chown postgres:postgres /var/backups/postgresql

# Backup-Script erstellen
sudo nano /usr/local/bin/pg-backup-stage.sh
```

**Script-Inhalt:**

```bash
#!/bin/bash

# Konfiguration
DB_NAME="sustainability_stage"
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

# Alte Backups löschen (älter als 7 Tage)
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +7 -delete

# Backup erstellen
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_FILE

# Rechte setzen
chmod 600 $BACKUP_FILE

echo "Backup erstellt: $BACKUP_FILE"
```

**Script ausführbar machen:**

```bash
sudo chmod +x /usr/local/bin/pg-backup-stage.sh

# Testen
sudo /usr/local/bin/pg-backup-stage.sh
```

### 8.2 Cronjob einrichten (täglich um 3 Uhr)

```bash
# Crontab bearbeiten
sudo crontab -e

# Folgende Zeile hinzufügen:
0 3 * * * /usr/local/bin/pg-backup-stage.sh >> /var/log/pg-backup.log 2>&1

# Speichern & Beenden
```

### 8.3 Backup wiederherstellen (bei Bedarf)

```bash
# Backup-Datei auflisten
ls -lh /var/backups/postgresql/

# Restore durchführen
gunzip < /var/backups/postgresql/sustainability_stage_DATUM.sql.gz | sudo -u postgres psql sustainability_stage
```

---

## 9. Monitoring & Wartung

### 9.1 Logs überwachen

```bash
# PostgreSQL-Logs anzeigen
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Systemd-Journal
sudo journalctl -u postgresql -f
```

### 9.2 Datenbank-Größe prüfen

```sql
-- Mit psql verbinden
psql "postgresql://stage_app:PASSWORT@SERVER_IP:5432/sustainability_stage"

-- Datenbank-Größe
SELECT pg_size_pretty(pg_database_size('sustainability_stage'));

-- Tabellen-Größen
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 9.3 Performance-Monitoring

```sql
-- Aktive Verbindungen
SELECT count(*) FROM pg_stat_activity;

-- Langsame Queries (über 500ms)
SELECT
    pid,
    now() - query_start AS duration,
    query
FROM pg_stat_activity
WHERE state = 'active'
AND now() - query_start > interval '500 milliseconds';
```

### 9.4 Vacuum (Datenbank-Wartung)

```bash
# Manuell (als postgres-User)
sudo -u postgres vacuumdb -z -d sustainability_stage

# Oder automatisch via Cronjob (wöchentlich)
# Füge zu crontab hinzu:
0 2 * * 0 /usr/bin/vacuumdb -z -d sustainability_stage
```

---

## 10. Sicherheits-Best-Practices

### 10.1 ✅ Bereits umgesetzt

- ✅ Separater App-User (nicht "postgres")
- ✅ Starkes Passwort
- ✅ Firewall (UFW)
- ✅ SSL/TLS (PostgreSQL default)

### 10.2 Zusätzliche Empfehlungen

**A) Fail2Ban installieren (Brute-Force-Schutz)**

```bash
sudo apt install fail2ban -y

# PostgreSQL-Jail aktivieren
sudo nano /etc/fail2ban/jail.local

# Hinzufügen:
[postgresql]
enabled = true
port = 5432
filter = postgresql
logpath = /var/log/postgresql/postgresql-16-main.log
maxretry = 5
bantime = 3600

# Fail2Ban neu starten
sudo systemctl restart fail2ban
```

**B) Passwort-Policy verschärfen**

```bash
# pgAudit installieren (Audit-Logging)
sudo apt install postgresql-16-pgaudit -y
```

**C) Regelmäßige Updates**

```bash
# Wöchentlich prüfen
sudo apt update && sudo apt upgrade postgresql-16 -y
```

---

## 11. Troubleshooting

### Problem: Verbindung schlägt fehl

**Lösung:**

```bash
# 1. Firewall prüfen
sudo ufw status

# 2. PostgreSQL läuft?
sudo systemctl status postgresql

# 3. Port erreichbar?
sudo netstat -tulpn | grep 5432

# 4. Logs prüfen
sudo tail -100 /var/log/postgresql/postgresql-16-main.log
```

### Problem: "Peer authentication failed"

**Lösung:**

- pg_hba.conf prüfen
- Methode "md5" statt "peer" verwenden
- PostgreSQL neu starten

### Problem: Zu viele Verbindungen

**Lösung:**

```bash
# max_connections erhöhen
sudo nano /etc/postgresql/16/main/postgresql.conf

# Ändern:
max_connections = 200  # statt 100

# Neu starten
sudo systemctl restart postgresql
```

---

## 12. Kosten-Übersicht

### VPS-Kosten (IONOS)

| VPS   | CPU | RAM  | Storage | Preis/Monat |
| ----- | --- | ---- | ------- | ----------- |
| VPS S | 1   | 1 GB | 10 GB   | ~5 €        |
| VPS M | 2   | 2 GB | 40 GB   | ~10 €       |
| VPS L | 4   | 4 GB | 80 GB   | ~20 €       |

**Empfehlung für Stage:** VPS M (2 CPU, 2 GB RAM) = ~10€/Monat

**PostgreSQL:** Kostenlos (Open Source)

---

## 13. Production vorbereiten

Für Production später:

- [ ] Separater VPS oder größerer VPS
- [ ] Multi-Node-Setup (Replication)
- [ ] Connection Pooling (PgBouncer)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Offsite-Backups (S3, Backblaze)
- [ ] SSL-Zertifikat erzwingen
- [ ] IP-Whitelist statt 0.0.0.0/0

---

## ✅ Setup-Checkliste

- [ ] IONOS VPS vorhanden & erreichbar
- [ ] System aktualisiert
- [ ] Firewall (UFW) konfiguriert
- [ ] PostgreSQL 16 installiert
- [ ] Datenbank `sustainability_stage` erstellt
- [ ] User `stage_app` erstellt
- [ ] Remote-Zugriff konfiguriert
- [ ] Verbindung erfolgreich getestet
- [ ] Schema geladen
- [ ] Backup-Script eingerichtet
- [ ] Cronjob für tägliche Backups
- [ ] Connection String dokumentiert

---

**Nächster Schritt:** CI/CD-Pipeline einrichten für automatisches Deployment zu Stage-DB!
