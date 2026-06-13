# Renderer Implementation Plan

Render Loop Phase 02 artifact. This document specifies the narrow implementation
plan for the Mermaid source to SVG renderer and the YAML render test runner.

Subsequent render-loop phases (03 renderer-implementation, 04 render-test-runner,
05 validation) implement against this plan.

---

## 1. Scope and Constraints

### 1.1 What this plan covers

- Browser-side renderer module that wraps the official Mermaid browser API.
- YAML render test runner that validates extracted `test/*.yml` cases.
- Capability report shape for recording supported / unsupported results.
- Verification commands and commit sequence.

### 1.2 Hard constraints

| Constraint | Detail |
|---|---|
| Render engine | Official `mermaid` npm package browser API (`mermaid.render`) |
| No self-built parser | Mermaid source text is passed directly to `mermaid.render` |
| No self-built layout | Mermaid's internal layout engine handles all layout |
| No server rendering | All rendering happens in a browser DOM context |
| No online services | No third-party conversion endpoints |
| Test harness | Playwright (already a devDependency at `^1.60.0`) calls the renderer and asserts SVG string/DOM structure |
| No screenshot oracle | Pass/fail is based on SVG string and DOM structure, not pixel comparison |
| Blocked patterns in renderer source | `puppeteer`, `playwright`, `@mermaid-js/mermaid-cli`, `screenshot`, `canvas`, `html2canvas`, `toDataURL` |

### 1.3 Environment facts

- `mermaid` is already a dependency: `"mermaid": "^11.15.0"` (installed: `11.15.0`).
- `playwright` is already a devDependency: `^1.60.0` (installed: `1.60.0`).
- Chromium browsers are already installed for Playwright.
- `js-yaml` is already a devDependency: `^4.2.0`.
- `vite` is already a devDependency: `^8.0.16`.
- The `src/` directory currently holds the upstream MathML library (`lex.js`,
  `parse.js`, `mathml.js`, `md.js`). A new `src/render/` subdirectory will be
  created without touching existing files.

---

## 2. Renderer Module

### 2.1 Path

```
src/render/mermaid-to-svg.js
```

### 2.2 Responsibility

Accept a Mermaid source string, call `mermaid.render(id, text)` in a browser
DOM context, and return the resulting SVG string. Classify and return explicit
errors for empty input, parse failures, render failures, and timeouts.

### 2.3 Mermaid API surface used

From `node_modules/mermaid/dist/mermaid.d.ts`:

```
mermaid.initialize(config: MermaidConfig): void
mermaid.render(id: string, text: string, container?: HTMLElement): Promise<RenderResult>

interface RenderResult {
  svg: string         // The SVG markup
  diagramType: string // e.g. "flowchart", "sequence"
  bindFunctions?: (element: Element) => void
}
```

The `render` function requires a browser DOM (it creates SVG elements, measures
text, and invokes the layout engine). It is therefore only callable from a page
context, never from raw Node.js.

### 2.4 Error code constants

Numeric constants per project convention (no string status codes):

```
OK         = 0  // success
ERR_EMPTY  = 1  // empty or whitespace-only input
ERR_PARSE  = 2  // mermaid rejected the syntax
ERR_RENDER = 3  // mermaid accepted parse but rendering failed
ERR_TIMEOUT= 4  // render exceeded the time budget
```

### 2.5 Public API

```
renderMermaidToSvg(mermaidText) -> [OK, svg, diagramType] | [errCode, message]
```

- On success: returns `[0, svgString, diagramType]`.
- On failure: returns `[errCode, errorMessage]` where `errCode` is one of the
  numeric constants above.
- The function is async.

Signature detail:

```js
export const renderMermaidToSvg = async (mermaidText) => { ... }
```

### 2.6 Internal flow

```
1. Guard: if mermaidText is falsy or .trim() is empty -> [ERR_EMPTY, "empty input"]
2. Lazy init: call mermaid.initialize({ startOnLoad: false, securityLevel: "strict",
   suppressErrorRendering: true }) once (module-level flag).
3. Generate unique render id: "m2s-" + (++counter)
4. Wrap mermaid.render(id, mermaidText) in a timeout race (default 10 s).
5. On success: return [OK, svg, diagramType].
6. On failure: classify the error and return the appropriate [errCode, message].
```

