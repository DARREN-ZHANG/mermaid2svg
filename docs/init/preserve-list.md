# Preserve List

Files and directories that must be preserved during the Mermaid → SVG project transformation.
These assets are either critical infrastructure, reusable design systems, or part of the upstream project's value.

Generated: 2026-06-12
Phase: Project Cognition

---

## 1. Project Framework & Build Tooling — MUST PRESERVE

| Path | Reason |
|---|---|
| `package.json` | Project manifest, scripts, dependency declarations. Will need Mermaid dep added but structure must remain. |
| `bun.lock` | Lock file for reproducible installs. |
| `pnpm-lock.yaml` | Used by Husky pre-commit hook (`pnpm exec lint-staged`). |
| `vite.config.js` | Core build config: Pug plugin, Stylus plugin, SVG inlining, dev server. All Mermaid demo will use this. |
| `dev.js` | Dev server entry point. Works for both math and Mermaid demos. |
| `minify.js` | Library build via Rolldown. Already measures gzip. Reusable for size-report.json. |
| `dist.js` | npm publish workflow. Part of upstream CI. |
| `knip.js` | Dead code detection config. Must be updated when adding new entry points. |
| `.gitignore` | Must be updated, not deleted. |
| `.husky/` | Git hooks infrastructure. Pre-commit runs lint-staged + workflow tests. |
| `.eslintignore` | ESLint exclusion config. |

## 2. Demo Design System — MUST PRESERVE

These assets form the visual design system that the spec requires us to reuse.

| Path | Reason |
|---|---|
| `demo/style.styl` | **Core design system**: CSS variables, card layout, typography, responsive breakpoints. Must be extended, not replaced. |
| `demo/index.pug` | HTML template. Will be significantly modified for Mermaid content, but the Pug+Vite pipeline and layout structure must remain. |
| `demo/index.js` | App JS entry. Will be rewritten for Mermaid, but the i18n loading pattern (`import.meta.glob`) must be preserved. |
| `demo/build.js` | Vite production build + copy i18n assets to dist. Must be preserved and extended. |
| `demo/svg/bg.svg` | Background pattern used in body styling. |
| `demo/svg/github.svg` | GitHub icon in header. |
| `demo/svg/npm.svg` | NPM icon in header. |
| `demo/svg/i18n.svg` | Likely used by language picker. |
| `demo/svg/x.svg` | Likely Twitter/X icon. |
| `demo/public/*` | Favicons, app icons, webmanifest. Will need updating for Mermaid branding but structure must remain. |

## 3. Web Components Library — MUST PRESERVE

Reusable components that will be used by the Mermaid demo.

| Path | Reason |
|---|---|
| `demo/webc/I18n.js` | I18n web component — language picker. |
| `demo/webc/I18n/` | Full i18n subsystem: CODE.js (76 language codes), NAME.js, store.js, init.js, com.js, open.js, _.js, _.styl, var.styl, theme.styl |
| `demo/webc/I18n/i18n/` | 75 locale subdirs with `js.json` — language picker UI strings per locale. |
| `demo/webc/I18n/CODE.js` | Ordered array of 76 language codes. Critical for i18n system. |
| `demo/webc/I18n/NAME.js` | Language name mapping. |
| `demo/webc/js/i18n.js` | `onLang(callback)` — reactive language switch hook. |
| `demo/webc/js/cE.js` | Custom element creation utility. |
| `demo/webc/js/dom.js` | DOM utilities. |
| `demo/webc/js/route.js` | URL hash routing. |
| `demo/webc/js/On.js` | Event listener utility. |
| `demo/webc/js/Toast.js` | Toast notification component. |
| `demo/webc/js/a.js` | Shared utility. |
| `demo/webc/js/bc.js` | Broadcast channel utility. |
| `demo/webc/js/c-t.js` | Component utility. |
| `demo/webc/js/fetch.js` | Fetch utility. |
| `demo/webc/js/fetchLang.js` | Language file fetcher. |
| `demo/webc/js/rmWait.js` | Wait removal utility. |
| `demo/webc/js/selfA.js` | Self utility. |
| `demo/webc/js/split.js` | Split utility. |
| `demo/webc/js/routeDelay.js` | Route delay utility. |
| `demo/webc/Box.js` | Box component. |
| `demo/webc/Box/` | Box component assets (_.js, _.styl, theme.styl). |
| `demo/webc/BoxX.js` | BoxX component. |
| `demo/webc/BoxX/` | BoxX component assets (_.js, _.styl, i18n.js, i18n/, svg/, theme.styl, var.styl). |
| `demo/webc/Btn/` | Button styles (_.styl, theme.styl, var.styl). |
| `demo/webc/Scroll.js` | Scroll component. |
| `demo/webc/Scroll/` | Scroll component assets (_.js, _.styl, cursor/, theme.styl, var.styl). |
| `demo/webc/Lg/` | Loading/layout component (_.styl, svg/, theme.styl, var.styl). |
| `demo/webc/Math.js` | **Existing** math rendering component. Preserve — it is the upstream component. Mermaid will add a new component alongside it. |

