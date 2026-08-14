import nextConfig from "eslint-config-next"

// ── Bausteine für den Credential-Leak-Guard (#106) ───────────────────────────
// Zwei Gruppen, weil sie unterschiedliche Artefakte betreffen:
//   * NO_SECRET_IN_MESSAGE  → error.message (error-context.md + Actions-Log)
//   * NO_SECRET_IN_STEP_TITLE → pw:api-Step-Titel im playwright-report,
//     der auch bei GRÜNEM Lauf entsteht.

/** Matcher, die den Sollwert in `error.message` schreiben. */
const NO_SECRET_IN_MESSAGE = [
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
]

/** Aktionen, deren Protokoll-Metainfo den Wert in den Step-Titel setzt. */
const NO_SECRET_IN_STEP_TITLE = [
  {
    // `Frame.fill` trägt `title: 'Fill "{value}"'`. onApiCallBegin macht daraus
    // einen pw:api-Step, _createTestStep serialisiert step.title ungefiltert in
    // den playwright-report — auch ohne Fehlschlag, wo es weder Trace noch
    // error-context.md gibt und retention-days der einzige Schutz wäre.
    selector: 'CallExpression[callee.property.name="fill"]',
    message:
      'fill() schreibt den Wert als Step-Titel `Fill "<wert>"` in den playwright-report — auch bei grünem Lauf (#106). In Credential-Pfaden stattdessen fillCredentialField()/clearCredentialFields() aus e2e/fixtures/credential-fields.ts verwenden.',
  },
  {
    // Gleiche Klasse über die Tastatur: `Type "{text}"` bzw. `Insert "{text}"`.
    // `arguments.length>0` grenzt gegen den parameterlosen Getter
    // `ConsoleMessage.type()` ab, den der Stage-Smoke für die CSP-Prüfung nutzt.
    selector:
      "CallExpression[callee.property.name=/^(type|insertText|pressSequentially)$/][arguments.length>0]",
    message:
      "type()/insertText()/pressSequentially() schreiben den Text in den Step-Titel und damit in den playwright-report (#106) — siehe fillCredentialField() in e2e/fixtures/credential-fields.ts.",
  },
]

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
  //
  // Zwei Blöcke mit DISJUNKTEN Dateilisten: Flat config merged die Optionen
  // einer Regel nicht, der letzte passende Block gewinnt. Stünde eine Datei in
  // beiden Listen, verlöre sie die Verbote des ersten Blocks.
  {
    // Login-Flow-Specs OHNE echte Credentials: `fill()` bleibt hier erlaubt
    // (Registrierungs- und Verify-Formulare mit Beispielwerten).
    files: ["e2e/auth/**/*.ts"],
    rules: {
      // Ersetzt die JSX-Selektoren oben — flat config merged Regel-Optionen
      // nicht, und in diesen Dateien gibt es ohnehin kein JSX.
      "no-restricted-syntax": ["error", ...NO_SECRET_IN_MESSAGE],
    },
  },
  {
    // Dateien, die echte Credentials anfassen.
    files: [
      "e2e/*.setup.ts",
      "e2e/stage/**/*.ts",
      "e2e/fixtures/**/*.ts",
      "e2e/pages/SellerLoginPage.ts",
      "e2e/seller/auth.spec.ts",
    ],
    rules: {
      "no-restricted-syntax": ["error", ...NO_SECRET_IN_MESSAGE, ...NO_SECRET_IN_STEP_TITLE],
    },
  },
]

export default config
