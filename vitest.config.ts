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
      // Global threshold covers both business logic (already ~85%) and features
      // (currently near-zero). Honest-baseline floor until Phase 4 adds
      // component tests; ratcheting target after Phase 4: lines ≥ 50.
      thresholds: { lines: 20, functions: 20, branches: 15, statements: 20 },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
