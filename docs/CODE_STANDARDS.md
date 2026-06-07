# Code-Standards

> Konventionen für das Elysion Frontend-Repo (Next.js 16, React 18, TypeScript).

---

## Namenskonventionen

| Was                    | Stil        | Beispiel                                            |
| ---------------------- | ----------- | --------------------------------------------------- |
| Komponenten (Dateien)  | PascalCase  | `ProductCard.tsx`, `CheckoutForm.tsx`               |
| Services (Dateien)     | camelCase   | `auth.service.ts`, `order.service.ts`               |
| Hooks (Dateien)        | camelCase   | `useAuth.ts`, `useCart.ts`                          |
| Typen & Interfaces     | PascalCase  | `User`, `ProductPage`, `ApiError`                   |
| Variablen & Funktionen | camelCase   | `accessToken`, `fetchOrders()`                      |
| Kontexte               | PascalCase  | `AuthContext.tsx`, `CartContext.tsx`                |
| Imports (Alias)        | `@/src/...` | `import { apiRequest } from "@/src/lib/api-client"` |

---

## Dateiorganisation

Siehe Projektstruktur in [`README.md`](../README.md#project-structure).

**Faustregel:** Neue Domäne → neues Service-File + neues Feature-Verzeichnis unter `components/features/`.

---

## API-Client

Alle Backend-Requests gehen ausnahmslos über `src/lib/api-client.ts`.

Beispiel: siehe [`docs/api-integration.md`](./api-integration.md) — dort ist das Service-Pattern als primäre Referenz dokumentiert.

**Nie direkt `fetch()` aufrufen** — der API-Client übernimmt Token-Handling, 401-Retry und Error-Wrapping.

**Response-Envelope:** Das Backend gibt `{ status, message, data }` zurück — `apiRequest` gibt direkt `data` zurück.
**204 No Content** → gibt `null` zurück.
**Fehler** werfen `ApiError(status, message)`.

---

## Fehlerbehandlung

```typescript
import { ApiError } from "@/src/lib/api-client"

try {
  const order = await OrderService.getOrder(id)
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      // Benutzerfreundliche Meldung anzeigen
    }
    console.error("API error:", error.message)
  }
}
```

- Fehler **immer** explizit behandeln — kein stilles Swallowing
- UI-facing: benutzerfreundliche Fehlermeldung anzeigen (z.B. via `sonner` Toast)
- Nie rohe Error-Objekte oder Stack-Traces dem Nutzer zeigen

---

## TypeScript

- **Alle Typen** sind in [`src/types/index.ts`](../src/types/index.ts) definiert — keine lokalen Ad-hoc-Typen für wiederverwendbare Strukturen
- `any` ist verboten — bei unbekannten Strukturen `unknown` verwenden und narrowen
- Bekannte Backend-Abweichungen beachten (siehe [`CLAUDE.md`](../CLAUDE.md#bekannte-abweichungen-frontend--backend)):
  - Produktliste gibt Spring-`Page` zurück → `ProductPage` statt `PagedResponse<T>` verwenden

---

## Komponenten-Patterns

```typescript
// ✅ Props explizit typen
interface ProductCardProps {
  product: Product
  onAddToCart: (id: number) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // ...
}
```

- Keine Mutations an Props oder externem State
- Kein direktes `localStorage` — Auth-Token wird im Modul-Memory gehalten (XSS-sicher)
- `useAuth()` und `useCart()` für globalen State verwenden

---

## Auth-Zugriff in Komponenten

```typescript
import { useAuth } from "@/src/context/AuthContext"

export function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <Skeleton />
  if (!isAuthenticated) return <LoginPrompt />

  return <div>Hallo, {user?.firstName}</div>
}
```

---

## Testing

**Framework:** Vitest + @testing-library/react
**Coverage-Ziel:** Bestehende Coverage (~97%) nicht senken
**Test-Dateien:** Co-located, z.B. `auth.service.test.ts` neben `auth.service.ts`

```typescript
// Aufbau: Arrange → Act → Assert
it("should return null when cart is empty", async () => {
  // Arrange
  const mockApiRequest = vi.fn().mockResolvedValue([])

  // Act
  const result = await CartService.getCart()

  // Assert
  expect(result).toHaveLength(0)
})
```

**Test-Naming:** `"should [erwartetes Verhalten] when [Bedingung]"`

**Was getestet wird:**

- Service-Methoden (alle)
- Custom Hooks
- Utility-Funktionen (`lib/`)
- Kontexte (AuthContext, CartContext)

---

## Sicherheit

- Keine Secrets, API-Keys oder Passwörter in den Code oder in Git
- Environment-Variablen für alle externen Werte (`NEXT_PUBLIC_API_URL`)
- Kein `dangerouslySetInnerHTML` ohne explizite Sanitisierung
- User-Input validieren vor API-Calls (Zod-Schemas in `lib/validation.ts`)