### 2.7 Error classification logic

Mermaid throws `Error` subclasses on parse and render failures. The classifier
inspects the error message and constructor name:

- Error name contains `"Parse"` or error is thrown before SVG generation ->
  `ERR_PARSE`.
- Error occurs during or after layout/SVG generation -> `ERR_RENDER`.
- Timeout race fires -> `ERR_TIMEOUT`.

### 2.8 Exports

```js
export const OK = 0, ERR_EMPTY = 1, ERR_PARSE = 2, ERR_RENDER = 3, ERR_TIMEOUT = 4
export const renderMermaidToSvg = async (mermaidText) => { ... }
```

### 2.9 What the renderer does NOT do

- Does not import Playwright or any test harness.
- Does not modify the SVG output (normalization belongs to the SVG Output Loop).
- Does not implement theme switching, size reporting, or i18n.
- Does not contain any blocked pattern (`puppeteer`, `playwright`, `screenshot`,
  `canvas`, etc.).
- Does not call `mermaid.parse` separately; `mermaid.render` already parses
  internally. Keeping the path shortest.

---

## 3. YAML Render Test Runner

### 3.1 Path

```
test/render-yml.test.mjs
```

### 3.2 Responsibility

1. Read `test/schema.yml` and every `test/*.yml` case (excluding `schema.yml`).
2. Validate each YAML case against the schema structure before rendering.
3. Use Playwright to launch a real Chromium browser.
4. For each non-skipped case, call `renderMermaidToSvg` inside the browser page
   context and assert on the returned SVG.
5. Record supported and unsupported results into
   `workflow/reports/render-capabilities.json`.

### 3.3 Test framework

Node.js built-in test runner (`node:test` + `node:assert/strict`). This matches
the render-loop verification command and avoids adding a separate test runner.

### 3.4 Schema validation (pre-render gate)

The runner reads `test/schema.yml` and performs structural validation on each
`test/*.yml` file before any rendering:

Required top-level keys: `id`, `source`, `diagram`, `input`, `expect`, `skip`.

Required nested fields:
- `source.repo`, `source.path`, `source.url`
- `diagram.type`, `diagram.title`
- `input.mermaid`
- `expect.render`, `expect.svg.root`, `expect.svg.viewBox`, `expect.svg.containsText`
- `skip.enabled`, `skip.reason`

A case failing schema validation is reported as a test failure (not silently
skipped). This satisfies the AC-EXTRACT-007 requirement that every YAML must
pass schema validation before entering render tests.

### 3.5 Browser context setup

The runner needs a browser DOM because `mermaid.render` creates SVG elements.
Approach:

1. Start a Vite dev server programmatically in middleware mode
   (`createServer({ root: process.cwd(), server: { middlewareMode: true } })`).
   Vite resolves the bare `import mermaid from "mermaid"` specifier automatically.
2. Launch Playwright Chromium (`chromium.launch()`).
3. Create a new page and set a minimal HTML document via `page.goto()` to a
   Vite-served URL or `page.setContent()` followed by a dynamic import.
4. Load the renderer module inside the page via
   `page.evaluate(() => import("/src/render/mermaid-to-svg.js"))`.
5. Call `page.evaluate(({ text }) => window.__renderMermaid(text), { text })`
   where `window.__renderMermaid` is assigned from the imported module.

Alternative fallback (if Vite middleware proves heavy):
- Use a lightweight `node:http` static server serving from project root with an
  import map in the HTML head mapping `"mermaid"` to
  `/node_modules/mermaid/dist/mermaid.esm.min.mjs`.

The chosen approach will be confirmed during Phase 04 implementation. Both keep
the renderer module using standard bare imports and avoid hardcoding paths.

### 3.6 Per-case assertions

For each non-skipped case where `expect.render === true`:

| Assertion | Check |
|---|---|
| Result tuple | `result[0] === OK` (0) |
| SVG root | `result[1]` contains `"<svg"` |
| ViewBox | `result[1]` contains `"viewBox"` |
| Contains text | For each `t` in `expect.svg.containsText`: `result[1]` includes `t` (current cases have empty arrays) |

