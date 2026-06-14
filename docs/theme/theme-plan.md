# Theme Loop Plan

Theme Loop Phase 02 artifact. This document specifies the plan for adding Beautiful
Mermaid CSS theme switching and CSS source/version traceability to the existing
Mermaid → SVG demo.

Subsequent theme-loop phases (`03 implementation`, `04 verification`,
`05 final-report`) implement against this plan. Nothing in this plan adds size
comparison, i18n keys across locales, or deployment config — those are deferred
to their own loops.

---

## 1. Scope and Constraints

### 1.1 What this plan covers

- A CSS-based theme switching mechanism that re-styles the rendered Mermaid SVG.
- Reusing the Beautiful Mermaid theme palette model as the color source of truth.
- A visible theme switcher control in the demo page.
- A machine-readable CSS source/version report (`workflow/reports/theme-css-report.json`).
- Per-phase file boundaries, verification commands, commit sequence, and risks.

### 1.2 What this plan does NOT cover

- Replacing or altering the render path. The Render Loop's `renderMermaidToSvg`
  and the SVG Output Loop's `normalizeSvg` are used as-is. No `src/**` edits.
- Size / gzip comparison SVG bar chart and data (Size Loop).
- Translation keys across all 75 `demo/i18n/*.js` locales (I18N Loop).
- Cloudflare Pages deployment config (Deploy Loop).

### 1.3 Inputs (produced by earlier loops)

