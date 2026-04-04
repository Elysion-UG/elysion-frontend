# Monitoring API — Frontend Error Persistierung

> **Status: GEPLANT — noch nicht implementiert**
> `MonitoringService` existiert noch nicht in `src/services/`. Der Flush-Mechanismus in `src/lib/error-store.ts` ist ebenfalls noch nicht gebaut. Dieses Dokument ist eine Implementierungs-Spezifikation.

Spezifikation für die Backend-seitige Persistierung von Frontend-Fehlerereignissen. Das Frontend erfasst bereits Fehler in einem In-Memory-Ring-Buffer (`src/lib/error-store.ts`) und zeigt sie im Admin-Dashboard (`/admin/monitoring`). Diese Spezifikation beschreibt die notwendige Backend-Erweiterung, um Fehler über Sessions hinweg in der Datenbank zu speichern.

---

## Architektur-Überblick

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Frontend)                                     │
│                                                         │
│  Error Sources:                                         │
│    • API-Fehler (api-client.ts)                        │
│    • window.onerror / unhandledrejection               │
│    • React Error Boundary                               │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐     Batch (max 50 Events)         │
│  │  error-store.ts  │ ──────────────────────────────┐   │
│  │  (Ring Buffer)   │     alle 30s oder bei 20+     │   │
│  │  500 Events max  │     unflushed Events          │   │
│  └─────────────────┘                                │   │
└─────────────────────────────────────────────────────┼───┘
                                                      │
                POST /api/v1/monitoring/errors         │
                (public, kein Auth erforderlich)       │
                                                      ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (Spring Boot)                                  │
│                                                         │
│  MonitoringErrorController                              │
│    → FrontendErrorIngestionService                      │
│      → Deduplizierung (client_event_id)                │
│      → Validation (max 50 Events, Feldlängen)          │
│      → saveAll()                                        │
│                                                         │
│  AdminMonitoringController                              │
│    → FrontendErrorQueryService                          │
│      → Paginierte Abfrage mit Filtern                  │
│      → Aggregierte Stats                                │
│                                                         │
│  FrontendErrorCleanupJob                                │
│    → @Scheduled: täglich 03:00 Uhr                     │
│    → Löscht Events älter als 30 Tage                   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL                                             │
│                                                         │
│  frontend_error_events                                  │
│    • Promoted Felder für schnelle Filterung            │
│    • JSONB für flexible Metadata                        │
│    • UNIQUE auf client_event_id (Dedup)                │
│    • Indexes für severity, category, created_at        │
└─────────────────────────────────────────────────────────┘
```

---

## DB-Schema

### Tabelle: `frontend_error_events`

Flyway-Migration: `V3__frontend_error_events.sql`

```sql
CREATE TABLE public.frontend_error_events (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    client_event_id  VARCHAR(64)   NOT NULL,
    session_id       VARCHAR(64)   NULL,
    severity         VARCHAR(10)   NOT NULL,
    category         VARCHAR(10)   NOT NULL,
    message          VARCHAR(2000) NOT NULL,
    stack            TEXT          NULL,
    url              VARCHAR(2048) NULL,
    api_path         VARCHAR(500)  NULL,
    status_code      SMALLINT      NULL,
    component        VARCHAR(200)  NULL,
    user_id          UUID          NULL,
    user_agent       VARCHAR(500)  NULL,
    metadata         JSONB         NULL,
    client_timestamp TIMESTAMPTZ   NOT NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT chk_fee_severity
        CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    CONSTRAINT chk_fee_category
        CHECK (category IN ('API', 'AUTH', 'RENDER', 'NETWORK', 'UNKNOWN'))
);
```

### Spalten-Referenz

| Spalte             | Typ           | Nullable | Beschreibung                                               |
| ------------------ | ------------- | -------- | ---------------------------------------------------------- |
| `id`               | UUID          | NOT NULL | Server-generierte PK                                       |
| `client_event_id`  | VARCHAR(64)   | NOT NULL | Vom Frontend generierte Event-ID (Deduplizierung)          |
| `session_id`       | VARCHAR(64)   | NULL     | Browser-Session-ID (gruppiert Fehler pro Tab)              |
| `severity`         | VARCHAR(10)   | NOT NULL | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`                        |
| `category`         | VARCHAR(10)   | NOT NULL | `API`, `AUTH`, `RENDER`, `NETWORK`, `UNKNOWN`              |
| `message`          | VARCHAR(2000) | NOT NULL | Fehlermeldung (Frontend truncated auf 2000 Zeichen)        |
| `stack`            | TEXT          | NULL     | Stack Trace (Frontend truncated auf 8 KB)                  |
| `url`              | VARCHAR(2048) | NULL     | Seiten-URL wo der Fehler auftrat                           |
| `api_path`         | VARCHAR(500)  | NULL     | API-Pfad der fehlgeschlagen ist (z.B. `/api/v1/products`)  |
| `status_code`      | SMALLINT      | NULL     | HTTP-Statuscode (z.B. 500, 403)                            |
| `component`        | VARCHAR(200)  | NULL     | React-Komponentenname (bei Render-Fehlern)                 |
| `user_id`          | UUID          | NULL     | Eingeloggter User zum Zeitpunkt des Fehlers (kein FK)      |
| `user_agent`       | VARCHAR(500)  | NULL     | Browser User-Agent                                         |
| `metadata`         | JSONB         | NULL     | Restliche Key-Value-Paare aus dem Frontend-Metadata-Objekt |
| `client_timestamp` | TIMESTAMPTZ   | NOT NULL | Zeitpunkt des Fehlers im Browser (ISO-8601)                |
| `created_at`       | TIMESTAMPTZ   | NOT NULL | Zeitpunkt der Persistierung im Backend                     |

