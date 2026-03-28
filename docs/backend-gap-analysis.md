# Backend Gap-Analyse — Aus Frontend-Perspektive

Stand: 2026-03-24

Dieses Dokument beschreibt welche Backend-Endpunkte noch nicht existieren oder fehlerhaft sind,
und wie das das Frontend direkt betrifft.

---

## Kritische Blocker (P0 — sofort beheben)

| Problem                                                       | Auswirkung auf Frontend                                                     | Betroffene Datei                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------- |
| **Email-Verification-Link zeigt auf Backend** (roher JSON)    | `EmailVerification.tsx` empfängt Token aber Nutzer kann Link nicht aufrufen | `AuthEmailService.java`                   |
| **Password-Reset-Link zeigt auf Backend** (roher JSON)        | `ResetPassword.tsx` nie erreichbar                                          | `AuthEmailService.java`                   |
| **Email-Constraint-Bug** (lehnt `name.surname@domain.com` ab) | Registrierung schlägt für ~20% aller Geschäfts-Emails fehl                  | `V2__auth_schema.sql` → neue Migration    |
| **Login-Response enthält kein `user`-Objekt**                 | `AuthContext` muss nach Login extra `GET /users/me` aufrufen                | `AuthService.java`, `AuthController.java` |
| **Refresh-Token Race Condition**                              | Sicherheitslücke — 2 gültige Access Tokens gleichzeitig möglich             | `AuthService.java`                        |

---

## Modul 02 — Product Management: KOMPLETT FEHLEND

Das ist der größte Backend-Blocker. Kein einziger Produkt-Endpunkt existiert.

### Was im Frontend bereit ist, aber kein Backend hat:

| Frontend-Komponente / Service           | Aufgerufener Endpunkt                 | Backend-Status         |
| --------------------------------------- | ------------------------------------- | ---------------------- |
| `ProductDetail.tsx`                     | `GET /api/v1/products/{slug}`         | ❌ Nicht implementiert |
| `SustainableShop.tsx`                   | `GET /api/v1/products`                | ❌ Nicht implementiert |
| `SellerDashboard.tsx` (Produkt anlegen) | `POST /api/v1/products`               | ❌ Nicht implementiert |
| `SellerDashboard.tsx` (Status ändern)   | `PATCH /api/v1/products/{id}/status`  | ❌ Nicht implementiert |
| `ProductForm.tsx` (Bild hochladen)      | `POST /api/v1/products/{id}/images`   | ❌ Nicht implementiert |
| `ProductForm.tsx` (Variante anlegen)    | `POST /api/v1/products/{id}/variants` | ❌ Nicht implementiert |

**Konsequenz:** `ProductDetail.tsx` nutzt aktuell 100% Mockdaten (hardcodiertes Produkt "Organic Cotton T-Shirt").

### Was zu tun ist (Backend):

- `ProductController` mit allen CRUD-Endpoints implementieren
- `ProductService`, `VariantService`, `SlugService` implementieren
- Status-Machine enforzen (DRAFT → REVIEW → ACTIVE)
- Inventory-Reservierungs-Logik

### Was zu tun ist (Frontend — nach Backend bereit):

- `ProductDetail.tsx`: `ProductService.getBySlug(slug)` aus URL-Params aufrufen
- `SustainableShop.tsx`: Echte Produktliste ist bereits verdrahtet ✅
- `SellerDashboard.tsx`: `ProductForm` Dialog verdrahten (Komponente existiert bereits)

---

## Modul 04 — Matching Engine: KOMPLETT FEHLEND

### Was im Frontend bereit ist:

| Komponente                  | Aufgerufener Endpunkt         | Backend-Status         |
| --------------------------- | ----------------------------- | ---------------------- |
| `RecommendationsWidget.tsx` | `GET /api/v1/recommendations` | ❌ Nicht implementiert |

Das Widget ist vollständig implementiert und zeigt sich für eingeloggte BUYERs automatisch.
Es silently failed wenn der Endpunkt nicht antwortet — zeigt einfach nichts an.

### Was Backend implementieren muss:

- `GET /api/v1/recommendations` → Top-N Produkte nach Match-Score zurückgeben
- Match-Score aus Buyer Value Profile + Produkt-Zertifikaten berechnen
- Caching für Performance

---

## API-Abweichungen (Pfade / Response-Struktur)

| Endpunkt                                 | Problem                                                               | Fix                            |
| ---------------------------------------- | --------------------------------------------------------------------- | ------------------------------ |
| `PATCH /users/me/addresses/{id}/default` | Falscher Pfad — Frontend erwartet `/set-default`                      | Pfad in Controller korrigieren |
| `GET /users/me/profile`                  | Gibt `firstName`, `lastName`, `phone` zurück statt Werteprofil-Objekt | Response-DTO korrigieren       |
| `POST /auth/login`                       | Response fehlt `user`-Objekt                                          | `LoginResponse` DTO anpassen   |

---

## Vollständige Endpunkt-Matrix

### Auth — `/api/v1/auth/*`

