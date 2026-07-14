import { cn } from "@/src/lib/utils"

/**
 * BrandLogo — Elysion-Zeichen nach Website Design System v1.3, Guide 00.
 *
 * Balken-Zeichen „entgratet" (Mini-Rundung rx 2): Ink / Grün / Ink, Grün-Balken
 * verkürzt. Wortmarke in Schibsted Grotesk 600, Versalien +0.2em.
 * `inverted` stellt das Zeichen auf Ink-Flächen (Balken + Wortmarke in Sand-Hell).
 *
 * Das frühere Leaf-Motiv ist ausgemustert und darf nicht mehr verwendet werden.
 */
type BrandLogoProps = {
  /** `lockup` = Zeichen + Wortmarke, `mark` = Zeichen solo (App-Icon/Favicon). */
  variant?: "lockup" | "mark"
  /** Auf Ink-Fläche: Balken und Wortmarke in Sand-Hell statt Ink. */
  inverted?: boolean
  /** Kantenlänge des Zeichens in px (Mindestgröße 18 im Lockup, 14 solo). */
  markSize?: number
  className?: string
}

export function BrandLogo({
  variant = "lockup",
  inverted = false,
  markSize = 20,
  className,
}: BrandLogoProps) {
  const barClass = inverted ? "fill-sand-page" : "fill-ink-900"
  const wordClass = inverted ? "text-sand-page" : "text-ink-900"

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="26 26 44 44"
        width={markSize}
        height={markSize}
        aria-hidden="true"
        focusable="false"
        className="shrink-0"
      >
        <rect x="26" y="26" width="44" height="9" rx="2" className={barClass} />
        <rect x="26" y="43.5" width="30" height="9" rx="2" className="fill-green-500" />
        <rect x="26" y="61" width="44" height="9" rx="2" className={barClass} />
      </svg>
      {variant === "lockup" && (
        <span
          className={cn(
            "pl-[0.2em] font-heading text-[15px] font-semibold tracking-[0.2em]",
            wordClass
          )}
        >
          ELYSION
        </span>
      )}
    </span>
  )
}
