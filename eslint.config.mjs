import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...prettier,
  {
    // Apply this to your source files
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Turn off the Next.js image rule
      "@next/next/no-img-element": "off",
      
      // Since you're using React 18+, you don't need React in scope
      "react/react-in-jsx-scope": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
