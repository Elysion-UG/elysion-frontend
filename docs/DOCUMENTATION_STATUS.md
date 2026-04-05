# Dokumentationsstatus

**Stand:** 2026-04-05
**Status:** Aktuell

---

## Aktive Dokumentation

| Datei                     | Inhalt                                                                           | Status     |
| ------------------------- | -------------------------------------------------------------------------------- | ---------- |
| `README.md`               | Projekt-Übersicht, Setup, Architektur, implementierte Module                     | ✅ Aktuell |
| `CONTRIBUTING.md`         | Branch-Strategie, Commit-Konventionen, PR-Prozess, CI-Übersicht, Bun-Setup       | ✅ Aktuell |
| `docs/api-integration.md` | Vollständige API-Integrations-Referenz (alle Endpoints, DTOs, Fehlerbehandlung)  | ✅ Aktuell |
| `docs/BACKEND_QUIRKS.md`  | Bekannte Abweichungen Backend-Response vs. Frontend-Typen                        | ✅ Aktuell |
| `docs/CODE_STANDARDS.md`  | Namenskonventionen, Architekturmuster, Code-Review-Checkliste                    | ✅ Aktuell |
| `docs/CICD_PIPELINE.md`   | GitHub Actions Workflows, Quality Gates, Pre-commit Hooks                        | ✅ Aktuell |
| `docs/ROADMAP.md`         | Entwicklungs-Roadmap — Phase 1 abgeschlossen, Phase 2 geplant                    | ✅ Aktuell |
| `docs/INDEX.md`           | Topic → SSOT Referenzkarte für Mitwirkende                                       | ✅ Aktuell |
| `docs/monitoring-api.md`  | Spezifikation: Backend-Persistenz für Frontend-Fehler (noch nicht implementiert) | 📋 Geplant |

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

## Implementierungsstand (Stand: 2026-03-28)

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
| Payments (Mock)            | ✅      | ✅  | —     |

**Testabdeckung:** ~97% (266 Tests)

### Phase 2 — Geplant

- Stripe-Zahlungsintegration (`PaymentService` ist vorbereitet)
- Skeleton-Loading-States: SustainableShop ✅ done; Cart, Orders, OrderDetail, Checkout noch ausstehend
- Toast-Abdeckung SellerDashboard vervollständigen
- Guest Checkout
- Wishlist / Favoriten
- Retouren- und Erstattungs-UI
- `POST /api/v1/auth/resend-verification` UI (wartet auf Backend-Implementierung)
