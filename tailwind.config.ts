import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Elysion Website Design System v1.3 — drei Stimmen (Guide 01)
      fontFamily: {
        sans: ["var(--font-body)", "Bricolage Grotesque", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Bricolage Grotesque", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Newsreader", "serif"],
        heading: ["var(--font-heading)", "Schibsted Grotesk", "ui-sans-serif", "sans-serif"],
        eyebrow: ["var(--font-eyebrow)", "Hanken Grotesk", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "Spline Sans Mono", "ui-monospace", "monospace"],
      },
      // Genau fünf Textstufen (Guide 01 · Desktop-Werte; T/M über globals.css)
      fontSize: {
        display: ["4.75rem", { lineHeight: "1.05", letterSpacing: "-0.015em", fontWeight: "400" }],
        h2: ["3rem", { lineHeight: "1.08", letterSpacing: "-0.025em", fontWeight: "700" }],
        h3: ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "700" }],
        body: ["1.0625rem", { lineHeight: "1.55" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.09em" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Vier Farben, ein Grün (Guide 02) — verbindliche Marken-Tokens
        ink: {
          DEFAULT: "#16201A",
          900: "#16201A",
          700: "#34403A",
          muted: "#5D6B63",
        },
        sand: {
          DEFAULT: "#F4EEDF",
          page: "#F4EEDF",
          surface: "#EFE7D2",
        },
        green: {
          DEFAULT: "#58B24A",
          50: "#EEF8EC",
          500: "#58B24A",
          600: "#45963A",
          700: "#357A2E",
        },
        // Funktionsfarben — nur Systemzustände (Guide 02)
        success: { DEFAULT: "#45963A", tint: "#D8F0D1" },
        warning: { DEFAULT: "#C98A1E", tint: "#F6E6C4" },
        danger: { DEFAULT: "#C5453B", tint: "#F4D9D6" },
        info: { DEFAULT: "#3B6E8F", tint: "#DCE7EE" },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Vier Radius-Stufen (Guide 03): 8 Medien · 12 Buttons/Inputs · 16 Karten · Pill
        xl: "0.75rem",
        "2xl": "1rem",
      },
      // Elevation — zwei Schatten, immer Ink-getönt (Guide 03)
      boxShadow: {
        card: "0 20px 50px rgba(22,32,26,.12)",
        float: "0 30px 70px rgba(22,32,26,.18)",
        focus: "0 0 0 3px rgba(88,178,74,.32)",
      },
      // Motion — 180–240 ms (Guide 03)
      transitionTimingFunction: {
        brand: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      },
      keyframes: {
        "bounce-subtle": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // fade-up lebt ausschließlich in globals.css (#83) — dort inkl. der
        // Stagger-Varianten .animate-fade-up-1/2/3, die es hier nie gab. Alle
        // Verwendungen sind einfache Klassen (keine Tailwind-Varianten).
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "bounce-subtle": "bounce-subtle 0.3s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.3s ease-out both",
      },
    },
  },
  plugins: [],
}

export default config
