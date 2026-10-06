import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const config = [
  {
    ignores: [
      "**/.next/**",
      "dist/**",
      "**/out/**",
      "node_modules/**",
      "apps/*/next-env.d.ts",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: ["apps/web/", "apps/site/"] } } },
];
export default config;