| Endpunkt                         | Frontend nutzt                   | Backend-Status | Anmerkung                       |
| -------------------------------- | -------------------------------- | -------------- | ------------------------------- |
| `POST /auth/register`            | ✅ `AuthService.register()`      | ✅ OK          | Email-Constraint-Bug!           |
| `POST /auth/login`               | ✅ `AuthService.login()`         | ✅ OK          | `user`-Objekt fehlt in Response |
| `POST /auth/refresh`             | ✅ `AuthContext` (auto)          | ✅ OK          | Race Condition!                 |
| `POST /auth/logout`              | ✅ `AuthService.logout()`        | ✅ OK          |                                 |
| `POST /auth/verify-email`        | ✅ `AuthService.verifyEmail()`   | ✅ OK          | Link-Bug!                       |
| `POST /auth/forgot-password`     | ⚠️ Service bereit, kein UI       | ✅ OK          |                                 |
| `POST /auth/reset-password`      | ✅ `AuthService.resetPassword()` | ✅ OK          | Link-Bug!                       |
| `POST /auth/resend-verification` | ⚠️ TODO-Kommentar im Code        | ❌ Fehlt       |                                 |

### User — `/api/v1/users/me/*`

| Endpunkt                                     | Frontend nutzt                         | Backend-Status    | Anmerkung                                   |
| -------------------------------------------- | -------------------------------------- | ----------------- | ------------------------------------------- |
| `GET /users/me`                              | ✅ `UserService.getCurrentUser()`      | ✅ OK             |                                             |
| `PATCH /users/me`                            | ✅ `UserService.updateMe()`            | ✅ OK             |                                             |
| `DELETE /users/me`                           | ⚠️ Service bereit, kein UI             | ✅ OK             |                                             |
| `GET /users/me/profile`                      | ✅ `BuyerValueProfileService.get()`    | ⚠️ Falsche Felder | Gibt `firstName/lastName` statt Werteprofil |
| `PUT /users/me/profile`                      | ✅ `BuyerValueProfileService.upsert()` | ⚠️ Evtl. Probleme | Werteprofil-Endpoint prüfen                 |
| `GET /users/me/addresses`                    | ✅ `AddressService.getAll()`           | ✅ OK             |                                             |
| `POST /users/me/addresses`                   | ⚠️ Service bereit, UI teils            | ✅ OK             |                                             |
| `PATCH /users/me/addresses/{id}`             | ⚠️ Service bereit, UI teils            | ✅ OK             |                                             |
| `PATCH /users/me/addresses/{id}/set-default` | ⚠️ Service bereit                      | ⚠️ Pfad-Mismatch  | Backend hat `/default` statt `/set-default` |
| `DELETE /users/me/addresses/{id}`            | ⚠️ Service bereit, UI teils            | ✅ OK             |                                             |

### Products — `/api/v1/products/*`

| Endpunkt                               | Frontend nutzt                     | Backend-Status | Anmerkung                 |
| -------------------------------------- | ---------------------------------- | -------------- | ------------------------- |
| `GET /products`                        | ✅ `ProductService.list()`         | ❌ FEHLT       |                           |
| `GET /products/{slug}`                 | ❌ NICHT AUFGERUFEN                | ❌ FEHLT       | ProductDetail nutzt Mock! |
| `POST /products`                       | ⚠️ Service bereit                  | ❌ FEHLT       |                           |
| `PATCH /products/{id}`                 | ⚠️ Service bereit                  | ❌ FEHLT       |                           |
| `PATCH /products/{id}/status`          | ✅ `ProductService.updateStatus()` | ❌ FEHLT       |                           |
| `POST /products/{id}/images`           | ⚠️ Service bereit                  | ❌ FEHLT       |                           |
| `DELETE /products/{id}/images/{imgId}` | ⚠️ Service bereit                  | ❌ FEHLT       |                           |
| `POST /products/{id}/variants`         | ⚠️ Service bereit                  | ❌ FEHLT       |                           |

### Certificates — `/api/v1/certificates/*`

| Endpunkt                           | Frontend nutzt | Backend-Status | Anmerkung                 |
| ---------------------------------- | -------------- | -------------- | ------------------------- |
| `GET /certificates`                | ❌ Kein UI     | ✅ OK          | CertificateService bereit |
| `POST /certificates`               | ❌ Kein UI     | ✅ OK          | CertificateService bereit |
| `PATCH /certificates/{id}`         | ❌ Kein UI     | ✅ OK          |                           |
| `GET /products/{id}/certificates`  | ❌ Kein UI     | ✅ OK          | Nicht auf Produktseite    |
| `POST /products/{id}/certificates` | ❌ Kein UI     | ✅ OK          |                           |

### Cart & Checkout

| Endpunkt                  | Frontend nutzt                  | Backend-Status |
| ------------------------- | ------------------------------- | -------------- |
| `GET /cart`               | ✅ `CartService.get()`          | ✅ OK          |
| `POST /cart/items`        | ✅ `CartContext.addItem()`      | ✅ OK          |
| `PATCH /cart/items/{id}`  | ✅ `CartContext.updateItem()`   | ✅ OK          |
| `DELETE /cart/items/{id}` | ✅ `CartContext.removeItem()`   | ✅ OK          |
| `POST /checkout`          | ✅ `CheckoutService.preview()`  | ✅ OK          |
| `POST /checkout/complete` | ✅ `CheckoutService.complete()` | ✅ OK          |