## 4. i18n Language Files — MUST PRESERVE

| Path | Reason |
|---|---|
| `demo/i18n/*.js` (75 files) | Complete translation files for 75 languages. Must be **extended** with Mermaid-specific keys, not replaced. |
| `demo/const/langName.js` | Language name mapping. Used by i18n system. |

## 5. Shell Scripts & Automation — MUST PRESERVE

| Path | Reason |
|---|---|
| `sh/check.js` | i18n validation. Called by test.sh. Must work after adding new i18n keys. |
| `sh/ROOT.js` | Project root constant. Used by multiple scripts. |
| `sh/hook/svg.js` | SVG lint hook. |
| `sh/hook/styl.js` | Stylus format hook. |
| `sh/compile_i18n.js` | i18n compilation. |
| `test.sh` | Main test pipeline: check → oxfmt → minify → oxlint → bun test. Must be preserved and extended for Mermaid tests. |

## 6. Source Library — MUST PRESERVE

| Path | Reason |
|---|---|
| `src/` (entire directory) | The upstream TeX → MathML library. Core value of the original project. Not related to Mermaid but must not be broken. |
| `lib/` (entire directory) | Compiled output of `src/`. Regenerated by `minify.js`. Must not be manually modified. |

## 7. Plugin Directory — PRESERVE (out of scope)

| Path | Reason |
|---|---|
| `plugin/` | markdown-it/marked/remark integrations for math rendering. Unrelated to Mermaid but part of upstream value. Do not modify. |

## 8. Workflow Infrastructure — MUST PRESERVE

| Path | Reason |
|---|---|
| `workflow/` | Init loop orchestrator, state, runs, hooks. Active infrastructure for the automated dev workflow. |
| `.opencode/` | OpenCode agent configuration. |
| `opencode.jsonc` | OpenCode configuration. |

## 9. GitHub CI — PRESERVE

| Path | Reason |
|---|---|
| `.github/workflows/npm.yml` | npm publish workflow for @webc.site/math. Preserve upstream CI. |

## 10. Configuration Files — PRESERVE

| Path | Reason |
|---|---|
| `supremacy.yml` | Stylus formatting config. Used by IDE tooling. |
| `.env` | Environment variables (gitignored). |
| `README.md` | Project readme. Will need updating for Mermaid. |
| `README.mdt` | Readme template. |
| `readme/` | Split readme content (en/, zh/). |

## 11. Upstream Math Assets (demo) — PRESERVE but EXTEND

These are math-specific demo assets that will need Mermaid equivalents alongside them.

| Path | Reason |
|---|---|
| `demo/size.svg` | Current size comparison chart. Will need Mermaid-specific replacement but preserve as reference. |
| `demo/speed.svg` | Current speed comparison chart. May not be needed for Mermaid (spec only requires size comparison). |
| `demo/const/formulas.js` | 33 LaTeX formulas for demo gallery. Mermaid gallery will use Mermaid examples instead. |
| `demo/svg/demo.en.svg` | English demo screenshot for SEO/social. |
| `demo/svg/demo.zh.svg` | Chinese demo screenshot for SEO/social. |
