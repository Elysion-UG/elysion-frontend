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
]

export default config
