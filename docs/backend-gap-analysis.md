# Backend Gap-Analyse — Aus Frontend-Perspektive

Stand: 2026-03-28

---

## Verbleibende Lücken

| Endpunkt                                | Problem             | Auswirkung                                               |
| --------------------------------------- | ------------------- | -------------------------------------------------------- |
| `POST /api/v1/auth/resend-verification` | Nicht implementiert | Kein UI für "Verifikations-E-Mail erneut senden" möglich |

---

## Erledigte Punkte (zur Referenz)

Alle folgenden Punkte aus der ursprünglichen Analyse (Stand 2026-03-24) sind behoben:

| Bereich                         | War das Problem                       | Behoben                                                      |
| ------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| Email-Verification-Link         | Zeigte auf Backend (roher JSON)       | ✅ Zeigt jetzt auf `{FRONTEND_URL}/verify-email?token=...`   |
| Password-Reset-Link             | Zeigte auf Backend                    | ✅ Zeigt jetzt auf `{FRONTEND_URL}/reset-password?token=...` |
| Login-Response                  | Kein `user`-Objekt enthalten          | ✅ `AuthTokensResponse` enthält jetzt `UserInfo`             |
| Address-Default-Pfad            | `/default` vs `/set-default` Mismatch | ✅ Beide Pfade werden unterstützt                            |
| Products API (alle 9 Endpoints) | Komplett fehlend                      | ✅ Vollständig implementiert                                 |
| Matching / Recommendations      | `GET /api/v1/recommendations` fehlend | ✅ Implementiert mit Match-Score                             |
| Cart & Checkout                 | Fehlend                               | ✅ Vollständig implementiert                                 |
| Orders (Buyer + Seller)         | Fehlend                               | ✅ Vollständig implementiert                                 |
| Seller Settlements              | Fehlend                               | ✅ Vollständig implementiert                                 |
| File Upload                     | Fehlend                               | ✅ Vollständig implementiert                                 |
