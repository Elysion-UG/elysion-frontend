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