### Orders

| Endpunkt                         | Frontend nutzt                            | Backend-Status |
| -------------------------------- | ----------------------------------------- | -------------- |
| `GET /orders`                    | ✅ `OrderService.list()`                  | ✅ OK          |
| `GET /orders/{id}`               | ✅ `OrderService.getById()`               | ✅ OK          |
| `GET /seller/orders`             | ✅ `SellerOrderService.list()`            | ✅ OK          |
| `PATCH /seller/orders/{id}/ship` | ✅ `SellerOrderService.ship()`            | ✅ OK          |
| `GET /seller/orders/settlements` | ✅ `SellerOrderService.listSettlements()` | ✅ OK          |

### Payments & Files

| Endpunkt                       | Frontend nutzt             | Backend-Status | Anmerkung                 |
| ------------------------------ | -------------------------- | -------------- | ------------------------- |
| `POST /payments/create-intent` | ❌ Hardcoded MOCK          | ✅ OK          | Payment Integration fehlt |
| `POST /files/upload`           | ❌ Kein UI verdrahtet      | ✅ OK          | FileService bereit        |
| `GET /files/{id}/content`      | ⚠️ Für img src             | ✅ OK          |                           |
| `GET /recommendations`         | ✅ `RecommendationService` | ❌ FEHLT       | Widget wartet darauf      |

### Admin

| Endpunkt                                   | Frontend nutzt                             | Backend-Status |
| ------------------------------------------ | ------------------------------------------ | -------------- |
| `GET /admin/users`                         | ✅ `AdminService.listUsers()`              | ✅ OK          |
| `GET /admin/users/{id}`                    | ✅ `AdminService.getUser()`                | ✅ OK          |
| `POST /admin/seller-profiles/{id}/approve` | ✅                                         | ✅ OK          |
| `POST /admin/seller-profiles/{id}/reject`  | ✅                                         | ✅ OK          |
| `PATCH /admin/users/{id}/suspend`          | ⚠️ Service bereit, Button nicht verdrahtet | ✅ OK          |
| `PATCH /admin/users/{id}/activate`         | ⚠️ Service bereit, Button nicht verdrahtet | ✅ OK          |

---

## Priorisierte Frontend-TODOs (nach Backend-Fixes)

### Sofort (nach P0 Backend-Fixes):

1. `ProductDetail.tsx`: `ProductService.getBySlug(slug)` aus URL-Params aufrufen
2. Echte Varianten-Auswahl + Add-to-Cart mit echter `variantId`

### Vor Launch:

3. `SellerDashboard.tsx`: `ProductForm` Dialog einbinden (Komponente existiert)
4. `FileService.uploadAndLink()` in `ProductForm` einbinden (Bild-Upload)
5. `CertificateForm` Komponente erstellen + in `SellerDashboard` einbinden
6. `AddressService` CRUD vollständig in `Profil.tsx` verdrahten
7. Category-Filter: `selectedCategoryId` an `ProductService.list()` übergeben

### Nach Launch:

8. Stripe/PayPal Integration (Checkout MOCK ersetzen)
9. `RecommendationsWidget` wird automatisch funktionieren sobald Backend Modul 04 fertig ist
10. `AdminUserDetail.tsx`: `suspendUser`/`activateUser` Buttons verdrahten
11. `ProducerPage.tsx`: Mockdaten durch echten Seller-Profile-Endpunkt ersetzen

---

## Schnell-Referenz: Welche Endpunkte fehlen im Backend?

```
❌ GET  /api/v1/products                    (Produktliste)
❌ GET  /api/v1/products/{slug}             (Produktdetail)
❌ POST /api/v1/products                    (Produkt anlegen)
❌ PATCH /api/v1/products/{id}             (Produkt bearbeiten)
❌ PATCH /api/v1/products/{id}/status      (Status ändern)
❌ POST /api/v1/products/{id}/images       (Bild hinzufügen)
❌ DELETE /api/v1/products/{id}/images/{id} (Bild löschen)
❌ POST /api/v1/products/{id}/variants     (Variante anlegen)
❌ GET  /api/v1/recommendations            (Matching Engine)
❌ POST /api/v1/auth/resend-verification   (Verification erneut senden)
```

Und folgende Endpunkte haben Bugs/Abweichungen:

```
⚠️ POST /api/v1/auth/login                 (fehlender user in Response)
⚠️ GET  /api/v1/users/me/profile           (falsche Felder — kein Werteprofil)
⚠️ PATCH /users/me/addresses/{id}/default  (Pfad-Mismatch: /default vs /set-default)
⚠️ POST /api/v1/auth/verify-email          (Link-Bug: zeigt auf Backend statt Frontend)
⚠️ POST /api/v1/auth/reset-password        (Link-Bug: zeigt auf Backend statt Frontend)
```
