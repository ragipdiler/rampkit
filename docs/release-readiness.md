# Public release readiness

Audit date: 2026-10-06. Target repository: https://github.com/ragipdiler/rampkit.

The source is ready to make public, with the dependency and local-use caveats below. No GitHub repository was created, nothing was pushed, and no npm package was published. Product visuals and color behavior were preserved.

## Files created

- `CONTRIBUTING.md`, `SECURITY.md`, and `THIRD_PARTY_NOTICES.md`.
- `.github/ISSUE_TEMPLATE/bug_report.yml`, `feature_request.yml`, and `config.yml`.
- `.github/pull_request_template.md` and `.github/workflows/ci.yml`.
- `.gitattributes`, `.nvmrc`, and `scripts/web.mjs`.
- `docs/screenshots/palettes.png`, `docs/screenshots/canvas.png`, and this report.

## Files changed

- `README.md`: installation, Chromium setup, usage, CLI, architecture, formats, limitations, screenshots, and suggested GitHub topics.
- `.gitignore`: dependencies, builds, environment files, browser artifacts, local exports/caches, OS/editor files, and local agent/cloud configuration.
- `package.json` and `package-lock.json`: confirmed repository metadata, keywords, Node requirement, portable web scripts, automatic CLI build before browser tests, and patched Vitest 4.1.11.
- `apps/web/package.json` and all four `packages/*/package.json` files: MIT metadata.
- `AGENTS.md`, `docs/design/UI-UX.md`, `docs/design/ART.md`, and `docs/design/LOGO.md`: concise public engineering context reflecting the completed product. Historical internal briefs were removed; useful invariants remain.
- `apps/web/app/api/analyze/route.ts`: reject non-loopback Host headers to reduce DNS-rebinding exposure on the local listener.
- Browser tests: `art-theme`, `color-canvas`, `color-picker`, `empty-states`, `painting`, `select`, `select-option`, `ui-foundation`, and `workflow`. Updated obsolete UI expectations, portable temporary paths, and local-host/origin rejection coverage.

The existing MIT `LICENSE` was reviewed and retained. Framework-generated `apps/web/AGENTS.md` and its `CLAUDE.md` reference are public engineering guidance and remain.

## Files removed or excluded

No product source files were deleted. Development screenshots, browser traces/results, dependencies, build output, generated Next.js declarations, caches, and temporary files remain local and are excluded from Git. Only two reviewed, synthetic-data screenshots are included. There were no environment files or credentials to remove from the release files.

## Security findings

- There was no Git repository or prior history when the audit began. A single initial commit was prepared on `main`; all committed file blobs were scanned for credential patterns and personal filesystem paths.
- No exposed API keys, credentials, private URLs, or personal paths were found in the public candidate files. Intentional public GitHub links and loopback development/test URLs remain. Pattern scanning is not a guarantee against every possible secret format.
- `npm audit --omit=dev`: **0 reported vulnerabilities**.
- Full `npm audit`: **5 high-severity findings**, all from one development-only Next.js ESLint chain: `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`.
- [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) has no patched braces release at audit time. Here the chain handles a fixed local lint root, not website input or production requests. A forced audit fix proposes a major Next.js lint downgrade and was not applied. Track the upstream fix; avoid untrusted lint configuration/globs. See `SECURITY.md`.
- Vitest was upgraded from 3.2.7 to 4.1.11 to address [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9).
- Website extraction runs untrusted page scripts with access to the machine's network. Redirects and subresources are not restricted to public IPs. Rampkit is a local utility, not an SSRF-safe hosted API; the README and security policy state this boundary.
- The existing Classic UI white/purple-500 pair has a 2.86:1 contrast limitation. It is documented without redesigning the completed product.
- No account, database, cloud service, or paid API is required. Dependencies and the font/brand asset licenses are disclosed.

## Validation

Executed with Node.js 22.23.3 on macOS. A separate fresh local Git clone contained only public tracked files, with no environment file or copied dependency/build directory.

| Check | Result |
| --- | --- |
| Documented `npm install` in a clean public-file copy | Passed |
| `npm ci` in a fresh Git clone | Passed |
| `npx playwright install chromium` | Passed; installed browser available |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test` | 47 passed in 10 files |
| `npm run test:e2e` | 27 passed; 1 optional live-website test skipped |
| `npm run build` | Passed: CLI bundle and production Next.js build |
| `npm run dev` | Started successfully through the browser suite |
| `npm start` | Production page loaded; zero browser page errors |
| CLI manual generation and fixture extraction | Passed in browser integration tests |
| Fresh-clone Git status after install/tests/build | Clean |

CI repeats installation, Chromium setup, source checks, browser tests, and production build on Ubuntu. Windows/Android font behavior was checked with simulated user agents; native Windows and Android installations were not tested. The web launcher no longer relies on POSIX-only shell commands.

## Git and release state

- Branch: `main`.
- Commit message: `Initial open source release`.
- Remote configured: `https://github.com/ragipdiler/rampkit.git`.
- Commit identity uses a GitHub noreply address.
- Working tree: clean after the final release commit.
- No push, remote repository creation, or npm publication performed.

Before accepting security reports through GitHub, enable private vulnerability reporting after the repository is created. The security policy provides a fallback request for a private channel without publishing vulnerability details.
