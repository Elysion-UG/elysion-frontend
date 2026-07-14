# Elysion Website Design System v1.3 — Umsetzung

Diese Datei dokumentiert, wie das verbindliche **Elysion Website Design System
v1.3** im Frontend umgesetzt ist, und hält — wie vom Guide (Abschnitt 07
Governance) gefordert — die bewussten **Abweichungen vom Basissystem** fest.

## Tokens (Quelle der Wahrheit)

Farben, Schriften, Radien, Schatten und Motion sind zentral definiert:

- **`src/app/globals.css`** — semantische HSL-Tokens (`--background`, `--foreground`,
  `--primary`, `--card`, `--border`, `--ring`, `--destructive`, …) für Light und
  den abgeleiteten Dark-Modus, plus Basis-Typografie der fünf Textstufen.
- **`tailwind.config.ts`** — Marken-Utilities: `ink` (900/700/muted), `sand`
  (page/surface), `green` (50/500/600/700), Funktionsfarben `success`/`warning`/
  `danger`/`info` (+ `-tint`); `fontFamily` (`display`/`heading`/`sans`/`eyebrow`/
  `mono`), `fontSize`-Stufen, `boxShadow` (`card`/`float`/`focus`), Radius 12/16,
  Motion-Timing `ease-brand`.

### Palette (Guide 02)

| Rolle                    | Hex                                                                      |
| ------------------------ | ------------------------------------------------------------------------ |
| Ink (Text/Überschriften) | `#16201A` (Fließtext `#34403A`, Meta `#5D6B63`)                          |
| Sand · Seite / Fläche    | `#F4EEDF` / `#EFE7D2`                                                    |
| Grün (CTA/Nachweis)      | `#58B24A` (Hover `#45963A`, Press `#357A2E`, Tint `#EEF8EC`)             |
| Funktionsfarben          | Erfolg `#45963A` · Warnung `#C98A1E` · Fehler `#C5453B` · Info `#3B6E8F` |

### Schriften (Guide 01)

Newsreader (H1/Display) · Schibsted Grotesk (H2/H3) · Bricolage Grotesque
(Body/UI) · Hanken Grotesk (Eyebrow) · Spline Sans Mono (Mono-Daten).

### Logo (Guide 00)

`src/components/shared/BrandLogo.tsx` — Balken-Zeichen (Ink/Grün/Ink) + Wortmarke;
`inverted` für Ink-Flächen. Das frühere **Leaf-Motiv ist ausgemustert**.

## Abweichungen vom Elysion-Basissystem

1. **Dark Mode** ist im Guide **nicht** spezifiziert. Die App behält einen
   Dark-Modus und leitet dessen Tokens bewusst aus **Ink `#16201A`** ab
   (Flächen = Ink-Stufen, Text = Sand-Hell, Grün bleibt Primary). Der
   **Admin-Bereich** ist eine dauerhaft dunkle Oberfläche und wird über die
   `dark`-Klasse an der `AdminShell`-Wurzel auf diese Ink-Dark-Tokens gesetzt.
2. **`font-mono` (Spline Sans Mono)** wird über den Guide hinaus für tabellarische
   Daten (Bestell-/SKU-/Tracking-Nummern, IDs, Kennzahlen) verwendet — als
   Lesbarkeits-Hilfe, nicht als Marken-Stimme.
3. **Button-Radius 12** statt Pill (gewählte Optik 2a, wie in der Guide-Fußnote
   vorgesehen).

Weitere bewusste Abweichungen sind hier zu ergänzen (mit neuer Versionsnummer),
stille Abweichungen gelten als Fehler.

## Konformitäts-Checks (Batch-8-Audit)

Vor dem Merge stilrelevanter Änderungen sollten diese Greps **leer** sein
(Produktionscode, ohne Tests):

```bash
# Keine Fremdpaletten
grep -rE '\b(text|bg|border|ring|from|to|via|fill|stroke)-(sage|bark|cyber|teal|emerald|amber|slate|zinc|neutral|stone|sky|blue|indigo|purple|pink|rose|violet|fuchsia|lime|yellow|orange)-[0-9]{2,3}' src --include=*.tsx --include=*.ts | grep -v '.test.'
# Kein Leaf-Motiv, kein Pure-Black, keine Cyan-/Glow-Reste
grep -rnE '\bLeaf\b|bg-black|rgba\(6,182,212|shadow-\[0_0_[0-9]' src --include=*.tsx | grep -v '.test.'
```