For cases where `expect.render === false`:
- Assert `result[0]` is one of the error codes (not `OK`).

For skipped cases (`skip.enabled === true`):
- Use `test.skip()` so they appear in the report but do not execute.

### 3.7 Capability report generation

After all cases run, the runner writes
`workflow/reports/render-capabilities.json` (see Section 4).

### 3.8 Test runner lifecycle

```
1. before hook: start Vite server + launch browser
2. for each YAML case: schema validate -> render -> assert -> record result
3. after hook: write capabilities report, close browser, stop server
```

### 3.9 Required string references in test runner source

Per `workflow/loops/render/lib/validators.ts`, the test runner source must
contain the following literal strings (used as static validation anchors):

- `"test/schema.yml"` - schema path reference
- `"mermaid-to-svg"` - renderer module reference
- `"viewBox"` - assertion reference
- `"<svg"` - assertion reference

---

## 4. Capability Report

### 4.1 Path

```
workflow/reports/render-capabilities.json
```

### 4.2 Shape

```json
{
  "generatedAt": "2026-06-13T16:00:00.000Z",
  "mermaidVersion": "11.15.0",
  "totalCases": 18,
  "supported": [
    {
      "id": "mm-fc-001",
      "diagramType": "flowchart",
      "sourceRepo": "mermaid-js/mermaid"
    }
  ],
  "unsupported": [
    {
      "id": "some-case-id",
      "diagramType": "someType",
      "sourceRepo": "some/repo",
      "errorCode": 3,
      "errorName": "ERR_RENDER",
      "message": "..."
    }
  ],
  "summary": {
    "total": 18,
    "supportedCount": 18,
    "unsupportedCount": 0,
    "byDiagramType": {
      "flowchart": { "total": 5, "supported": 5, "unsupported": 0 },
      "sequenceDiagram": { "total": 3, "supported": 3, "unsupported": 0 }
    }
  }
}
```

### 4.3 Required fields (per validator)

| Field | Type | Validator check |
|---|---|---|
| `supported` | array | `Array.isArray(report.supported)` |
| `unsupported` | array | `Array.isArray(report.unsupported)` |
| `summary` | object | `typeof report.summary === "object"` |

### 4.4 Current test corpus (18 cases)

| Diagram type | Count | Test IDs |
|---|---|---|
| flowchart | 5 | bm-001, bm-002, maid-001, maid-002, mm-fc-001 |
| sequenceDiagram | 3 | bm-010, maid-010, mm-seq-001 |
| classDiagram | 2 | bm-014, maid-015 |
| stateDiagram | 2 | bm-007, maid-017 |
| erDiagram | 2 | bm-017, mm-other-001 |
| pie | 2 | maid-019, mm-other-005 |
| gantt | 1 | maid-020 |
| other (xychart-beta) | 1 | bm-020 |

All 18 cases currently have `expect.render: true` and `skip.enabled: false`.

---

## 5. File boundaries by phase

### Phase 03 (renderer-implementation)

| | Path |
|---|---|
| Allowed | `src/render/**`, `docs/render/**`, `package.json`, `workflow/runs/render/**` |
| Blocked | `../docs/**`, `references/**`, `demo/**`, `test/*.yml`, `extract/**`, `workflow/reports/**` |
| Required output | `src/render/mermaid-to-svg.js` |

### Phase 04 (render-test-runner)

| | Path |
|---|---|
| Allowed | `test/render-yml.test.mjs`, `workflow/reports/render-capabilities.json`, `docs/render/**`, `package.json`, `workflow/runs/render/**` |
| Blocked | `../docs/**`, `references/**`, `demo/**`, `test/*.yml`, `test/schema.yml`, `extract/**` |
| Required outputs | `test/render-yml.test.mjs`, `workflow/reports/render-capabilities.json` |

### Phase 05 (validation)

| | Path |
|---|---|
| Allowed | `docs/render/render-validation.md`, `workflow/reports/render-capabilities.json`, `workflow/runs/render/**` |
| Blocked | `../docs/**`, `references/**`, `demo/**`, `src/**`, `test/*.yml`, `test/schema.yml`, `extract/**` |
| Required outputs | `docs/render/render-validation.md`, `workflow/reports/render-capabilities.json` |

