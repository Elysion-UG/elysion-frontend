import nextConfig from "eslint-config-next"

const config = [
  {
    ignores: [
      ".claude/",
      ".clone/",
      "everything-claude-code/",
      ".next/",
      "node_modules/",
      "coverage/",
      "playwright-report/",
      "test-results/",
    ],
  },
  ...nextConfig,
  {
    rules: {
      // German-language app — apostrophes in JSX text are expected
      "react/no-unescaped-entities": "off",

      // Next.js rules — enforce as errors so CI fails on regressions
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-assign-module-variable": "error",

      // Rohe <a href="/...">-Anchors auf interne Routen erzwingen einen
      // Full-Page-Reload, der den In-Memory-Access-Token verwirft und eine
      // Refresh-Token-Rotation erzwingt — intermittierender Logout (#89).
      // no-html-link-for-pages greift nur im Pages-Router, daher eigene Regel.
      // Cross-Subdomain-Links (sellerUrl()/adminUrl()) nutzen Expressions und
      // sind bewusst nicht betroffen.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'JSXOpeningElement[name.name="a"] > JSXAttribute[name.name="href"] > Literal[value=/^\\u002F(?!\\u002F)/]',
          message:
            "Interne Links mit next/link statt rohem <a> rendern — ein Full-Page-Reload verwirft den In-Memory-Access-Token (#89).",
        },
        {
          // gleiche Regel für href={"/..."} (Expression-Container mit String-Literal)
          selector:
            'JSXOpeningElement[name.name="a"] > JSXAttribute[name.name="href"] > JSXExpressionContainer > Literal[value=/^\\u002F(?!\\u002F)/]',
          message:
            "Interne Links mit next/link statt rohem <a> rendern — ein Full-Page-Reload verwirft den In-Memory-Access-Token (#89).",
        },
      ],

      // Hook purity/immutability — enforce as errors; codebase is clean today
      "react-hooks/immutability": "error",
      "react-hooks/purity": "error",
      "react-hooks/set-state-in-effect": "error",

      // Style preference — keep as warn (stylistic, not correctness)
      "import/no-anonymous-default-export": "warn",
    },
  },

  // ── Credential-Leak-Guard für die Login-Pfade (#106) ────────────────────────
  // `expect(feld).toHaveValue(passwort)` schreibt den Sollwert als
  // „Expected string" in `error.message`. Die Meldung landet wörtlich in
  // `error-context.md` UND über den list-Reporter im Actions-Job-Log — der ist
  // bei einem öffentlichen Repo dauerhaft einsehbar und wird von
  // `retention-days` nicht erfasst.
  //
  // Das ist der wirksame Guard: Der Unit-Test in
  // `src/lib/e2e-credential-redaction.test.ts` kann diesen Regress NICHT fangen,
  // weil `expectFieldsFilled()` `@playwright/test` mitzieht und außerhalb des
  // Vitest-Scopes liegt. Nur diese Regel schlägt an, wenn jemand `toHaveValue`
  // in einer Datei mit echten Credentials wieder einführt.
  //
  // Bewusst NICHT auf ganz `e2e/**`: `e2e/admin/**` prüft damit Suchfelder und
  // Status-Dropdowns — unkritische Werte.
  {
    files: [
      "e2e/*.setup.ts",
      "e2e/auth/**/*.ts",
      "e2e/stage/**/*.ts",
      "e2e/fixtures/**/*.ts",
      "e2e/pages/SellerLoginPage.ts",
      "e2e/seller/auth.spec.ts",
    ],
    rules: {
      // Ersetzt die JSX-Selektoren oben — flat config merged Regel-Optionen
      // nicht, und in diesen Dateien gibt es ohnehin kein JSX.
      "no-restricted-syntax": [
        "error",
        {
          selector: 'CallExpression[callee.property.name="toHaveValue"]',
          message:
            "toHaveValue() schreibt den Sollwert in error.message und damit in error-context.md und den öffentlichen Actions-Log (#106). In Login-Pfaden stattdessen expectFieldsFilled() aus e2e/fixtures/credential-fields.ts verwenden.",
        },
        {
          selector: 'CallExpression[callee.property.name="toHaveValues"]',
          message:
            "toHaveValues() schreibt die Sollwerte in error.message (#106) — siehe expectFieldsFilled() in e2e/fixtures/credential-fields.ts.",
        },
      ],
    },
  },
]

export default config
