# Contributing to Rampkit

Use Node.js 22.13+ and npm. No credentials or cloud services are needed.

```bash
npm install
npx playwright install chromium
npm run dev
```

On Linux, use `npx playwright install --with-deps chromium` if browser libraries are missing.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

Run browser tests and production builds sequentially, with existing local web servers stopped. The default browser suite uses a local fixture, not external websites. Optional live website tests require `RAMPKIT_LIVE_TEST=1` and are not a requirement for ordinary contributions.

## Expectations

- Read [AGENTS.md](AGENTS.md) for architecture and invariants.
- Preserve exact locked colors, provenance, deterministic generation, and independent Light/Dark mappings.
- Keep the color engine independent of React and the application local-first.
- Match the existing design language; avoid unrelated product or dependency changes.
- Add meaningful regression tests for behavior changes. Use synthetic/public test data and keep credentials and generated artifacts out of commits.

## Pull requests

Keep changes focused. Explain the problem, resulting behavior, validation, and limitations. Include screenshots for visual changes using non-sensitive example data. Do not commit `node_modules`, build output, logs, exports, or test artifacts.

## Bugs and feature requests

Use the repository's issue templates. Include reproducible steps, expected/actual behavior, OS, browser, and Node version. Remove sensitive URLs, credentials, and personal data. Security reports belong in the private channel described in [SECURITY.md](SECURITY.md), not public issues.
