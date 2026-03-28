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
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      // Scope to the non-UI business logic layers: lib, services, context, hooks
      include: [
        "src/lib/**/*.{ts,tsx}",
        "src/services/**/*.ts",
        "src/context/**/*.tsx",
        "src/hooks/**/*.ts",
      ],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test-setup.ts",
        "src/types/**",
        "src/lib/cn.ts", // thin re-export
        "src/lib/utils.ts", // shadcn cn() wrapper
        "src/hooks/use-toast.ts", // shadcn generated
        "src/hooks/use-mobile.ts", // shadcn generated
        "src/hooks/index.ts", // barrel re-export
        "src/services/index.ts", // barrel re-export
      ],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