### Indexes

```sql
-- Deduplizierung: gleiche Client-Events nicht doppelt speichern
CREATE UNIQUE INDEX uq_fee_client_event_id
    ON public.frontend_error_events (client_event_id);

-- Admin-Dashboard: chronologische Sortierung
CREATE INDEX idx_fee_created_at
    ON public.frontend_error_events (created_at DESC);

-- Filter nach Severity
CREATE INDEX idx_fee_severity
    ON public.frontend_error_events (severity, created_at DESC);

-- Filter nach Category
CREATE INDEX idx_fee_category
    ON public.frontend_error_events (category, created_at DESC);

-- Session-Gruppierung
CREATE INDEX idx_fee_session
    ON public.frontend_error_events (session_id, created_at DESC)
    WHERE session_id IS NOT NULL;

-- Retention-Cleanup
CREATE INDEX idx_fee_client_ts
    ON public.frontend_error_events (client_timestamp);
```

### Design-Entscheidungen

- **Promoted Felder vs. JSONB:** Häufig gefilterte Felder (`severity`, `category`, `url`, `status_code`, `api_path`, `component`) als eigene Spalten für schnelle Index-basierte Queries. Restliche Metadata (beliebige Custom-Felder) als JSONB.
- **Kein FK auf `users`:** Fehler können von anonymen oder inzwischen gelöschten Usern stammen. `user_id` ist rein informativ.
- **Enums UPPERCASE:** Konsistent mit `FinanceAuditRecord`, `PaymentExceptionRecord` und dem Standard `EnumType.STRING`-Verhalten von JPA.
- **`client_event_id` UNIQUE:** Verhindert Duplikate bei Batch-Retries. Das Frontend generiert pro Event eine UUID.
- **`client_timestamp` vs. `created_at`:** Zwei Zeitstempel — wann der Fehler im Browser auftrat vs. wann er im Backend ankam. Ermöglicht Erkennung von Verzögerungen beim Flush.

---

## API-Contracts

### 1. Error-Batch Ingestion (Public)

```
POST /api/v1/monitoring/errors
Content-Type: application/json
```

**Auth:** `permitAll()` — kein JWT erforderlich (Fehler können vor dem Login auftreten).

**Rate Limit:** Max 10 Requests/Minute pro IP.

#### Request Body

```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "events": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-04-04T12:34:56.789Z",
      "severity": "high",
      "category": "api",
      "message": "Request failed: GET /api/v1/products returned 500",
      "stack": "Error: Request failed\n    at apiRequest (api-client.ts:42)\n    ...",
      "metadata": {
        "url": "https://shop.example.com/products",
        "apiPath": "/api/v1/products",
        "statusCode": 500,
        "userId": "user-uuid-here",
        "userAgent": "Mozilla/5.0 ...",
        "component": null,
        "customField": "additional context"
      }
    }
  ]
}
```

#### Validierung

