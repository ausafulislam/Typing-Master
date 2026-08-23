import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // Reading localStorage / window.location after hydration requires a
      // synchronous two-pass update (the pattern from the React docs for
      // hydration-sensitive client-only values). Downgrade to a warning
      // instead of blanket-disabling so genuine misuse stays visible.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
])

export default eslintConfig
