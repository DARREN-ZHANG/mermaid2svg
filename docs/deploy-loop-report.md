# Deploy Loop Final Report

## Loop Status: PASS (local-verified)

Deploy Loop Phase artifact. This is the final report for the Cloudflare Pages
Deployment Loop. It summarizes deployment artifacts, build settings, and the
machine-readable deployment evidence.

Machine-readable companions:

- `workflow/reports/deployment-report.json` (canonical readiness report)
- `workflow/runs/deploy/run-1/local-build-result.json` (build run log)
- Plan: `docs/deploy/deploy-plan.md`

Blocked files respected: no final-acceptance sign-off files touched. Deploy
Loop does **not** perform final acceptance sign-off (per phase prompt).

---

## 1. Mission Recap

Define the Cloudflare Pages deployment model for the Mermaid → SVG demo:
build command, output directory, required environment variables, redirect /
SPA fallback policy, and local build evidence.

Out of scope (deferred): real Cloudflare Pages deployment execution (a
deploy-time human action), public-URL functional acceptance, and final
acceptance sign-off (owned by Final Audit Loop).

Files touched by this loop: `docs/deploy/**`, `wrangler.toml`,
`demo/public/_headers`, `workflow/reports/deployment-report.json`,
`workflow/runs/deploy/**`.

---

## 2. Deployment Model

| Aspect                     | Decision                       | Basis                                                                                         |
| -------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| Site type                  | Pure static (SPA single entry) | `demo/dist/index.html` + static JS/CSS/JSON                                                   |
| Server runtime needed      | **No**                         | No SSR, no API route, no Pages Functions                                                      |
| Render engine location     | Browser-side                   | `mermaid` bundled into JS chunks at build time (`src/render/mermaid-to-svg.js`)               |
| Database / queue / storage | None                           | HG-6 forbids; no references in build output                                                   |
| i18n mechanism             | Client-side runtime switch     | 75 locale modules via `import.meta.glob`; `/webc/I18n/i18n/<code>/js.json` fetched at runtime |

**Verdict**: Cloudflare Pages static hosting is sufficient. No Pages
Functions, Workers, or server runtime required.

---

## 3. Build Settings (HG-6)

| Field                | Value                                            |
| -------------------- | ------------------------------------------------ |
| Build command        | `bun install --frozen-lockfile && bun run build` |
| Build script         | `bun demo/build.js`                              |
| Output directory     | `demo/dist`                                      |
| Root directory       | `.` (repo root)                                  |
| Framework preset     | None (pure static)                               |
| Lockfile             | `bun.lock`                                       |
| Required env vars    | **none**                                         |
| Optional env var     | `BUN_VERSION=1.3.14` (pin bun on CF build image) |
| Redirects needed     | no                                               |
| SPA fallback needed  | no                                               |
| Runtime deps bundled | `mermaid`                                        |

`demo/build.js` does two things: (1) calls Vite `build()` (root=`demo`)
producing hashed JS/CSS into `demo/dist/assets/`, (2) `cpSync` copies
`webc/I18n/i18n/` and `webc/BoxX/i18n/` (runtime language data) to dist.

### 3.1 Redirect / SPA fallback

Not needed. Single entry `index.html`, no history API routing. Multi-language
switching is client-side JSON fetch, producing no new URL paths. All asset
paths are absolute (`/assets/*`, `/webc/*`), so root-domain deployment hits
them directly.

---

## 4. Cloudflare Pages Configuration Files

| File            | Location                                                | Purpose                                                                                                                                                                   | Machine-readable |
| --------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `wrangler.toml` | project root                                            | `pages_build_output_dir = "demo/dist"` + `compatibility_date`; for `wrangler pages deploy` / CI                                                                           | yes              |
| `_headers`      | `demo/public/_headers` → copied to `demo/dist/_headers` | Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) + caching (hashed assets `1y immutable`, i18n JSON `1h`, HTML `no-cache`) | yes              |

`_headers` is auto-copied by Vite from `demo/public/` to dist root; CF Pages
auto-detects it. `wrangler.toml` lives at repo root for CI use.

