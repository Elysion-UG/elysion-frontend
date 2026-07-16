# Code-Standards

Konventionen für das Frontend-Repo. Architektur und Schichten:
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

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

**Faustregel:** Neue Domäne → neues Service-File + neues Feature-Verzeichnis unter
`components/features/`.

---

## API-Zugriff

Alle Backend-Requests gehen ausnahmslos über `src/lib/api-client.ts` — **nie direkt
`fetch()`**. Der Client übernimmt Token-Handling, 401-Retry und Error-Wrapping.
Vertrag, Envelope-Verhalten und Fehlerbehandlung:
[`api-integration.md`](./api-integration.md). Bekannte Backend-Abweichungen:
[`BACKEND_QUIRKS.md`](./BACKEND_QUIRKS.md).

Fehler nie still schlucken. Dem Nutzer nie rohe Error-Objekte oder Stack-Traces
zeigen — stattdessen eine lesbare Meldung (`sonner`-Toast).

---

## TypeScript

- Typen liegen domänenweise in `src/types/` und werden über `index.ts` re-exportiert.
  Für wiederverwendbare Strukturen keine lokalen Ad-hoc-Typen.
- `any` ist verboten — bei unbekannten Strukturen `unknown` verwenden und narrowen.

---

## Komponenten

```typescript
interface ProductCardProps {
  product: Product
  onAddToCart: (id: number) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) { … }
```

- Props explizit typen, Interface direkt über der Komponente.
- Keine Mutationen an Props oder externem State.
- Kein direktes `localStorage` für Auth — der Token lebt im Modul-Memory (XSS-Schutz).
  Funktionale `localStorage`-Zugriffe brauchen Cookie-Consent (siehe
  [`COMPLIANCE.md`](./COMPLIANCE.md)).
- Globaler State über `useAuth()` / `useCart()`.

---

## Barrierefreiheit (a11y)

Verbindlich für **BFSG / WCAG 2.1 AA** (COMPLIANCE H9). Bei jedem UI-Change:

**Textkontrast (SC 1.4.3, ≥ 4,5:1 für Normal-/Kleintext):**

- Sekundär-/Fließtext auf hellem Grund: **mindestens `text-stone-500`** (= 4,8:1 auf
  Weiß). **Nie `text-stone-400` für Text** (~2,6:1 — fällt durch).
- Auf getöntem Grund (`bg-stone-100` o. ä.) reicht `stone-500` nicht (~4,4:1) →
  **`text-stone-600`** verwenden.
- Primärtext bleibt `text-stone-700`/`-800`; Hierarchie über 500 → 700 → 800 abbilden,
  nicht über 400.

**Schriftgröße:**

- Inhalts-Chips/Badges (Zertifikate, Kategorie, „Auf Lager", Filter-Zähler):
  **mindestens `text-xs`** — kein `text-[10px]`/`text-[11px]` für lesbaren Inhalt.
- Bewusst ausgenommen: rein numerische Zähler-Badges in Mini-Kreisen, Marken-/Logo-
  Untertitel und das dichte Admin-Monitoring-Dashboard (eigene, dunkle Palette).

**Modals/Dialoge:** `useFocusTrap(onClose)` anwenden (Fokus fangen, Escape schließt,
Fokus zurück zum Trigger), `role="dialog"` + `aria-modal="true"` +
`aria-labelledby`/`aria-label`, dekoratives Backdrop mit `aria-hidden="true"`.
Formular-Labels immer via `htmlFor`/`id` (oder `useId`) mit dem Feld verknüpfen.

---

## Tests

**Framework:** Vitest + @testing-library/react. Testdateien liegen neben der Quelle
(`auth.service.test.ts` neben `auth.service.ts`).

```typescript
// Aufbau: Arrange → Act → Assert
it("should return null when cart is empty", async () => {
  const result = await CartService.getCart()
  expect(result).toHaveLength(0)
})
```

**Benennung:** `"should [erwartetes Verhalten] when [Bedingung]"`

**Abgedeckt werden:** Service-Methoden, Custom Hooks, Utilities in `lib/`, Kontexte.

### Coverage-Schwellen

Maßgeblich ist `vitest.config.ts` — die Zahlen stehen nur dort und hier:

| Bereich                         | Lines | Functions | Branches | Statements |
| ------------------------------- | ----- | --------- | -------- | ---------- |
| Global                          | 22    | 25        | 17       | 22         |
| `src/lib/**`, `src/services/**` | 75    | 75        | 65       | 75         |
| `src/context/**`                | 70    | 70        | 60       | 70         |

Der globale Wert ist eine **No-Regression-Sperre**, kein Ziel: Feature-Komponenten
sind noch weitgehend ungetestet, deshalb liegt die Schwelle knapp unter dem
gemessenen Stand. Die Geschäftslogik-Schichten halten dagegen 75 %+. Kommen Tests
dazu, wird die globale Schwelle nachgezogen.

---

## Sicherheit

- Keine Secrets, API-Keys oder Passwörter im Code oder in Git.
- Externe Werte ausschließlich über Environment-Variablen (siehe
  [`.env.example`](../.env.example)).
- Kein `dangerouslySetInnerHTML` ohne explizite Sanitisierung.
- User-Input vor API-Calls validieren — Zod-Schemas in `src/lib/schemas.ts`
  (`src/lib/api-schemas.ts` prüft Backend-Responses). `src/lib/validation.ts` enthält
  die label-basierten Passwort-Regeln für Live-Hints, keine Schemas.
