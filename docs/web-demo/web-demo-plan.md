# Web Demo Page Plan

Web Demo Loop Phase 02 artifact. This document specifies the plan for converting
the existing `demo/` page (an upstream `@webc.site/math` LaTeX demo) into a
Mermaid → SVG demo that reuses the same design language.

Subsequent web-demo-loop phases (`03 implementation`, `04 verification`,
`05 final-report`) implement against this plan. Nothing in this plan adds theme
switching, the size/gzip comparison chart, full i18n keys, or deployment config —
those are deferred to their own loops.

---

## 1. Scope and Constraints

### 1.1 What this plan covers

- Repurposing the existing `demo/` page structure from Math → Mermaid.
- Wiring the demo to the existing renderer + SVG normalizer (no new render code).
- A Mermaid source input area, an SVG preview area, and a multi-type examples
  gallery.
- A machine-readable demo report.
- Reuse map of existing design material (cards, glassmorphism, grid, waterfall).
- File boundaries per phase, verification commands, commit sequence, and risks.

### 1.2 What this plan does NOT cover

- Re-implementing or replacing the render path. The Render Loop's
  `renderMermaidToSvg` and the SVG Output Loop's `normalizeSvg` are used as-is.
- Theme / Beautiful Mermaid CSS switching (Theme Loop).
- The size/gzip comparison SVG bar chart and its data (Size Loop).
- Adding translation keys to all 75 `demo/i18n/*.js` locales (I18N Loop).
- Cloudflare Pages deployment config (Deploy Loop).

### 1.3 Inputs (produced by earlier loops)