### bun availability fallback

If the CF build image lacks bun, use either fallback:

| Strategy          | Command                                                          | Note                       |
| ----------------- | ---------------------------------------------------------------- | -------------------------- |
| A (recommended)   | `npm i -g bun && bun install --frozen-lockfile && bun run build` | Matches local toolchain    |
| B (Node fallback) | `npm install && node demo/build.js`                              | `build.js` is standard ESM |

---

## 5. Deployment Evidence (Local Verification)

Fresh clean build re-verified this run (`rm -rf demo/dist && bun run build`):

| Check                   | Method                                                            | Result                              |
| ----------------------- | ----------------------------------------------------------------- | ----------------------------------- |
| Production build        | `bun run build`                                                   | exit 0, 337ms                       |
| Output dir exists       | `demo/dist/index.html`                                            | present                             |
| dist total size         | `du -sk demo/dist`                                                | 4008 KB (3.9M)                      |
| Asset chunk count       | `ls demo/dist/assets \| wc -l`                                    | 77                                  |
| Entry JS hash stable    | `index-CsSmk8RF.js`                                               | matches prior builds (reproducible) |
| Entry JS raw            | build report                                                      | 186.57 kB                           |
| Entry JS gzip           | `gzip -c < entry.js \| wc -c`                                     | 46166 bytes                         |
| CSS chunk               | `index-B_6EgLaf.css`                                              | 31.85 kB / gzip 6.08 kB             |
| i18n data copied (I18n) | `ls demo/dist/webc/I18n/i18n \| wc -l`                            | 75 locale dirs                      |
| i18n data copied (BoxX) | `ls demo/dist/webc/BoxX/i18n \| wc -l`                            | 75 locale dirs                      |
| `_headers` in dist      | `demo/dist/_headers`                                              | present, 782 bytes                  |
| No server runtime       | `test ! -e demo/dist/_worker.js && test ! -d demo/dist/functions` | exit 0 (none present)               |
| Manifest assets copied  | favicon\*, site.webmanifest                                       | 7 files in dist root                |
| Absolute paths valid    | grep `/assets/*` in index.html                                    | root-domain deploy OK               |

All 11 readiness checks in `workflow/reports/deployment-report.json` →
`readinessChecks[]` pass. Full command-level evidence recorded in the report's
`reVerification.commands[]`.

### Key build artifacts

| File                                         | raw       | gzip     |
| -------------------------------------------- | --------- | -------- |
| `demo/dist/index.html`                       | 4.41 kB   | 1.57 kB  |
| `demo/dist/assets/index-CsSmk8RF.js` (entry) | 186.57 kB | 46.82 kB |
| `demo/dist/assets/index-B_6EgLaf.css`        | 31.85 kB  | 6.08 kB  |

> chunk-size warning (>500 kB) is expected and tracked by Size Loop as a
> performance proxy; non-blocking.

---

## 6. Path & Resource Correctness

### 6.1 Absolute paths work at root domain

`index.html` references `/assets/index-CsSmk8RF.js`, `/assets/index-B_6EgLaf.css`
etc. (Vite `base: '/'`). Runtime fetches `/webc/I18n/i18n/<code>/js.json`.
Root-domain deployment (e.g. `https://<project>.pages.dev`) hits all paths
directly. Subpath deployment would require setting Vite `base` and the i18n
fetch prefix; current plan is root-domain only.

### 6.2 External CDN dependency

| Resource | URL                                                     | Nature                     | Degradation                                                                                      |
| -------- | ------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| `_.css`  | `https://registry.npmmirror.com/18s/0.2.24/files/_.css` | decorative style framework | load failure does not affect Mermaid rendering; default theme needs no CDN (HG-4 / AC-THEME-003) |

Default Mermaid rendering + default theme does not depend on any external CDN,
satisfying "default theme must not require external CDN".

---

## 7. Post-Deploy Acceptance Checklist (AC-DEPLOY-002)

The following must be confirmed at the public URL after CF Pages deployment:

