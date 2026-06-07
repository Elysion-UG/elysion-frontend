import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["src/__integration__/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      // Two coverage scopes with separate thresholds:
      //   1. Business logic (lib/services/context/hooks) — stays at ~80% strict bar
      //   2. Feature components (src/components/features/**) — ratcheting up from
      //      a realistic baseline; Phase 4 adds tests and we raise the floor.
      include: [
        "src/lib/**/*.{ts,tsx}",
        "src/services/**/*.ts",
        "src/context/**/*.tsx",
        "src/hooks/**/*.ts",
        "src/components/features/**/*.{ts,tsx}",
      ],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test-setup.ts",
        "src/types/**",
        "src/lib/cn.ts", // thin re-export
        "src/lib/utils.ts", // shadcn cn() wrapper
        "src/lib/env.ts", // config init — runs at import time, not unit-testable
        "src/hooks/use-toast.ts", // shadcn generated
        "src/hooks/use-mobile.ts", // shadcn generated
        "src/hooks/index.ts", // barrel re-export
        "src/hooks/useOrders.ts", // thin useQuery wrapper — no business logic
        "src/hooks/useProducts.ts", // thin useQuery wrapper — no business logic
        "src/hooks/useProfile.ts", // thin useQuery wrapper — no business logic
        "src/hooks/useBuyerValueProfile.ts", // thin useQuery wrapper — no business logic
        "src/hooks/useFocusTrap.ts", // DOM focus management — UI-only, no business logic
        "src/hooks/useInView.ts", // IntersectionObserver wrapper — UI-only
        "src/services/index.ts", // barrel re-export
        "src/lib/constants/**", // pure label/color data objects — no logic
        "src/context/CookieConsentContext.tsx", // UI consent banner — no business logic
        "src/context/ErrorContext.tsx", // error boundary context — UI-only
        "src/components/features/**/index.ts", // barrel re-exports
      ],
      // Two-tier thresholds:
      //   1. Global floor — honest baseline reflecting that feature components
      //      (`src/components/features/**`) are still largely untested. Set
      //      slightly below the current measured numbers so the build stays
      //      green; raise as Phase 4+ component tests land. This is a
      //      no-regression ratchet, not an aspirational target.
      //   2. Per-glob strict thresholds — business-logic layers
      //      (lib/services/context) sit at 80%+ today. The per-glob threshold
      //      catches a coverage drop in a critical layer even when the global
      //      average still looks fine.
      thresholds: {
        lines: 22,
        functions: 25,
        branches: 17,
        statements: 22,
        "src/lib/**": { lines: 75, functions: 75, branches: 65, statements: 75 },
        "src/services/**": { lines: 75, functions: 75, branches: 65, statements: 75 },
        "src/context/**": { lines: 70, functions: 70, branches: 60, statements: 70 },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
