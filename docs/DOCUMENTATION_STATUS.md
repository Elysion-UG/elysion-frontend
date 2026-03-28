# Dokumentationsstatus

**Stand:** 2026-03-28
**Status:** Aktuell

---

## Übersicht

Dieser Überblick zeigt den aktuellen Stand aller Projektdokumentationen.

---

## Vorhandene Dokumentation

| Datei                             | Inhalt                                                                          | Status          |
| --------------------------------- | ------------------------------------------------------------------------------- | --------------- |
| `README.md`                       | Projekt-Übersicht, Setup, Architektur, implementierte Module                    | ✅ Aktuell      |
| `docs/api-integration.md`         | Vollständige API-Integrations-Referenz (alle Endpoints, DTOs, Fehlerbehandlung) | ✅ Aktuell      |
| `docs/backend-gap-analysis.md`    | Offene Lücken zwischen Frontend-Erwartungen und Backend-Implementierung         | ✅ Aktuell      |
| `docs/FRONTEND_TODOS.md`          | Offene Frontend-Aufgaben (P5-1 Toasts, P5-2 Skeleton-States)                    | ✅ Aktuell      |
| `docs/ROADMAP.md`                 | Entwicklungs-Roadmap — Phase 1 abgeschlossen, Phase 2 geplant                   | ✅ Aktualisiert |
| `docs/TECHNICAL_ARCHITECTURE.md`  | Systemdesign, Datenmodell, Architekturmuster                                    | Referenz        |
| `docs/PRODUCT_VISION.md`          | Geschäftsmodell, Zielgruppen, Value-Profile-System                              | Referenz        |
| `docs/FUNCTIONAL_REQUIREMENTS.md` | Detaillierte Feature-Spezifikationen und Abnahmekriterien                       | Referenz        |
| `docs/USER_STORIES.md`            | User Stories für alle Rollen (Buyer, Seller, Admin)                             | Referenz        |
| `docs/TESTING_STRATEGY.md`        | Test-Pyramide, Frameworks, Coverage-Richtlinien                                 | Referenz        |
| `docs/CODE_STANDARDS.md`          | Namenskonventionen, Architekturmuster, Code-Review-Checkliste                   | Referenz        |
| `docs/CICD_PIPELINE.md`           | GitHub Actions, Branch-Strategie, Deployment-Stufen                             | Referenz        |
| `docs/DEPLOYMENT_GUIDE.md`        | AWS-Infrastruktur (VPC, RDS, ECS, CloudFront)                                   | Referenz        |
| `docs/SYSTEM_OVERVIEW.md`         | Vollständige Systemübersicht für Onboarding                                     | Referenz        |
| `docs/MODULES_OVERVIEW.md`        | Modulliste mit Abhängigkeiten                                                   | Referenz        |
| `docs/API_SPECIFICATION.md`       | OpenAPI 3.0 Spezifikationsvorlage                                               | Referenz        |

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
- Skeleton-Loading-States (Cart, Orders, OrderDetail, Checkout)
- Toast-Abdeckung SellerDashboard vervollständigen
- Guest Checkout
- Wishlist / Favoriten
- Retouren- und Erstattungs-UI
- `POST /api/v1/auth/resend-verification` UI (wartet auf Backend-Implementierung)