| AC                 | Item                               | Verification method                                                 | Status         |
| ------------------ | ---------------------------------- | ------------------------------------------------------------------- | -------------- |
| AC-UI-001/002      | Mermaid input → SVG preview        | enter a legal flowchart, confirm SVG appears                        | pending-deploy |
| AC-UI-003          | 8-type example gallery             | scroll to Examples, confirm rendered SVG (not screenshots)          | pending-deploy |
| AC-THEME-001/002   | Beautiful Mermaid CSS theme toggle | click theme button, confirm SVG style change + localStorage persist | pending-deploy |
| AC-COMPARE-001/004 | Size comparison SVG bar chart      | confirm `#size-chart` SVG present, data matches `size-report.json`  | pending-deploy |
| AC-I18N-001/002    | Multi-language switch              | switch zh/ja/de, confirm copy updates, no crash                     | pending-deploy |
| AC-DEPLOY-001      | Static resources 200               | DevTools Network, no 404 on `/assets/*`, `/webc/I18n/i18n/*`        | pending-deploy |
| AC-DEPLOY-001      | No hydration errors                | Console free of uncaught errors                                     | pending-deploy |

These are `pending-deploy` because they require a public URL; they cannot be
closed inside the local loop. Full checklist lives in
`deployment-report.json` → `postDeployAcceptanceChecklist[]`.

---

## 8. Acceptance Criteria Coverage

| AC            | Requirement                                                                                  | Status                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| AC-DEPLOY-001 | CF Pages can build & deploy; build command / output dir clear; no unsupported server runtime | local build exit 0; config files present; deploy-time verification pending |
| AC-DEPLOY-002 | Deployed version supports input / preview / examples / theme / size chart / i18n             | post-deploy checklist defined (§7); public-URL verification pending        |
| HG-6          | build command / output dir / env vars / redirects / local build result all recorded          | all recorded                                                               |

---

## 9. Deferred / Human-Gate Items

Items the Deploy Loop cannot close locally; handed to deploy-time:

1. **bun availability on CF Pages build image** — confirm whether preinstalled; if not, use fallback §4.
2. **First public deployment URL** — record production / preview URL in the deployment report.
3. **`_.css` CDN reachability** at CF edge network — decorative only, does not affect core functionality.
4. **CF Pages actual build duration & exit code** — record at deploy time.

These do not block Deploy Loop planning deliverables, but must be closed by
the deploy operation before Final Audit.

---

## 10. Commits (Deploy Loop)

| Commit    | Description                                                     |
| --------- | --------------------------------------------------------------- |
| `5d39970` | `docs(deploy): add cloudflare pages deploy plan`                |
| `dbbdf44` | `chore(deploy): add cloudflare pages config files`              |
| `d9d48c1` | `docs(deploy): add deployment readiness report and update plan` |
| `3fed398` | `docs(deploy): re-verify build and cloudflare pages readiness`  |

---

## 11. Constraint Compliance

| Constraint                                                   | Status                                           |
| ------------------------------------------------------------ | ------------------------------------------------ |
| No server runtime / database / queue / storage added         | satisfied (pure static)                          |
| No `src/**`, `lib/**`, parent docs, `references/**` modified | satisfied                                        |
| No final acceptance sign-off performed                       | satisfied (loop only plans & verifies readiness) |
| Change scope limited to deploy artifacts + CF config         | satisfied                                        |

---

## 12. Conclusion

- Cloudflare Pages deployment model is fixed: pure static, root-domain, absolute paths, no server runtime.
- Build command `bun run build`, output `demo/dist`, zero required env vars, no redirects.
- Local build exits 0; dist structure complete; i18n data in place; size data traceable; build reproducible (entry hash stable).
- CF Pages config files (`wrangler.toml`, `_headers`) present and machine-readable.
- HG-6 and AC-DEPLOY-001 fields fully recorded; AC-DEPLOY-002 checklist defined.

**Deploy Loop gate: planning & readiness deliverables met.** Real deployment
execution and public-URL functional acceptance are handed to deploy-time, and
final acceptance sign-off is deferred to Final Audit Loop.
