import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const config = [
  {
    ignores: [
      "**/.next/**",
      "dist/**",
      "node_modules/**",
      "apps/web/next-env.d.ts",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: "apps/web/" } } },
];
export default config;