| Feld                 | Constraint                                                           |
| -------------------- | -------------------------------------------------------------------- |
| `events`             | `@Size(min = 1, max = 50)` — 1-50 Events pro Batch                   |
| `events[].id`        | `@NotBlank`, `@Size(max = 64)`                                       |
| `events[].timestamp` | `@NotNull`, gültiges ISO-8601                                        |
| `events[].severity`  | `@NotNull`, einer von: `critical`, `high`, `medium`, `low`           |
| `events[].category`  | `@NotNull`, einer von: `api`, `auth`, `render`, `network`, `unknown` |
| `events[].message`   | `@NotBlank`, `@Size(max = 2000)`                                     |
| `events[].stack`     | Optional, wird serverseitig auf 8 KB truncated                       |
| `sessionId`          | Optional, `@Size(max = 64)`                                          |

**Hinweis:** Das Frontend sendet `severity` und `category` in Kleinbuchstaben. Das Backend muss diese vor dem Speichern in Großbuchstaben konvertieren (`.toUpperCase()`), da die DB-CHECK-Constraints Uppercase erwarten.

#### Response: `202 Accepted`

```json
{
  "status": "success",
  "message": null,
  "data": {
    "accepted": 3,
    "duplicates": 1
  }
}
```

#### Fehler-Responses

| Status | Grund                                                                  |
| ------ | ---------------------------------------------------------------------- |
| 400    | Validation-Fehler (leere Events-Liste, ungültiger Severity-Wert, etc.) |
| 429    | Rate Limit überschritten                                               |

---

### 2. Admin — Fehler abfragen (Auth: ADMIN)

```
GET /api/v1/admin/monitoring/errors
```

**Auth:** Erfordert `ROLE_ADMIN` (bestehende Security-Config für `/api/v1/admin/**`).

#### Query-Parameter

