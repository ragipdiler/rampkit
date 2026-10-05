# Security policy

## Reporting privately

Do not disclose vulnerabilities, credentials, or exploit details in a public issue or pull request. Use GitHub's **Security → Advisories → Report a vulnerability** on [ragipdiler/rampkit](https://github.com/ragipdiler/rampkit/security/advisories/new) once private reporting is enabled.

If that option is unavailable, open a public issue containing only a request for a private reporting channel, without vulnerability details. Wait for a maintainer to provide a private channel before sending the report. No personal email is required.

Include affected versions, reproduction steps, impact, and a minimal proof of concept without unrelated private data. The latest source release is supported; response times depend on maintainer availability.

## Local-use boundary

Rampkit is a local desktop utility, not a hardened multi-user or hosted extraction service. Supplied web scripts bind to loopback. Keep them on loopback; do not expose the analysis endpoint to untrusted users or networks.

Extraction runs website scripts in a fresh Chromium context with service workers blocked. It does not load your normal browser profile, accounts, or extensions. The browser still has access to the host's network: HTTP(S) redirects and subresources are not restricted to public IPs. Analyze only trusted sites; use an isolated environment with restricted egress when inspecting untrusted content. This is not an SSRF-safe hosted API.

The analysis route rejects cross-origin browser requests and non-loopback Host headers, limits concurrent analyses, and cancels its browser when a request ends. These controls do not replace network isolation, authentication, or resource limits for a future hosted deployment.

Workspaces and clipboard exports can contain URLs and color evidence. Review exported files before sharing them. Do not commit `.env` files, credentials, browser traces, or generated studies.

## Dependency advisories

Vitest was upgraded to a patched release for [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9).

The development-only Next.js ESLint dependency chain includes `braces@3.0.3`, affected by [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). No patched braces version was published at the release audit. In this repository it processes the fixed local `apps/web/` lint root, not website input or production requests. Do not run lint with untrusted configuration or glob patterns. A full `npm audit` therefore reports the affected tooling chain; use `npm audit --omit=dev` to inspect production dependencies separately. Recheck advisories before each release and update when upstream fixes are available.
