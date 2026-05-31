# Dokumentationsstatus

**Stand:** 2026-05-31
**Status:** Aktuell

---

## Aktive Dokumentation

| Datei                      | Inhalt                                                                           | Status     |
| -------------------------- | -------------------------------------------------------------------------------- | ---------- |
| `docs/LAUNCH_READINESS.md` | Konsolidierter Launch-Stand FE+BE, offene Blocker und Findings (SSOT Go-Live)    | ✅ Aktuell |
| `docs/COMPLIANCE.md`       | Compliance-Plan DE/EU-Recht (DSGVO, Impressum, AGB, BFSG, UWG)                   | ✅ Aktuell |
| `README.md`                | Projekt-Übersicht, Setup, Architektur, implementierte Module                     | ✅ Aktuell |
| `CONTRIBUTING.md`          | Branch-Strategie, Commit-Konventionen, PR-Prozess, CI-Übersicht, Bun-Setup       | ✅ Aktuell |
| `docs/api-integration.md`  | Vollständige API-Integrations-Referenz (alle Endpoints, DTOs, Fehlerbehandlung)  | ✅ Aktuell |
| `docs/BACKEND_QUIRKS.md`   | Bekannte Abweichungen Backend-Response vs. Frontend-Typen                        | ✅ Aktuell |
| `docs/CODE_STANDARDS.md`   | Namenskonventionen, Architekturmuster, Code-Review-Checkliste                    | ✅ Aktuell |
| `docs/CICD_PIPELINE.md`    | GitHub Actions Workflows, Quality Gates, Pre-commit Hooks                        | ✅ Aktuell |
| `docs/ROADMAP.md`          | Entwicklungs-Roadmap — Phase 1 abgeschlossen, Phase 2 geplant                    | ✅ Aktuell |
| `docs/INDEX.md`            | Topic → SSOT Referenzkarte für Mitwirkende                                       | ✅ Aktuell |
| `docs/monitoring-api.md`   | Spezifikation: Backend-Persistenz für Frontend-Fehler (noch nicht implementiert) | 📋 Geplant |

---

## Archiv

Superseded und planungsphasenbezogene Dokumente (nicht mehr aktiv gepflegt):

| Datei                                     | Inhalt                                          |
| ----------------------------------------- | ----------------------------------------------- |
| `docs/archive/CODE_STANDARDS.md`          | Ursprüngliche Code-Standards (317 Zeilen)       |
| `docs/archive/API_SPECIFICATION.md`       | OpenAPI 3.0 Spezifikationsvorlage               |
| `docs/archive/CICD_PIPELINE.md`           | Ältere CI/CD-Dokumentation                      |
| `docs/archive/DEPLOYMENT_GUIDE.md`        | AWS-Infrastruktur-Entwurf (VPC, RDS, ECS, CDN)  |
| `docs/archive/MODULES_OVERVIEW.md`        | Modulliste mit Abhängigkeiten                   |
| `docs/archive/SYSTEM_OVERVIEW.md`         | Ältere Systemübersicht                          |
| `docs/archive/TECHNICAL_ARCHITECTURE.md`  | Systemdesign, Datenmodell, Architekturmuster    |
| `docs/archive/TESTING_STRATEGY.md`        | Test-Pyramide, Frameworks, Coverage-Richtlinien |
| `docs/archive/FUNCTIONAL_REQUIREMENTS.md` | Feature-Spezifikationen (Planungsphase)         |
| `docs/archive/PRODUCT_VISION.md`          | Geschäftsmodell, Zielgruppen (Planungsphase)    |
| `docs/archive/USER_STORIES.md`            | User Stories (Planungsphase)                    |

---

## Implementierungsstand (Stand: 2026-05-31)

> Vollständiger Launch-Status inkl. offener Blocker: [`LAUNCH_READINESS.md`](./LAUNCH_READINESS.md)

### Phase 1 — MVP ✅ Abgeschlossen

Alle 16 Backend-Module sind vollständig ins Frontend integriert:

| Modul                      | Service | UI  | Tests |
| -------------------------- | ------- | --- | ----- |
| Authentication             | ✅      | ✅  | ✅    |
| User Profile               | ✅      | ✅  | ✅    |
| Addresses                  | ✅      | ✅  | ✅    |
| Buyer Value Profile        | ✅      | ✅  | —     |
| Seller Profile             | ✅      | ✅  | —     |
| Seller Value Profile       | ✅      | ✅  | —     |
| Admin Panel                | ✅      | ✅  | ✅    |
| Products                   | ✅      | ✅  | ✅    |
| Categories                 | ✅      | ✅  | —     |
| Certificates               | ✅      | ✅  | —     |
| Cart                       | ✅      | ✅  | ✅    |
| Checkout                   | ✅      | ✅  | —     |
| Orders (Buyer + Seller)    | ✅      | ✅  | ✅    |
| Matching / Recommendations | ✅      | ✅  | —     |
| File Upload                | ✅      | ✅  | —     |
| Payments (Stripe)          | ✅      | ✅  | —     |

**Testabdeckung:** ~39 Unit-Test-Dateien + ~26 Playwright-E2E-Specs

### Phase 2 — Status

**Erledigt:**

- Stripe-Zahlungsintegration im Frontend (`PaymentStep.tsx`, Stripe Elements) — offen ist nur die Key-Konfiguration
- Skeleton-Loading-States: SustainableShop, Cart, OrderDetail, Checkout, Profil, Präferenzen
- Toast-Abdeckung SellerDashboard
- `POST /api/v1/auth/resend-verification` UI verdrahtet (Backend-Endpoint vorhanden)

**Offen (Auswahl, vollständig in `LAUNCH_READINESS.md`):**

- Public Seller-/Producer-Profil: ProducerPage läuft auf echten Produktdaten; optionaler reicher Profil-Endpoint im Backend offen
- Kontaktformular: `mailto:`-Fallback aktiv; optionaler Backend-Endpoint offen
- Monitoring-Persistenz
- Guest Checkout, Wishlist / Favoriten, Retouren-/Erstattungs-UI