| Parameter   | Typ      | Default | Beschreibung                                          |
| ----------- | -------- | ------- | ----------------------------------------------------- |
| `page`      | int      | `0`     | Seitennummer (0-basiert)                              |
| `size`      | int      | `25`    | Einträge pro Seite (max 100)                          |
| `severity`  | string   | —       | Filter: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`           |
| `category`  | string   | —       | Filter: `API`, `AUTH`, `RENDER`, `NETWORK`, `UNKNOWN` |
| `from`      | ISO-8601 | —       | Start-Zeitpunkt (inklusiv)                            |
| `to`        | ISO-8601 | —       | End-Zeitpunkt (exklusiv)                              |
| `sessionId` | string   | —       | Filter nach Browser-Session                           |

#### Response: `200 OK`

```json
{
  "status": "success",
  "message": null,
  "data": {
    "items": [
      {
        "id": "db-generated-uuid",
        "clientEventId": "frontend-generated-uuid",
        "sessionId": "session-uuid",
        "severity": "HIGH",
        "category": "API",
        "message": "Request failed: GET /api/v1/products returned 500",
        "stack": "Error: Request failed\n    at ...",
        "url": "https://shop.example.com/products",
        "apiPath": "/api/v1/products",
        "statusCode": 500,
        "component": null,
        "userId": "user-uuid",
        "userAgent": "Mozilla/5.0 ...",
        "metadata": { "customField": "value" },
        "clientTimestamp": "2026-04-04T12:34:56.789Z",
        "createdAt": "2026-04-04T12:35:02.123Z"
      }
    ],
    "page": 0,
    "size": 25,
    "totalItems": 142,
    "totalPages": 6
  }
}
```

---

### 3. Admin — Aggregierte Stats (Auth: ADMIN)

```
GET /api/v1/admin/monitoring/errors/stats?hours=24
```

**Auth:** Erfordert `ROLE_ADMIN`.

#### Query-Parameter

| Parameter | Typ | Default | Beschreibung                               |
| --------- | --- | ------- | ------------------------------------------ |
| `hours`   | int | `24`    | Zeitfenster in Stunden (max 720 = 30 Tage) |

#### Response: `200 OK`

```json
{
  "status": "success",
  "message": null,
  "data": {
    "total": 142,
    "bySeverity": {
      "CRITICAL": 2,
      "HIGH": 15,
      "MEDIUM": 80,
      "LOW": 45
    },
    "byCategory": {
      "API": 60,
      "AUTH": 10,
      "RENDER": 30,
      "NETWORK": 40,
      "UNKNOWN": 2
    },
    "errorsPerMinute": 0.1
  }
}
```

---

## Backend-Implementierung

### JPA Entity

**Package:** `com.marketplace.platform.domain.monitoring`

Folgt dem `AdminAuditLog`-Pattern:

- UUID PK mit `@UuidGenerator`
- `@PrePersist` setzt `createdAt = Instant.now()`
- Static Factory `create(...)` statt öffentlicher Konstruktor
- Protected No-Arg-Konstruktor für JPA
- Getter only, keine Setter (immutable nach Erstellung)

**Enums (gleicher Package):**

- `FrontendErrorSeverity`: `CRITICAL, HIGH, MEDIUM, LOW`
- `FrontendErrorCategory`: `API, AUTH, RENDER, NETWORK, UNKNOWN`

### Repository

**Package:** `com.marketplace.platform.infrastructure.persistence.repository`

```java
public interface FrontendErrorEventRepository
        extends JpaRepository<FrontendErrorEvent, UUID> {

    boolean existsByClientEventId(String clientEventId);

    Page<FrontendErrorEvent> findAll(Specification<FrontendErrorEvent> spec, Pageable pageable);

    @Modifying
    @Query("DELETE FROM FrontendErrorEvent e WHERE e.clientTimestamp < :cutoff")
    int deleteOlderThan(@Param("cutoff") Instant cutoff);
}
```

### Application Services

| Service                         | Verantwortung                                                                |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `FrontendErrorIngestionService` | Batch annehmen, Dedup per `client_event_id`, Felder extrahieren, `saveAll()` |
| `FrontendErrorQueryService`     | JPA Specifications für Filter, Pagination, Stats-Aggregation                 |

### Controller

| Controller                  | Pfad                                           | Auth          |
| --------------------------- | ---------------------------------------------- | ------------- |
| `MonitoringErrorController` | `/api/v1/monitoring/errors`                    | `permitAll()` |
| `AdminMonitoringController` | `/api/v1/admin/monitoring/errors`, `.../stats` | `ROLE_ADMIN`  |

### Security Config Änderung

In `SecurityConfig.java` muss `/api/v1/monitoring/errors` zur `permitAll()`-Liste hinzugefügt werden.

### Retention Cleanup Job

Folgt dem `RefreshTokenCleanupJob`-Pattern:

```java
@Scheduled(cron = "${app.monitoring.error-cleanup-cron:0 0 3 * * *}")
public void cleanup() {
    Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
    int deleted = repository.deleteOlderThan(cutoff);
    log.info("Deleted {} frontend error events older than 30 days", deleted);
}
```

---

## Frontend-Integration

### Flush-Mechanismus (`src/lib/error-store.ts`)

Der Error-Store wird um einen Flush-Mechanismus erweitert:

1. **Session-ID:** Einmal pro Tab via `sessionStorage` generiert
2. **Timer-Flush:** Alle 30 Sekunden werden unflushed Events als Batch gesendet
3. **Threshold-Flush:** Bei 20+ ungefluschten Events sofort senden
4. **Beforeunload-Flush:** `navigator.sendBeacon()` oder `fetch({ keepalive: true })` für restliche Events beim Schließen
5. **Backoff:** Exponential Backoff bei Fehlern (30s → 60s → 120s → max 5min)
6. **Truncation:** Stack auf 8 KB, Message auf 2000 Zeichen vor dem Senden

**Wichtig — Circular Dependency vermeiden:**

Der Flush muss einen **direkten `fetch()`-Aufruf** verwenden, nicht `apiRequest()`. Grund: `apiRequest()` meldet Fehler an `errorStore.report()`, was bei einem fehlgeschlagenen Flush eine Endlosschleife auslösen würde:

```
flush() → apiRequest() → Netzwerk-Fehler → errorStore.report() → flush() → ...
```

Stattdessen:

```typescript
// Im error-store.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