| Input                                                | Role                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/render/mermaid-to-svg.js`                       | `renderMermaidToSvg(text)` → `[OK, rawSvg, diagramType]`. Browser-only, default Mermaid theme.  |
| `src/render/normalize-svg.js`                        | `normalizeSvg(rawSvg)` → `[OK, normalizedSvg]`. Canonicalizes the SVG root id to `mermaid-svg`. |
| `demo/index.js`, `demo/index.pug`, `demo/style.styl` | Current demo: editor card, examples gallery, error states. No theme UI yet.                     |
| `workflow/reports/web-demo-report.json`              | Web Demo verification (8/8 pass), records deferral of theme to this loop.                       |
| `references/beautiful-mermaid/src/theme.ts`          | Canonical theme palette source (15 named themes).                                               |

### 1.4 Outputs (produced by this loop)

| Output                                                                              | Phase                               |
| ----------------------------------------------------------------------------------- | ----------------------------------- |
| `demo/const/themes.js` (theme palette data, transcribed from reference)             | 03 implementation                   |
| `demo/index.js`, `demo/index.pug`, `demo/style.styl` (theme switcher + overlay CSS) | 03 implementation                   |
| `workflow/reports/theme-css-report.json`                                            | 03 implementation / 04 verification |
| `docs/theme/theme-verification.md`                                                  | 04 verification                     |
| `docs/theme-loop-report.md`                                                         | 05 final-report                     |

### 1.5 Hard constraints

| Constraint                    | Detail                                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No render-flow change         | Theme switching must NOT modify `src/**`. It is a visual overlay on the normalized SVG. Spec §8: "主题切换不应改变核心渲染流程".                                              |
| No self-built parser / layout | Themes are pure CSS; no parsing of Mermaid.                                                                                                                                   |
| No external CDN at runtime    | Default theme must render with bundled/local CSS only (HG-4). Beautiful Mermaid CSS values are transcribed into a local data module; no runtime fetch of `beautiful-mermaid`. |
| Source traceability           | Theme palettes must record their source path, repo, commit, and version (HG-4).                                                                                               |
| i18n deferred                 | New theme-switcher copy uses English text marked `// TODO(i18n-loop): extract to key`; do NOT edit `demo/i18n/*.js`.                                                          |
| Preserve design language      | Theme UI reuses existing `.Btn`, `.card`, glassmorphism (`.Lg`), and design tokens from `demo/style.styl`.                                                                    |
| Blocked scope                 | size comparison, i18n key propagation, deployment.                                                                                                                            |
| Blocked patterns              | runtime benchmark, server rendering, `puppeteer`/`playwright` as renderer, screenshot/canvas as oracle.                                                                       |

---

## 2. CSS Source Traceability (HG-4)

The Human Gate HG-4 mandates the local `references/beautiful-mermaid` repository as
the traceable source. The exact provenance to record in every generated report:

| Field      | Value                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------- |
| repo       | `lukilabs/beautiful-mermaid`                                                                 |
| url        | `https://github.com/lukilabs/beautiful-mermaid`                                              |
| localPath  | `references/beautiful-mermaid`                                                               |
| sourceFile | `src/theme.ts` (`THEMES` export)                                                             |
| commit     | `2ac8bbbb060ca0a65a6a21f3200bd99b1587b488`                                                   |
| commitDate | `2026-05-06T12:53:19+02:00`                                                                  |
| version    | `1.1.3` (`references/beautiful-mermaid/package.json`); `git describe` = `v1.1.3-12-g2ac8bbb` |

This exact field set (`repo`, `url`, `localPath`, `sourceFile`, `commit`,
`commitDate`, `version`) is reused verbatim in the data module (`THEME_SOURCE`,
§4.2) and in `theme-css-report.json` (`cssSource`, §6.2) so there is one
canonical naming scheme across the loop.

The implementation transcribes the `THEMES` palette values from `src/theme.ts`
into a local `demo/const/themes.js` data module. The values are copied verbatim
(bg, fg, and optional line/accent/muted/surface/border per theme). No runtime
import of `beautiful-mermaid` occurs; the reference repo stays read-only.

### 2.1 Default-theme CDN independence

The default theme (Beautiful Mermaid `zinc-light`: `bg #FFFFFF`, `fg #27272A`)
is bundled as local CSS. Switching to any other theme is also fully local. If a
future theme were to load a web font, it must degrade gracefully to a system
font stack — no theme may require an external CDN to display (HG-4).

---

## 3. Theming Architecture

### 3.1 Recommended strategy: page-level CSS theme overlay

Theme switching applies a **CSS overlay** on top of the already-rendered,
normalized Mermaid SVG. The render path is untouched: Mermaid still renders with
its default theme, and the page restyles the result via CSS.

This is chosen because:

1. It does not alter the core rendering flow (spec §8 hard constraint).
2. Switching is instant — no re-render needed.
3. It directly references Beautiful Mermaid's CSS-custom-property mechanism
   (`--bg`, `--fg`, `--line`, `--accent`, `--muted`, `--surface`, `--border`),
   adapting that model to the official Mermaid SVG output.
4. It stays entirely within `demo/**` (no `src/**` edits).

### 3.2 Why this is viable — verified Mermaid SVG output structure

A probe render (`graph TD; A[Start] --> B[Process] --> C[End]`) confirms the
official Mermaid default-theme output applies colors **only through a `<style>`
block scoped by the SVG root id**, never as inline color attributes:

```
<style>
  #m2s-1{font-family:...;font-size:16px;fill:#333;}
  #m2s-1 .label{...color:#333;}
  #m2s-1 .node rect,#m2s-1 .node circle,...{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}
  #m2s-1 .marker{fill:#333333;stroke:#333333;}
  ... (edge colors similarly class-scoped)
</style>
```

Inline `style="..."` attributes on elements contain **only layout** properties
(`stroke-width`, `stroke-dasharray`, `max-width`) — never color. The normalizer
(`normalize-svg.js`) canonicalizes the root id from `m2s-N` → `mermaid-svg`,
so after normalization every selector in the embedded style block is scoped by
`#mermaid-svg`.

A page stylesheet rule with higher specificity therefore overrides Mermaid's
default colors without `!important`. For example
`#svg-preview #mermaid-svg .node rect{fill:var(--surface)}` wins over
`#mermaid-svg .node rect{fill:#ECECFF}` (2 ids > 1 id).

### 3.3 Color-role mapping (Beautiful Mermaid → Mermaid SVG selectors)

| Beautiful Mermaid variable | Mermaid SVG target (post-normalize)                                 | Role                      |
| -------------------------- | ------------------------------------------------------------------- | ------------------------- |
| `--bg`                     | `#svg-preview #mermaid-svg` (background)                            | SVG canvas background     |
| `--fg`                     | `#mermaid-svg` root `fill`, `.label` `color`, `.marker` fill/stroke | Primary text + arrowheads |
| `--line`                   | `.edgePath .path` `stroke`, `.flowchart-link` `fill`                | Connectors / edges        |
| `--accent`                 | `.node .label` (optional accent text) or highlight nodes            | Highlights                |
| `--muted`                  | secondary labels / cluster labels                                   | Secondary text            |
| `--surface`                | `.node rect`, `.node circle`, `.node polygon`, `.node path` `fill`  | Node box fill             |
| `--border`                 | node shape `stroke`                                                 | Node box stroke           |

The optional enrichment variables (`--line`, `--accent`, `--muted`, `--surface`,
`--border`) fall back to color-mix derivations from `--fg` + `--bg` exactly as
Beautiful Mermaid's `theme.ts` defines (the `MIX` weights). Themes that provide
explicit enrichment values use them directly.

### 3.4 Implementation mechanics

1. **Theme data** (`demo/const/themes.js`): an array of `[id, label, {bg, fg,
line?, accent?, muted?, surface?, border?}]` tuples transcribed from the
   reference `THEMES`. Curated subset for the demo (see §4).
2. **Derived CSS variables**: the overlay CSS sets the Beautiful Mermaid
   custom properties on `#svg-preview` per `data-theme`, then derives the
   internal Mermaid-targeted values with the same color-mix fallbacks as
   `theme.ts` (or simpler: each theme stores its own concrete derived values
   so the CSS needs no color-mix math).
3. **Overlay selectors**: a block in `demo/style.styl` that maps the derived
   values onto the Mermaid selectors from §3.3. The active theme is carried by
   a single `data-theme` attribute set on a **common ancestor** — e.g.
   `document.documentElement` (the `<html>` element) — so one attribute themes
   every normalized Mermaid SVG on the page at once: both the editor preview
   (`#svg-preview #mermaid-svg`) and the examples gallery cards
   (`.rendered-svg #mermaid-svg`). Selectors therefore look like
   `[data-theme="zinc-dark"] #mermaid-svg .node rect{fill:var(--surface)}`
   and reach both surfaces without per-container duplication.
4. **Switch handler**: the theme switcher sets `data-theme` on the common
   ancestor. Because every SVG is already in the DOM, the style applies
   immediately — no re-render. The current theme is persisted to `localStorage`.

### 3.5 Alternatives considered (not chosen)

| Alternative                                                                    | Why not                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Demo-layer `mermaid.configure({theme:'base',themeVariables})` before re-render | Changes Mermaid's active config on each switch; arguably touches the rendering flow (spec says theme must not change core rendering). Requires a re-render per switch (slower). Couples the demo directly to the `mermaid` import. |
| Post-process the SVG string to inject a `<style>` block                        | Works, but competes with the normalizer's responsibility and adds a second mutation step. Pure page-CSS overlay is simpler and sufficient given §3.2.                                                                              |

---

## 4. Theme Data Model

### 4.1 Curated theme set

Beautiful Mermaid ships 15 named themes. The demo exposes a curated subset that
covers light, dark, and a few popular palettes, so the switcher stays readable:

| id                 | label            | bg                                                   | fg        | enrichment        |
| ------------------ | ---------------- | ---------------------------------------------------- | --------- | ----------------- |
| `mermaid-default`  | Mermaid Default  | (none — disables overlay, shows native Mermaid look) | —         | —                 |
| `zinc-light`       | Zinc Light       | `#FFFFFF`                                            | `#27272A` | derived           |
| `zinc-dark`        | Zinc Dark        | `#18181B`                                            | `#FAFAFA` | derived           |
| `tokyo-night`      | Tokyo Night      | `#1a1b26`                                            | `#a9b1d6` | line/accent/muted |
| `catppuccin-mocha` | Catppuccin Mocha | `#1e1e2e`                                            | `#cdd6f4` | line/accent/muted |
| `nord`             | Nord             | `#2e3440`                                            | `#d8dee9` | line/accent/muted |
| `github-light`     | GitHub Light     | `#ffffff`                                            | `#1f2328` | line/accent/muted |
| `github-dark`      | GitHub Dark      | `#0d1117`                                            | `#e6edf3` | line/accent/muted |
| `dracula`          | Dracula          | `#282a36`                                            | `#f8f8f2` | line/accent/muted |

The special `mermaid-default` entry disables the overlay entirely (removes the
color-override rules) so users can compare the Beautiful Mermaid styling against
the native Mermaid default. This is the fallback theme when an overlay fails.

### 4.2 Data file shape (`demo/const/themes.js`)

```js
// 每个主题: [id, 显示名, { bg, fg, line?, accent?, muted?, surface?, border? }]
// 调色板逐值转录自 references/beautiful-mermaid/src/theme.ts (commit 2ac8bbb)
export const THEME_SOURCE = {
  repo: "lukilabs/beautiful-mermaid",
  url: "https://github.com/lukilabs/beautiful-mermaid",
  localPath: "references/beautiful-mermaid",
  sourceFile: "src/theme.ts",
  commit: "2ac8bbbb060ca0a65a6a21f3200bd99b1587b488",
  commitDate: "2026-05-06T12:53:19+02:00",
  version: "1.1.3",
};
export default [
  ["zinc-light", "Zinc Light", { bg: "#FFFFFF", fg: "#27272A" }],
  // ...其余主题，值与 THEME_SOURCE 指向的 theme.ts 一致
];
```

### 4.3 Source fidelity check

The implementation/verification phases must confirm every palette value in
`demo/const/themes.js` matches the `THEMES` object at the pinned commit byte
for byte (bg/fg and any provided enrichment). The `theme-css-report.json`
records this provenance and the check result.

---

## 5. Theme Switcher UI

### 5.1 Placement

Add a compact theme control to the **editor card header** (next to
`#ui-editor-title`), reusing the existing `.Btn` / `.Btn.Main` styling and
`.tip` typography:

```
.editor-header
  h2#ui-editor-title
  .theme-switcher                // new
    button.theme-btn [...]      // one per curated theme; active state styled
  p#ui-editor-tip.tip
```

On mobile (`max-width: 768px`) the control keeps the same stacking, matching
the existing responsive collapse. Note: the existing `.editor-header` is
`flex-direction: column` on all breakpoints, so the switcher naturally sits on
its own row beneath the `h2`; no layout change is required, though the
implementation may switch the header to a row on desktop if it looks better.

### 5.2 Interaction

```
user clicks a theme button
  → set document.documentElement[data-theme="<id>"]
    (themes both #svg-preview and the examples gallery at once)
  → persist to localStorage("m2s-theme")
  → re-style applies instantly via CSS (no re-render)
  → toggle .active class on the clicked button
```

On page load, restore from `localStorage` (default `mermaid-default` if absent
or if the stored id is unknown). Unknown stored ids fall back to
`mermaid-default` so a stale value never breaks the page.

### 5.3 Visual confirmation of switching

Per AC-THEME-001 / AC-THEME-002, switching must produce a visible style change.
The overlay changes node fill/stroke, text color, edge color, and background —
enough to be plainly visible (e.g. light → dark is dramatic).

---

## 6. Theme Report (`theme-css-report.json`)

### 6.1 Path

```
workflow/reports/theme-css-report.json
```

### 6.2 Shape

```json
{
  "generatedAt": "<ISO timestamp>",
  "loop": "theme-loop",
  "cssSource": {
    "repo": "lukilabs/beautiful-mermaid",
    "url": "https://github.com/lukilabs/beautiful-mermaid",
    "localPath": "references/beautiful-mermaid",
    "sourceFile": "src/theme.ts",
    "commit": "2ac8bbbb060ca0a65a6a21f3200bd99b1587b488",
    "commitDate": "2026-05-06T12:53:19+02:00",
    "version": "1.1.3"
  },
  "themes": [{ "id": "zinc-light", "label": "Zinc Light", "provenanceMatch": true }],
  "defaultTheme": "mermaid-default",
  "cdnIndependence": {
    "runtimeCdnRequired": false,
    "fallback": "all themes bundled locally; system font stack when web font unavailable"
  },
  "integration": {
    "approach": "page-level CSS overlay on normalized Mermaid SVG",
    "rendererTouched": false,
    "switchTriggersRerender": false,
    "persistedTo": "localStorage"
  },
  "verification": {
    "build": { "command": "bun run build", "exitCode": 0 },
    "themeSwitchVisible": true,
    "blockedPatternsFound": 0
  },
  "deferred": {
    "i18n": "I18N Loop (theme button labels use hardcoded English marked TODO)",
    "sizeComparison": "Size Loop",
    "deployment": "Deploy Loop"
  }
}
```

The report is created in implementation and refreshed in verification. It is a
required artifact for both phases and a required final artifact for the loop.

---

## 7. File Boundaries by Phase

### Phase 03 (implementation)

|                  | Path                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Allowed          | `demo/**`, `docs/theme/**`, `workflow/reports/theme-css-report.json`                                                                   |
| Blocked          | `../docs/**`, `references/**`, `src/**`, `lib/**`, `test/**`, `extract/**`, `demo/i18n/**` (key additions), all size/i18n/deploy files |
| Required outputs | `demo/const/themes.js`, updated `demo/index.js` + `demo/index.pug` + `demo/style.styl`, `workflow/reports/theme-css-report.json`       |

### Phase 04 (verification)

|                  | Path                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------- |
| Allowed          | `workflow/reports/theme-css-report.json`, `docs/theme/**`                              |
| Blocked          | `../docs/**`, `references/**`, `src/**`, `demo/**` (no source edits), `test/**`        |
| Required outputs | `docs/theme/theme-verification.md`, refreshed `workflow/reports/theme-css-report.json` |

### Phase 05 (final-report)

|                 | Path                                                          |
| --------------- | ------------------------------------------------------------- |
| Allowed         | `docs/theme-loop-report.md`                                   |
| Blocked         | `../docs/**`, `references/**`, `src/**`, `demo/**`, `test/**` |
| Required output | `docs/theme-loop-report.md`                                   |

---

## 8. Verification Commands

### 8.1 This phase (plan)

The loop validator checks `docs/theme/theme-plan.md` exists and required inputs
are present:

```
workflow/reports/web-demo-report.json
src/render/normalize-svg.js
```

### 8.2 Phase 03 (implementation)

```bash
bun run build          # demo build via demo/build.js (vite build + i18n copy)
```

Build must exit 0 and produce `demo/dist`. No `src/**` changes, no new runtime
deps. `demo/const/themes.js` values must match the reference commit.

### 8.3 Phase 04 (verification)

```bash
bun run build
# + local page check (dev server on :9999):
#   render a diagram → switch themes → confirm visible style change
#   reload page → confirm theme restored from localStorage
```

Confirm: at least two themes produce visibly different SVG styling; default
theme (`mermaid-default`) shows native Mermaid look; theme switch does not blank
the SVG or crash; error inputs still recover across theme changes.

### 8.4 Phase 05 (final-report)

Validator checks `docs/theme-loop-report.md` exists and final artifacts
(`workflow/reports/theme-css-report.json`) are present.

---

## 9. Commit Sequence

All commits use conventional commits format.

| Order | Phase             | Commit message                                           | Files                                                                        |
| ----- | ----------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1     | 02 plan           | `docs(theme): add theme loop plan`                       | `docs/theme/theme-plan.md`                                                   |
| 2     | 03 implementation | `feat(theme): add beautiful mermaid css theme switching` | `demo/const/themes.js`, `demo/index.js`, `demo/index.pug`, `demo/style.styl` |
| 3     | 03 implementation | `chore(theme): record theme css report`                  | `workflow/reports/theme-css-report.json`                                     |
| 4     | 04 verification   | `docs(theme): record theme verification`                 | `docs/theme/theme-verification.md`, `workflow/reports/theme-css-report.json` |
| 5     | 05 final-report   | `docs(theme): write theme loop report`                   | `docs/theme-loop-report.md`                                                  |

Each commit is made after the phase's verification command passes.

---

## 10. Validator Checkpoints

The theme-loop validator (`workflow/loops/theme/lib/validators.ts` →
`validateRemainingPhase` enforced via `THEME_LOOP_CONFIG`) requires:

1. `docs/theme/theme-plan.md` exists (plan phase required artifact).
2. Required inputs exist for all phases:
   `workflow/reports/web-demo-report.json`, `src/render/normalize-svg.js`.
3. Implementation artifact exists: `workflow/reports/theme-css-report.json`.
4. Verification artifact exists: `workflow/reports/theme-css-report.json`.
5. Final artifacts exist at final-report:
   `workflow/reports/theme-css-report.json`, `docs/theme-loop-report.md`.

These are machine-checked existence gates. The implementation must also keep
demo source free of blocked patterns (`puppeteer`, `playwright`, `screenshot`,
`canvas`, runtime benchmark, server rendering).

---

## 11. Risk Register

| Risk                                                                                                | Mitigation                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Some Mermaid diagram types (pie, gantt, xychart) may use different color selectors than flowchart   | Inspect each MVP type's SVG `<style>` block during implementation; extend the overlay selector list per type. The probe in §3.2 confirmed flowchart; other types are verified in implementation.        |
| Mermaid's embedded `<style>` could be re-emitted with a different id after a future renderer change | The normalizer already canonicalizes the id to `mermaid-svg`; the overlay targets that stable id, not the volatile `m2s-N`.                                                                             |
| Future Mermaid upgrade adds inline color styles that defeat CSS overlay                             | Implementation checks for inline color attributes; if found, escalate to the spec-mandated boundary (record in verification; do not silently weaken). Low probability given current strict-mode output. |
| Theme overlay conflicts with the size/gzip comparison SVG chart (added by Size Loop)                | The overlay is scoped to `#svg-preview #mermaid-svg` and the examples gallery; it does not target the comparison chart's SVG.                                                                           |
| Hardcoded English theme button labels                                                               | Explicitly marked `TODO(i18n-loop)`; full i18n is a separate loop.                                                                                                                                      |
| localStorage theme id becomes stale after a palette rename                                          | Unknown stored ids fall back to `mermaid-default`; page never breaks.                                                                                                                                   |
| Over-transcribing all 15 themes bloats the switcher                                                 | Curate to 9 entries (§4.1) covering light/dark/popular palettes.                                                                                                                                        |

---

## 12. i18n Handling for This Loop

Full i18n (keys in all 75 `demo/i18n/*.js`) is the I18N Loop's responsibility and
is explicitly blocked here. New theme-switcher copy (button labels, an optional
section title) uses **English text** placed directly in `demo/index.pug` /
`demo/index.js`, each marked with a `// TODO(i18n-loop): extract to key` comment.
The I18N Loop will extract these into `mermaid_theme_*` keys with English
fallback.

---

## 13. Out of Scope for Theme Loop

- Size / gzip comparison SVG bar chart and data (Size Loop).
- Translation keys across 75 locales (I18N Loop).
- Cloudflare Pages deployment config (Deploy Loop).
- Expanding the test corpus beyond 18 cases (deferred per HG-2).
- Self-built Mermaid parser or layout engine (never).
- SVG download / save / history (non-goal per spec §14).
- Runtime performance benchmark (non-goal; size is only a proxy).

---

## 14. Open Questions (deferred, do not block this plan)

1. **Exact overlay selectors per diagram type**: finalized in implementation by
   probing each MVP type's SVG `<style>`. No decision needed in this plan; the
   flowchart probe (§3.2) already validates the approach.
2. **Whether to apply the theme to the examples gallery cards too**: resolved
   in this plan — yes. A single `data-theme` on `document.documentElement`
   themes both the editor preview and the gallery (§3.4, §5.2).
3. **Derived-value strategy (color-mix vs precomputed)**: implementation may
   precompute each theme's derived values in `themes.js` (simpler CSS) or use
   the page CSS color-mix fallbacks (closer to `theme.ts`). Either is acceptable
   as long as values match the reference at the pinned commit.