| Input                                            | Role                                                                                                                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/render/mermaid-to-svg.js`                   | `renderMermaidToSvg(text)` → `[OK, rawSvg, diagramType]` on success, `[errCode, msg]` on failure. Async, browser-only.                    |
| `src/render/normalize-svg.js`                    | `normalizeSvg(rawSvg)` → `[OK, normalizedSvg]` on success, `[errCode, msg]` on failure. Sync, browser-only (`DOMParser`/`XMLSerializer`). |
| `workflow/reports/render-capabilities.json`      | 18/18 cases render; all eight HG-1 MVP diagram types covered.                                                                             |
| `workflow/reports/svg-output-compatibility.json` | 18/18 normalized outputs pass the 5-rule SVG contract.                                                                                    |
| `test/*.yml`                                     | 18 accepted, schema-validated Mermaid cases used as the example gallery source.                                                           |

### 1.4 Outputs (produced by this loop)

| Output                                                           | Phase                               |
| ---------------------------------------------------------------- | ----------------------------------- |
| `demo/index.pug`, `demo/index.js`, `demo/style.styl` (converted) | 03 implementation                   |
| `demo/const/mermaidExamples.js` (new example data)               | 03 implementation                   |
| `demo/svg/` Mermaid-rendered assets as needed                    | 03 implementation                   |
| `workflow/reports/web-demo-report.json`                          | 03 implementation / 04 verification |
| `docs/web-demo/web-demo-verification.md`                         | 04 verification                     |
| `docs/web-demo-loop-report.md`                                   | 05 final-report                     |

### 1.5 Hard constraints

| Constraint                      | Detail                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Render engine                   | Reuse `renderMermaidToSvg` + `normalizeSvg`; no new render code                                                                    |
| No self-built parser / layout   | Mermaid source goes straight to the official browser API                                                                           |
| No server rendering             | All rendering happens in the browser page via Vite-served modules                                                                  |
| Browser-only modules            | Both renderer and normalizer need a browser DOM; the demo imports them directly (Vite resolves the bare `mermaid` import)          |
| Preserve upstream assets        | Do NOT delete `demo/webc/Math.js`, `demo/const/formulas.js`, `plugin/`, `blog/`, `src/**`, `lib/**`                                |
| i18n deferred                   | New Mermaid page copy uses English text marked for later extraction; do NOT edit `demo/i18n/*.js` in this loop                     |
| Size chart deferred             | Do NOT wire the comparison chart to real data; leave the benchmark card shells intact                                              |
| Theme deferred                  | Mermaid renders with the default Mermaid theme; no Beautiful Mermaid CSS yet                                                       |
| Blocked patterns in demo source | `puppeteer`, `playwright`, `@mermaid-js/mermaid-cli`, `screenshot`, `canvas`, `html2canvas`, `toDataURL`, `remote mermaid service` |

---

## 2. Existing Design Material — Reuse Map

The current `demo/` is the upstream `@webc.site/math` page. It already provides
every visual primitive the Mermaid demo needs. The conversion reuses structure
and styles rather than inventing a new look.

### 2.1 Current page structure (`demo/index.pug`)

```
c-vs (vertical scroll root)
  header                         fixed top-right: c-i18n, npm, github buttons
  main > .container
    .header-main                 centered h1 (weight 250, 44px) + .subtitle
    .main-grid (1fr 360px)       2-col on desktop, stacks on mobile
      .usage-card.Lg             code usage block
      .benchmark-card.size-card size comparison (img size.svg)   [DEFERRED]
      .editor-card.Lg            textarea + c-math live preview
      .benchmark-card.speed-card speed comparison (img speed.svg) [DEFERRED]
    .formulas-section            waterfall gallery of formula cards
```

### 2.2 Reuse map

| New Mermaid section          | Reuse from existing demo                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| Header (lang / github / npm) | Keep `<c-i18n>` + `.BtnC` icon links; update hrefs to the Mermaid repo                              |
| Title + subtitle             | `.header-main` > `h1` (250-weight) + `.subtitle`                                                    |
| Mermaid input textarea       | `#formula-input` pattern: 18px monospace, `:focus` blue ring (`--accent-glow`)                      |
| SVG preview area             | `.rendered-math` / `.math-display` pattern: centered, `min-height`, `#f8fafc` bg, scrollable        |
| Examples gallery             | `.formulas-grid` waterfall + `.formula-card` hover lift; cards built in JS                          |
| Benchmark card shells        | Keep `.benchmark-card` containers; their content is wired by the Size Loop                          |
| Glassmorphism                | Apply `.Lg` class to every card (frosted `::before` + gradient border `::after`)                    |
| Buttons                      | `.Btn` / `.Btn.Main` (blue gradient) for the "render / clear / copy" actions                        |
| Typography & tokens          | `:root` tokens (`--accent-color #2563eb`, `--card-bg`, `--text-muted`, radius 24px, etc.) unchanged |

### 2.3 Design tokens (unchanged, from `demo/style.styl`)

```
--accent-color   #2563eb
--accent-glow    #2563eb14
--accent-gradient linear-gradient(135deg, #3b82f6, #2563eb)
--bg-color       #f8fafc
--card-bg        #ffffff
--border-color   #e2e8f0
--text-color     #0f172a
--text-muted     #64748b
card radius      24px, shadow 0 4px 6px -1px #0000000d
gallery card     radius 16px, hover translateY(-4px)
```

---

## 3. Renderer Integration

### 3.1 Composition

There is no combined entry point. The demo composes the two steps (this matches
the documented composition pattern from `docs/svg-output-loop-report.md` §2.2):

```js
import { renderMermaidToSvg, OK as RENDER_OK } from "../src/render/mermaid-to-svg.js";
import { normalizeSvg, OK as NORM_OK } from "../src/render/normalize-svg.js";

const renderToSvg = async (mermaidText) => {
  const [code, raw, diagramType] = await renderMermaidToSvg(mermaidText);
  if (code !== RENDER_OK) return [code, raw]; // render-layer error (1-4)
  const [nCode, normalized] = normalizeSvg(raw);
  if (nCode !== NORM_OK) return [nCode, normalized]; // normalize-layer error (100-102)
  return [RENDER_OK, normalized, diagramType]; // success: stable SVG
};
```

### 3.2 Return-shape caveat (important)

The renderer returns a **3-tuple** on success `[0, svg, diagramType]` but a
**2-tuple** on every error `[errCode, msg]`. The normalizer always returns a
**2-tuple**. The demo must branch on `code` first and never index blindly by
array length. The composed `renderToSvg` above normalizes this to
`[0, svg, diagramType] | [errCode, msg]`.

### 3.3 Error code → user message mapping

| Code | Constant           | Cause                          | Demo behavior                                     |
| ---- | ------------------ | ------------------------------ | ------------------------------------------------- |
| 1    | `ERR_EMPTY`        | empty / whitespace input       | show empty-state placeholder, no error styling    |
| 2    | `ERR_PARSE`        | mermaid rejected syntax        | show parse error message                          |
| 3    | `ERR_RENDER`       | parse ok, render/layout failed | show render error message                         |
| 4    | `ERR_TIMEOUT`      | exceeded 10s budget            | show timeout message                              |
| 100  | `ERR_NO_SVG`       | output has no svg root         | show output error (should not happen post-render) |
| 101  | `ERR_VIEWBOX`      | cannot derive viewBox          | show output error                                 |
| 102  | `ERR_PARSE` (norm) | svg serialization failed       | show output error                                 |

Codes 1 is treated as an empty state (not a hard error). Codes 2–4 and 100–102
show a visible, recoverable error in the preview area; the page never crashes.

### 3.4 Determinism note for the demo

The same Mermaid input re-rendered twice may differ at the byte level in the raw
SVG (Mermaid internal counters like `actor-N`, `classId-N` remain volatile), but
the **normalized** string is stable for the same raw SVG. The demo injects the
normalized string into the preview container, so no extra caching is required.

### 3.5 Browser-only requirement

Both modules need a browser DOM. The demo imports them as ES modules; Vite
resolves `import mermaid from "mermaid"`. This means the demo cannot be
server-rendered — it is a client-side page, which matches the deployment target
(Cloudflare Pages static output).

---

## 4. Page Sections (target structure)

### 4.1 Target `demo/index.pug`

```
c-vs
  header
    .header-controls
      c-i18n
      a.BtnC.github-link(href=<mermaid repo>)
  main > .container
    .header-main
      h1#ui-title                      Mermaid → SVG
      p#ui-subtitle.subtitle           <Mermaid-focused description>
    .main-grid
      .card.editor-card.Lg             INPUT + PREVIEW (primary card)
        .editor-header
          h2#ui-editor-title
          p#ui-editor-tip
        .editor-body                   two-pane: textarea + preview
          textarea#mermaid-input
          .svg-preview-wrap
            #svg-preview               normalized SVG injected here
            #render-status             empty / error / unsupported state
      .card.usage-card.Lg              USAGE code block (optional, repurposed)
        h2#ui-usage-title
        pre.code-block > code#ui-usage-code
    .examples-section
      h2#ui-examples-title
      #examples-grid.examples-grid     waterfall gallery
  script(type="module" src="./index.js")
```

Notes:

- The two benchmark cards (`.benchmark-card.size-card` / `.speed-card`) are kept
  in the markup as empty shells OR removed for this loop and reintroduced by the
  Size Loop. The plan recommends keeping a single empty `.benchmark-card.Lg`
  placeholder with a TODO comment, so the Size Loop only fills content. This
  keeps the visual rhythm intact without wiring deferred data.
- The `.usage-card` shows a short "how to use" snippet for the composed
  converter (analogous to the upstream code example). It is optional but keeps
  parity with the upstream demo's information density.

### 4.2 Editor card (input + preview)

This is the core of the demo. Two-pane layout inside one glassmorphism card:

- **Left pane: input** — a `<textarea#mermaid-input>` reusing the
  `#formula-input` styling (monospace, 18px, focus blue ring). Auto-grows height
  via the existing `adjustHeight` pattern.
- **Right pane: preview** — a `#svg-preview` container that receives the
  normalized SVG string via `innerHTML`. Styled like `.rendered-math`:
  centered, `min-height` ~200px, `#f8fafc` bg, scrollable overflow.
- **Status line** — `#render-status` shows empty-state hint, parse/render error
  text, or nothing on success.

On mobile (`max-width: 768px`) the two panes stack vertically (input above
preview), matching the existing responsive collapse.

### 4.3 Interaction flow

```
user types in #mermaid-input
  → debounce (~250ms)
  → renderToSvg(value)
    → [OK, svg, type]  : inject svg into #svg-preview, clear status
    → [1, "empty ..."]  : clear preview, show empty-state hint
    → [c, msg]          : clear preview, show error mapped from code
```

Recoverability: switching from invalid → valid input must restore rendering.
This is inherent because every input event re-runs the pipeline.

### 4.4 Examples gallery

A waterfall grid (`.examples-grid`) of clickable cards, one per MVP diagram
type. Each card:

- has an `<h3>` title (diagram type display name),
- shows the Mermaid source as a code block,
- renders the normalized SVG live via `renderToSvg`,
- on click loads its source into the editor textarea and scrolls to it.

This mirrors the existing `FORMULAS.map(...)` → `.formula-card` pattern exactly,
substituting `<c-math>` with the composed `renderToSvg` call and `.tex-code`
with a Mermaid source block.

---

## 5. Example Data

### 5.1 New file: `demo/const/mermaidExamples.js`

Exports an array of `[diagramType, displayName, mermaidSource]` tuples (or a
small object array), one entry per HG-1 MVP diagram type. Source snippets are
taken from the shortest accepted `test/*.yml` case for each type so the gallery
is provably renderable.

```js
export default [
  ["flowchart", "Flowchart", "flowchart TD\n    Start --> Stop"],
  ["sequenceDiagram", "Sequence", "sequenceDiagram\n    Alice->>Bob: Hello\n    Bob-->>Alice: Hi"],
  [
    "classDiagram",
    "Class",
    "classDiagram\n    class Animal {\n      +String name\n      +eat() void\n    }",
  ],
  [
    "stateDiagram-v2",
    "State",
    "stateDiagram-v2\n    [*] --> Idle\n    Idle --> Running : start\n    Running --> [*] : stop",
  ],
  ["erDiagram", "ER Diagram", "erDiagram\n    CUSTOMER ||--o{ ORDER : places"],
  ["pie", "Pie Chart", 'pie\n    title "Pets"\n    "Dogs" : 10\n    "Cats" : 5'],
  ["gantt", "Gantt", "gantt\n    ..."],
  ["xychart-beta", "XY Chart", "xychart-beta\n    ..."],
];
```

### 5.2 Coverage by diagram type (from accepted tests)

All eight HG-1 MVP types have at least one short, accepted, renderable test:

| Type            | Accepted count | Gallery source test                        |
| --------------- | -------------- | ------------------------------------------ |
| flowchart       | 5              | `maid-001` / `bm-001`                      |
| sequenceDiagram | 3              | `mm-seq-001` / `bm-010`                    |
| classDiagram    | 2              | `bm-014`                                   |
| stateDiagram-v2 | 2              | `maid-017` (source uses `stateDiagram-v2`) |
| erDiagram       | 2              | `bm-017`                                   |
| pie             | 2              | `maid-019`                                 |
| gantt           | 1              | `maid-020`                                 |
| xychart-beta    | 1              | `bm-020`                                   |

The exact snippets are finalized in the implementation phase by reading the
`input.mermaid` field from the corresponding YAML file. Each must remain stable
and short for the gallery.

---

## 6. i18n Handling for This Loop

Full i18n (keys in all 75 `demo/i18n/*.js`) is the I18N Loop's responsibility
and is explicitly blocked here. To keep the page coherent without touching i18n
files:

- New Mermaid page copy (title, subtitle, input label, preview label, examples
  title, empty/error/unsupported hints, usage text) uses **English text** placed
  directly in `index.pug` / `index.js`, each marked with a
  `// TODO(i18n-loop): extract to key` comment.
- The existing language switch (`<c-i18n>`, `onLang`) remains present and
  functional for any pre-existing keys the page still references.
- The I18N Loop will extract these strings into `mermaid_*` keys and propagate
  them to all 75 locales with English fallback.

This keeps the demo reviewable now and gives the I18N Loop a clear, marked
extraction list.

---

## 7. Demo Report

### 7.1 Path

```
workflow/reports/web-demo-report.json
```

### 7.2 Shape

```json
{
  "generatedAt": "<ISO timestamp>",
  "loop": "web-demo-loop",
  "pageEntry": "demo/index.html",
  "renderer": "src/render/mermaid-to-svg.js",
  "normalizer": "src/render/normalize-svg.js",
  "exampleCount": 8,
  "diagramTypes": [
    "flowchart",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram-v2",
    "erDiagram",
    "pie",
    "gantt",
    "xychart-beta"
  ],
  "localBuild": {
    "command": "bun run build",
    "exitCode": 0,
    "outputDir": "demo/dist"
  },
  "devServer": {
    "command": "bun dev.js",
    "port": 9999
  },
  "deferred": {
    "theme": "Theme Loop",
    "sizeComparison": "Size Loop",
    "i18n": "I18N Loop",
    "deployment": "Deploy Loop"
  }
}
```

The report records the build command result, the example coverage, and the
explicit deferral of out-of-scope concerns. It is updated in both the
implementation and verification phases.

---

## 8. File Boundaries by Phase

### Phase 03 (implementation)

|                  | Path                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Allowed          | `demo/**`, `docs/web-demo/**`, `workflow/reports/web-demo-report.json`                                                      |
| Blocked          | `../docs/**`, `references/**`, `src/**`, `lib/**`, `test/**`, `extract/**`, `demo/i18n/**` (i18n keys), `demo/webc/Math.js` |
| Required outputs | converted `demo/index.pug`, `demo/index.js`, new `demo/const/mermaidExamples.js`, `workflow/reports/web-demo-report.json`   |

Note: `demo/i18n/**` is blocked for _key additions_; the language switch
component stays intact.

### Phase 04 (verification)

|                  | Path                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Allowed          | `docs/web-demo/**`, `workflow/reports/web-demo-report.json`                                 |
| Blocked          | `../docs/**`, `references/**`, `src/**`, `demo/**` (no source edits), `test/**`             |
| Required outputs | `docs/web-demo/web-demo-verification.md`, refreshed `workflow/reports/web-demo-report.json` |

### Phase 05 (final-report)

|                 | Path                                                          |
| --------------- | ------------------------------------------------------------- |
| Allowed         | `docs/web-demo-loop-report.md`                                |
| Blocked         | `../docs/**`, `references/**`, `src/**`, `demo/**`, `test/**` |
| Required output | `docs/web-demo-loop-report.md`                                |

---

## 9. Verification Commands

### 9.1 This phase (plan)

The loop validator checks `docs/web-demo/web-demo-plan.md` exists and required
inputs are present:

```
src/render/mermaid-to-svg.js
src/render/normalize-svg.js
workflow/reports/svg-output-compatibility.json
```

### 9.2 Phase 03 (implementation)

```bash
bun run build          # demo build via demo/build.js (vite build + i18n copy)
```

Build must exit 0 and produce `demo/dist`. No new runtime deps added.

### 9.3 Phase 04 (verification)

```bash
bun run build
# + manual/automated local page check (dev server on :9999)
```

Verify: input → SVG renders; empty input shows placeholder; invalid input shows
recoverable error; examples gallery renders all 8 types.

### 9.4 Phase 05 (final-report)

Validator checks `docs/web-demo-loop-report.md` exists and all final artifacts
(`demo`, `workflow/reports/web-demo-report.json`) are present.

---

## 10. Commit Sequence

All commits use conventional commits format.

| Order | Phase             | Commit message                                     | Files                                                                             |
| ----- | ----------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1     | 02 plan           | `docs(web-demo): add web demo page plan`           | `docs/web-demo/web-demo-plan.md`                                                  |
| 2     | 03 implementation | `feat(web-demo): convert demo page to mermaid svg` | `demo/**`, `demo/const/mermaidExamples.js`                                        |
| 3     | 03 implementation | `chore(web-demo): record demo report`              | `workflow/reports/web-demo-report.json`                                           |
| 4     | 04 verification   | `docs(web-demo): record demo verification`         | `docs/web-demo/web-demo-verification.md`, `workflow/reports/web-demo-report.json` |
| 5     | 05 final-report   | `docs(web-demo): write web demo loop report`       | `docs/web-demo-loop-report.md`                                                    |

Each commit is made after the phase's verification command passes.

---

## 11. Validator Checkpoints

The web-demo loop validator (`workflow/loops/web-demo/lib/validators.ts` →
`validateRemainingPhase`) enforces:

1. `docs/web-demo/web-demo-plan.md` exists (plan phase required artifact).
2. Required inputs exist for all phases:
   `src/render/mermaid-to-svg.js`, `src/render/normalize-svg.js`,
   `workflow/reports/svg-output-compatibility.json`.
3. Final artifacts exist at final-report: `demo`,
   `workflow/reports/web-demo-report.json`, `docs/web-demo-loop-report.md`.

These are machine-checked gates (existence-based). The implementation must also
keep the demo free of blocked patterns (`puppeteer`, `playwright`, `screenshot`,
`canvas`, etc.).

---

## 12. Risk Register

| Risk                                                              | Mitigation                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Renderer/normalizer import paths from `demo/` differ in Vite root | `vite.config.js` sets `root: "demo"`. Imports use relative paths `../src/render/...` resolved from project root, or configure an alias. Confirm in implementation. |
| Mermaid bundle is large and slows dev/build                       | Acceptable; `optimizeDeps.include: ["mermaid"]` already used in tests. Mermaid is the only runtime dep and the size chart (Size Loop) will quantify it.            |
| Normalized SVG injection via `innerHTML` may run inline scripts   | The normalizer already strips `<script>`, `on*` handlers, and `javascript:` URIs (verified by svg-output contract). Safe to inject.                                |
| Gallery live-rendering 8 diagrams on load may be slow             | Render lazily (IntersectionObserver) or render once and cache the normalized string.                                                                               |
| Removing the Math usage card may leave the page feeling empty     | Keep a repurposed usage card or the benchmark placeholder shell to preserve visual density.                                                                        |
| Hardcoded English text feels incomplete vs i18n                   | Explicitly marked TODOs; full i18n is a separate loop. Page is coherent in English now.                                                                            |
| `demo/i18n/**` parity broken if Math keys are removed             | Do NOT delete existing keys; only add new Mermaid strings as hardcoded English this loop.                                                                          |

---

## 13. Out of Scope for Web Demo Loop

- Beautiful Mermaid CSS theme switching (Theme Loop).
- Size / gzip comparison SVG bar chart and real data (Size Loop).
- Translation keys across 75 locales (I18N Loop).
- Cloudflare Pages deployment config (Deploy Loop).
- Expanding the test corpus beyond 18 cases (deferred per HG-2).
- Self-built Mermaid parser or layout engine (never).
- SVG download / save / history (non-goal per spec §14).

---

## 14. Open Questions (deferred, do not block this plan)

1. **Benchmark card shells**: keep empty placeholders vs remove until Size Loop.
   Recommendation: keep a single empty shell with a TODO to preserve layout.
2. **Usage card**: repurpose as a converter usage snippet vs remove.
   Recommendation: repurpose, to keep information density parity with upstream.
3. **Example snippet exact text**: finalized in implementation by reading the
   shortest accepted YAML per type; no decision needed in this plan.

These are implementation-level choices that do not affect the plan's scope,
constraints, or acceptance gates.
