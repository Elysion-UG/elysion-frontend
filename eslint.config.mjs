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

      // Performance suggestions — warn only, not blocking
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "@next/next/no-assign-module-variable": "warn",

      // Hook purity/immutability — warn until codebase is migrated
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",

      // Style preference — warn only
      "import/no-anonymous-default-export": "warn",
    },
  },
]

export default config