### Phase 06 (final-report)

| | Path |
|---|---|
| Allowed | `docs/render-loop-report.md`, `workflow/runs/render/**` |
| Blocked | `../docs/**`, `references/**`, `demo/**`, `src/**`, `test/**`, `extract/**`, `workflow/reports/**` |
| Required output | `docs/render-loop-report.md` |

---

## 6. Verification commands

### 6.1 This phase (renderer-plan)

```bash
node --test workflow/loops/render/render-loop.test.mjs
```

This validates that the plan file exists and that the loop infrastructure is
intact.

### 6.2 Phase 03 (renderer-implementation)

```bash
node --test workflow/loops/render/render-loop.test.mjs
```

### 6.3 Phase 04 (render-test-runner)

```bash
node --test test/render-yml.test.mjs workflow/loops/render/render-loop.test.mjs
```

### 6.4 Phase 05 (validation)

```bash
node --test test/render-yml.test.mjs workflow/loops/render/render-loop.test.mjs
```

### 6.5 Phase 06 (final-report)

```bash
node --test workflow/loops/render/render-loop.test.mjs
```

---

## 7. Validator checkpoints

The render-loop validators (`workflow/loops/render/lib/validators.ts`) enforce:

1. `src/render/mermaid-to-svg.js` must exist and:
   - Import from `"mermaid"` or `import("mermaid")`.
   - Contain a render call path.
   - Not contain any blocked pattern: `puppeteer`, `playwright`,
     `@mermaid-js/mermaid-cli`, `screenshot`, `canvas`, `html2canvas`,
     `toDataURL`, `remote mermaid service`.

2. `test/render-yml.test.mjs` must exist and contain literal references to:
   - `test/schema.yml`
   - `mermaid-to-svg`
   - `viewBox`
   - `<svg`

3. `workflow/reports/render-capabilities.json` must exist and contain:
   - `supported` (array)
   - `unsupported` (array)
   - `summary` (object)

These are machine-checked gates. The implementation must satisfy them exactly.

---

## 8. Commit sequence

All commits use conventional commits format.

| Order | Phase | Commit message | Files |
|---|---|---|---|
| 1 | 02 renderer-plan | `docs(render): add renderer implementation plan` | `docs/render/renderer-plan.md` |
| 2 | 03 renderer-implementation | `feat(render): add mermaid-to-svg browser renderer` | `src/render/mermaid-to-svg.js` |
| 3 | 04 render-test-runner | `test(render): add yml render test runner and capability report` | `test/render-yml.test.mjs`, `workflow/reports/render-capabilities.json` |
| 4 | 05 validation | `docs(render): record render validation results` | `docs/render/render-validation.md`, `workflow/reports/render-capabilities.json` |
| 5 | 06 final-report | `docs(render): write render loop final report` | `docs/render-loop-report.md` |

Each commit is made after the phase's verification command passes.

---

## 9. Risk register

| Risk | Mitigation |
|---|---|
| Mermaid `render` needs a full DOM; `happy-dom`/`linkedom` may be insufficient | Use Playwright Chromium as the real-browser harness per HG-3 decision |
| Mermaid `securityLevel: "strict"` may alter SVG output | Record actual behavior in capability report; do not silently change security level |
| Vite middleware server startup may slow tests | Acceptable for correctness; optimize later if CI complains |
| `xychart-beta` (bm-020) may render differently across mermaid versions | Record actual result in capability report; mark unsupported if it fails |
| Mermaid `render` mutates global state (counter resets, ID collisions) | Use incrementing counter for unique IDs; re-initialize per test session |
| Mermaid may append temporary DOM nodes during render | Use a container element that is cleaned up between renders |

---

## 10. Out of scope for Render Loop

- SVG normalization and sanitization (SVG Output Loop).
- Demo page UI, input area, preview area (Web Demo Loop).
- Beautiful Mermaid CSS theme switching (Theme Loop).
- Size / gzip comparison chart (Size Loop).
- i18n key additions (I18N Loop).
- Cloudflare Pages deployment (Deploy Loop).
- Expanding the test corpus beyond the current 18 cases (deferred per HG-2;
  expansion requires render-loop evidence first).