async function flushToBackend(events: FrontendErrorEvent[]): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/v1/monitoring/errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId: getOrCreateSessionId(), events }),
    })
  } catch {
    // Silently fail — events bleiben im Buffer für den nächsten Versuch
  }
}
```

### Monitoring Service (`src/services/monitoring.service.ts`)

Neuer Service für die Admin-Dashboard-Endpoints:

```typescript
export const MonitoringService = {
  async getErrors(params: {
    page?: number
    size?: number
    severity?: string
    category?: string
    from?: string
    to?: string
  }): Promise<PagedResponse<PersistedErrorEvent>> {
    const qs = new URLSearchParams()
    if (params.page !== undefined) qs.set("page", String(params.page))
    if (params.size !== undefined) qs.set("size", String(params.size))
    if (params.severity) qs.set("severity", params.severity)
    if (params.category) qs.set("category", params.category)
    if (params.from) qs.set("from", params.from)
    if (params.to) qs.set("to", params.to)
    return apiRequest(`/api/v1/admin/monitoring/errors?${qs.toString()}`)
  },

  async getErrorStats(hours: number = 24): Promise<ErrorStoreStats> {
    return apiRequest(`/api/v1/admin/monitoring/errors/stats?hours=${hours}`)
  },
}
```

### Admin Dashboard Anpassungen

Das Admin-Dashboard (`src/components/features/admin/monitoring/`) wird umgestellt:

| Komponente               | Änderung                                            |
| ------------------------ | --------------------------------------------------- |
| `AdminMonitoring.tsx`    | Daten von `MonitoringService` statt `errorStore`    |
| `ErrorList.tsx`          | Server-side Pagination (page/size als Query-Params) |
| `HealthSummaryCards.tsx` | Stats von `MonitoringService.getErrorStats()`       |
| `ErrorTrendChart.tsx`    | Daten vom Backend                                   |

**Neuer Typ** in `src/types/error.ts`:

```typescript
export interface PersistedErrorEvent {
  id: string
  clientEventId: string
  sessionId: string | null
  severity: ErrorSeverity
  category: ErrorCategory
  message: string
  stack: string | null
  url: string | null
  apiPath: string | null
  statusCode: number | null
  component: string | null
  userId: string | null
  userAgent: string | null
  metadata: Record<string, unknown> | null
  clientTimestamp: string
  createdAt: string
}
```

---

## Mapping: Frontend → Backend

Das Frontend sendet Events im `FrontendErrorEvent`-Format. Das Backend extrahiert promoted Felder aus `metadata` und speichert den Rest als JSONB:

| Frontend Feld               | DB Spalte          | Transformation                    |
| --------------------------- | ------------------ | --------------------------------- |
| `id`                        | `client_event_id`  | Direkt übernommen                 |
| `timestamp`                 | `client_timestamp` | ISO-8601 → `TIMESTAMPTZ`          |
| `severity`                  | `severity`         | `"high"` → `"HIGH"` (toUpperCase) |
| `category`                  | `category`         | `"api"` → `"API"` (toUpperCase)   |
| `message`                   | `message`          | Truncate auf 2000 Zeichen         |
| `stack`                     | `stack`            | Truncate auf 8 KB                 |
| `metadata.url`              | `url`              | Extrahiert aus metadata           |
| `metadata.apiPath`          | `api_path`         | Extrahiert aus metadata           |
| `metadata.statusCode`       | `status_code`      | Extrahiert aus metadata           |
| `metadata.component`        | `component`        | Extrahiert aus metadata           |
| `metadata.userId`           | `user_id`          | Extrahiert, String → UUID         |
| `metadata.userAgent`        | `user_agent`       | Extrahiert aus metadata           |
| Restliche `metadata.*`      | `metadata`         | Als JSONB gespeichert             |
| (Request-Level) `sessionId` | `session_id`       | Direkt übernommen                 |

---

## Retention Policy

- **Aufbewahrung:** 30 Tage (konfigurierbar via `app.monitoring.error-cleanup-cron`)
- **Cleanup:** Täglicher `@Scheduled`-Job um 03:00 Uhr
- **Basis:** `client_timestamp` (Zeitpunkt des Fehlers, nicht der Persistierung)
- **Index:** `idx_fee_client_ts` unterstützt effizientes `DELETE WHERE client_timestamp < cutoff`

---

## Sicherheit

| Aspekt                  | Maßnahme                                                                |
| ----------------------- | ----------------------------------------------------------------------- |
| **Ingestion Auth**      | `permitAll()` — Fehler treten auch vor dem Login auf                    |
| **Rate Limiting**       | Max 10 Requests/Minute pro IP auf `/api/v1/monitoring/errors`           |
| **Payload-Größe**       | Max 50 Events pro Batch, Message max 2000 Zeichen, Stack max 8 KB       |
| **Admin-Abfrage**       | `ROLE_ADMIN` erforderlich für Query- und Stats-Endpoints                |
| **SQL Injection**       | Parameterized Queries via JPA Specifications                            |
| **XSS**                 | Keine Felder werden als HTML gerendert — reine Textanzeige im Dashboard |
| **Kein FK auf `users`** | Keine kaskadierenden Löschungen, kein Datenleck über Join               |
