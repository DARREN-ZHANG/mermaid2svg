# SVG Output Compatibility Plan

SVG Output Loop Phase 02 artifact. This document specifies the narrow
implementation plan for normalizing the raw SVG produced by the Render Loop
renderer into a stable, embeddable SVG contract.

Subsequent svg-output-loop phases (`03 normalizer-implementation`,
`04 compatibility-tests`, `05 validation`, `06 final-report`) implement against
this plan. Nothing in this plan changes UI, theme, size, i18n, or deployment
code.

---

## 1. Scope and Constraints

### 1.1 What this plan covers

- A standalone SVG normalization module that wraps renderer output.
- The acceptance rules (the "SVG contract") every normalized output must obey.
- The compatibility test runner and machine-readable compatibility report shape.
- Verification commands, file boundaries per phase, commit sequence, and risks.

### 1.2 What this plan does NOT cover

- Replacing or re-implementing the render path. The Render Loop's
  `renderMermaidToSvg` stays the source of raw SVG.
- Demo UI, theme switching, size/gzip comparison, i18n, deployment.
- Expanding the 18-case test corpus (deferred per HG-2 until loop evidence exists).

### 1.3 Inputs (produced by the Render Loop)

| Input | Role |
|---|---|
| `src/render/mermaid-to-svg.js` | Returns `[OK, rawSvg, diagramType]` on success, `[errCode, msg]` on failure. Initialized with `securityLevel: "strict"`, `suppressErrorRendering: true`. |
| `test/render-yml.test.mjs` | Playwright harness pattern to reuse: Vite middleware + real Chromium + `page.evaluate` to call the wrapper in-page. |
| `workflow/reports/render-capabilities.json` | 18/18 cases render; all eight HG-1 MVP diagram types covered. Proves raw SVG exists for every supported case. |

### 1.4 Outputs (produced by this loop)

| Output | Phase |
|---|---|
| `src/render/normalize-svg.js` | 03 normalizer-implementation |
| `test/svg-output.test.mjs` | 04 compatibility-tests |
| `workflow/reports/svg-output-compatibility.json` | 04 compatibility-tests / 05 validation |
| `docs/svg-output/svg-output-validation.md` | 05 validation |
| `docs/svg-output-loop-report.md` | 06 final-report |

### 1.5 Hard constraints

| Constraint | Detail |
|---|---|
| No self-built parser | Normalization operates on the SVG *string/DOM*, never on Mermaid source text |
| No self-built layout | Mermaid layout output is preserved; only structure/attributes are normalized |
| No server rendering | Normalizer runs in the same browser page context as the renderer |
| Test harness | Playwright (already `^1.60.0`) calls the wrapper in-page and asserts SVG string/DOM |
| No screenshot/canvas oracle | Pass/fail is based on SVG string and DOM structure, never pixels |
| General rules only | No fixture-specific patches tied to an individual test id |
| Blocked patterns in normalizer source | `puppeteer`, `playwright`, `@mermaid-js/mermaid-cli`, `screenshot`, `canvas`, `html2canvas`, `toDataURL`, `remote mermaid service` |

---

## 2. Determinism hazard in raw renderer output

The renderer generates a unique id per call:

```
const render_id = "m2s-" + ++counter;   // src/render/mermaid-to-svg.js:44
mermaid.render(render_id, mermaidText);
```

Mermaid embeds this id deeply into the raw SVG:

- Root: `<svg id="m2s-1" ...>`
- Internal `<style>` selectors: `#m2s-1 .node rect`, `#m2s-1 .edgePath path`
- Markers / clip paths: `<marker id="m2s-1-flowchart-pointEnd">`, referenced by
  `marker-end="url(#m2s-1-flowchart-pointEnd)"`.

Consequence: the **same** Mermaid input produces a **byte-different** SVG on the
next call (the id suffix `1` becomes `2`, `3`, ...). This is the single largest
non-determinism source and the primary thing normalization must remove.

The determinism rule in Section 4.4 resolves it with one general operation:
detect the render id from the root `<svg id>` and replace **every** occurrence
of that token with a single stable canonical id. This covers the root id, the
style selectors, the marker ids, and all `url(#…)` references uniformly —
without touching any fixture-specific content.

---

## 3. Normalizer Module

### 3.1 Path

```
src/render/normalize-svg.js
```

### 3.2 Responsibility

Accept a raw SVG string (as returned by `renderMermaidToSvg`) and return a
normalized, deterministic, embeddable SVG string — or an explicit structured
error. It does not call Mermaid and does not import any test harness.

### 3.3 Public API

```js
export const OK = 0,
  ERR_NO_SVG = 100,    // input has no <svg> root
  ERR_VIEWBOX = 101,   // cannot establish a usable coordinate space
  ERR_PARSE = 102;     // SVG markup could not be parsed/serialized

// Normalize a raw SVG string into the stable SVG contract.
// Returns [OK, normalizedSvg] | [errCode, message]
export const normalizeSvg = (rawSvg) => { ... }
```

Tuple/array return per project convention (no object returns, no string status).
Numeric error codes per project convention.

> Code-range note: the renderer uses codes `0`–`4` (`ERR_EMPTY`…`ERR_TIMEOUT`).
> The normalizer intentionally uses `100`+ so a composed caller
> (`renderMermaidToSvg` → `normalizeSvg`) can disambiguate *which layer* failed
> from the numeric code alone, without binding-name collisions when both
> modules are imported into one file.

### 3.4 Integration with the renderer

- `renderMermaidToSvg`'s existing return contract
  (`[OK, svg, diagramType]` / `[errCode, msg]`) is **preserved** so the
  Render Loop test (`test/render-yml.test.mjs`) keeps passing unchanged.
- `normalize-svg.js` is a **sibling** module. Callers compose the two steps:

  ```
  const [code, raw] = await renderMermaidToSvg(text);
  if (code !== OK) return [code, raw];          // pass errors through
  return normalizeSvg(raw);                      // [OK, normalized] | [err, msg]
  ```

- The implementation phase is *allowed* to edit `mermaid-to-svg.js` (per its
  prompt), but the only permitted change there is an optional convenience
  re-export. The raw return tuple must stay backward compatible.

### 3.5 Recommended implementation approach

Parse the SVG with the browser-native `DOMParser` (available in the page
context the test harness and demo use), apply the rules below, then serialize
with the browser-native `XMLSerializer`. This avoids any heavy dependency and
keeps the normalizer free of blocked patterns.

A pure regex approach is rejected for the parse/serialize step because robust
SVG traversal is fragile with regex; however the **id-token rewrite** (Section
4.4) is applied to the serialized string where a single global replace is exact.

The module must run in a browser DOM context because `DOMParser`/`XMLSerializer`
are browser APIs. The compatibility test harness loads it in-page via Playwright
(Section 5.4), exactly like the render harness loads the renderer.

### 3.6 What the normalizer does NOT do

- Does not import Playwright, Puppeteer, or any test/render harness.
- Does not call Mermaid, parse Mermaid source, or compute layout.
- Does not implement theme CSS, size reporting, or i18n.
- Does not contain any blocked pattern (Section 1.5).
- Does not hardcode behavior to a specific test id.

---

## 4. The SVG Contract (acceptance rules)

Every normalized output must satisfy all rules below. Each rule is *general* —
it applies to any valid Mermaid SVG, not to a single fixture.

### 4.1 Root `<svg>`

| Rule | Detail |
|---|---|
| Exactly one top-level root | The input must contain exactly one *top-level* `<svg>` element (nested `<svg>` inside `<g>` is allowed and preserved). Anything before/after the top-level root (HTML doctype, stray whitespace, comments) is trimmed. |
| Namespace | Root must carry `xmlns="http://www.w3.org/2000/svg"`. Add if missing. |
| Error | If no `<svg>` root is present → `[ERR_NO_SVG, "no svg root"]`. |

### 4.2 `viewBox`

| Rule | Detail |
|---|---|
| Preserve | If a `viewBox` attribute exists on root, keep it unchanged. |
| Derive | If absent, parse root `width`/`height` (numeric px) and set `viewBox="0 0 W H"`. |
| Error | If neither `viewBox` nor usable numeric `width`/`height` exist → `[ERR_VIEWBOX, "cannot derive viewBox"]`. |

Mermaid output normally includes a `viewBox`, so this rule is defensive but
must be implemented as a real general check, not an assumption.

### 4.3 Dimensions

| Rule | Detail |
|---|---|
| Stable | Preserve Mermaid's intrinsic `width`/`height` when present; do not inject volatile values. |
| Embeddable | The SVG is embeddable because a valid `viewBox` (4.2) lets it scale. Do not force `width="100%"`. |

### 4.4 Deterministic output

| Rule | Detail |
|---|---|
| Id de-volatilization | Detect the render id from root `<svg id="…">`; replace **all** occurrences of that exact token in the serialized output with one stable canonical id (e.g. `mermaid-svg`). This fixes root id, `#id` style selectors, marker/clip ids, and `url(#…)` references in one operation. |
| Implementation note | Use a literal string replace (`str.split(token).join(canonical)` or `str.replaceAll(token, canonical)` with a *string* first arg) — never a `RegExp(token)`, since the id may contain regex metacharacters. |
| Stability | For two successive `renderMermaidToSvg` calls on the same input, `normalizeSvg` must return **byte-identical** strings. |
| If no root id | Skip the rewrite (output already has no volatile token). |

### 4.5 No runtime JS dependency

| Rule | Detail |
|---|---|
| Strip `<script>` | Remove every `<script>` element and its text content. |
| Strip event handlers | Remove any attribute whose name starts with `on` (`onclick`, `onload`, …). |
| Strip `javascript:` URIs | Remove `href`/`xlink:href` values that begin with `javascript:`. |
| Assertion | Normalized output must contain no `<script` and no `on*=` handler attribute. |

Mermaid's `securityLevel: "strict"` already sanitizes most of this; the
normalizer is the defensive output layer that guarantees it regardless of
Mermaid version or security-level drift.

### 4.6 Error result shape

| Situation | Return |
|---|---|
| Success | `[OK, normalizedSvg]` |
| No `<svg>` root | `[ERR_NO_SVG, message]` |
| Unusable coordinate space | `[ERR_VIEWBOX, message]` |
| DOMParser/serialize failure | `[ERR_PARSE, message]` |
Errors are always an explicit numeric code + string message, never a thrown
exception, never a silently mutated SVG, never a partial/empty string.

---

## 5. Compatibility Test Runner

### 5.1 Path

```
test/svg-output.test.mjs
```

### 5.2 Responsibility

Prove the SVG contract holds against real renderer output for the supported
corpus, and prove each rule on targeted synthetic inputs. Produce the
machine-readable compatibility report.

### 5.3 Test framework

Node.js built-in test runner (`node:test` + `node:assert/strict`) — same as the
render harness, no extra runner dependency.

### 5.4 Browser context (reused pattern)

Because `normalizeSvg` uses browser-native `DOMParser`/`XMLSerializer`, the
runner reuses the Render Loop harness shape:

1. Start Vite in middleware mode (resolves the `mermaid` bare import).
2. Launch Playwright Chromium.
3. Load both modules in-page: the renderer and the normalizer.
4. For each case, `page.evaluate` to `renderMermaidToSvg` then `normalizeSvg`.

Screenshots / canvas / image data are **not** used as an oracle (HG-3). The
oracle is the SVG string and parsed DOM structure.

### 5.5 Test coverage

**A. Contract over the supported corpus (18 cases).** For each non-skipped YAML
case, render → normalize, then assert:

- `[0, svg]` returned (no error).
- Normalized string contains `<svg` root.
- Normalized string contains a `viewBox`.
- Normalized string contains **no** `<script`.
- Determinism: render+normalize the same input twice → identical strings.
- Determinism across the render counter: the raw SVGs differ (volatile id) but
  the **normalized** SVGs are identical — directly proving Section 4.4.

**B. Rule-level tests on synthetic SVG strings** (no Mermaid call needed):

| Test | Input | Expectation |
|---|---|---|
| Missing root | `<div></div>` | `[ERR_NO_SVG, …]` |
| Empty/garbage | `""` / `"not svg"` | `[ERR_NO_SVG, …]` |
| Script removal | `<svg><script>alert(1)</script><rect/></svg>` | normalized has no `<script` |
| Event handler removal | `<svg><rect onclick="x"/></svg>` | normalized has no `onclick` |
| `javascript:` URI removal | `<svg><a xlink:href="javascript:alert(1)"/></svg>` | href dropped |
| viewBox derivation | `<svg width="100" height="50"><rect/></svg>` | gains `viewBox="0 0 100 50"` |
| viewBox preserved | `<svg viewBox="0 0 10 10">…</svg>` | viewBox unchanged |
| Determinism of id rewrite | two SVGs differing only in `<svg id="m2s-1">` vs `m2s-2` (+ matching internal refs) | normalize to identical strings |

These are general structural assertions, not fixture-specific patches.

### 5.6 Required literal references in test source

Per `workflow/loops/svg-output/lib/validators.ts`, `test/svg-output.test.mjs`
must contain these literal strings (static validation anchors):

- `normalize-svg` — module under test
- `viewBox` — rule assertion
- `deterministic` — rule assertion
- `runtime JS` — rule label (e.g. a test name or comment such as
  `// runtime JS must be absent from normalized output`)
- `script` — rule assertion

These anchors exist so the validator can statically confirm the rule surface is
covered; they must appear verbatim in the test source.

---

## 6. Compatibility Report

### 6.1 Path

```
workflow/reports/svg-output-compatibility.json
```

### 6.2 Shape

```json
{
  "generatedAt": "2026-06-13T17:00:00.000Z",
  "corpusTotal": 18,
  "checkedRules": [
    { "rule": "svg-root", "passed": 18, "failed": 0 },
    { "rule": "viewBox", "passed": 18, "failed": 0 },
    { "rule": "dimensions", "passed": 18, "failed": 0 },
    { "rule": "deterministic", "passed": 18, "failed": 0 },
    { "rule": "no-runtime-js", "passed": 18, "failed": 0 },
    { "rule": "error-shape", "passed": 18, "failed": 0 }
  ],
  "summary": {
    "total": 18,
    "passed": 18,
    "failed": 0,
    "deterministic": true
  },
  "failures": []
}
```

### 6.3 Required fields (per validator)

| Field | Type | Validator check |
|---|---|---|
| `summary` | object | present |
| `summary.deterministic` | boolean | present |
| `checkedRules` | array | present |
| `failures` | array | present |

Each entry in `failures` records `{ id, rule, reason }` so a failure is
traceable to a case and a rule. No failure is ever silently dropped.

---

## 7. Validator checkpoints (machine gates)

`workflow/loops/svg-output/lib/validators.ts` enforces, for the relevant phases:

1. `src/render/normalize-svg.js` must exist and:
   - Contain literal tokens: `viewBox`, `svg`, `script`, `deterministic`.
   - Contain an `export`.
   - Contain **none** of the blocked patterns (Section 1.5).
2. `test/svg-output.test.mjs` must exist and contain literal references:
   `normalize-svg`, `viewBox`, `deterministic`, `runtime JS`, `script`.
3. `workflow/reports/svg-output-compatibility.json` must exist with
   `summary` (+ `summary.deterministic`), `checkedRules`, `failures`.
4. Render inputs stay present:
   `src/render/mermaid-to-svg.js`, `test/render-yml.test.mjs`,
   `workflow/reports/render-capabilities.json`.

The implementation must satisfy these exactly; they are checked by
`node --test workflow/loops/svg-output/svg-output-loop.test.mjs`.

---

## 8. File boundaries by phase

### Phase 03 (normalizer-implementation)

| | Path |
|---|---|
| Allowed | `src/render/normalize-svg.js`, `src/render/mermaid-to-svg.js` (backward-compatible only), `docs/svg-output/**`, `workflow/runs/svg-output/**` |
| Blocked | `../docs/**`, `references/**`, `demo/**`, `test/**`, `extract/**`, `workflow/reports/**` |
| Required output | `src/render/normalize-svg.js` |

### Phase 04 (compatibility-tests)

| | Path |
|---|---|
| Allowed | `test/svg-output.test.mjs`, `workflow/reports/svg-output-compatibility.json`, `docs/svg-output/**`, `workflow/runs/svg-output/**` |
| Blocked | `../docs/**`, `references/**`, `demo/**`, `test/*.yml`, `extract/**` |
| Required outputs | `test/svg-output.test.mjs`, `workflow/reports/svg-output-compatibility.json` |

### Phase 05 (validation)

| | Path |
|---|---|
| Allowed | `docs/svg-output/svg-output-validation.md`, `workflow/reports/svg-output-compatibility.json`, `workflow/runs/svg-output/**` |
| Blocked | `../docs/**`, `references/**`, `demo/**`, `src/**`, `test/**`, `extract/**` |
| Required outputs | `docs/svg-output/svg-output-validation.md`, `workflow/reports/svg-output-compatibility.json` |

### Phase 06 (final-report)

| | Path |
|---|---|
| Allowed | `docs/svg-output-loop-report.md`, `workflow/runs/svg-output/**` |
| Blocked | `../docs/**`, `references/**`, `demo/**`, `src/**`, `test/**`, `extract/**`, `workflow/reports/**` |
| Required output | `docs/svg-output-loop-report.md` |

---

## 9. Verification commands

### 9.1 This phase (compatibility-plan)

```bash
node --test workflow/loops/svg-output/svg-output-loop.test.mjs
```

Confirms loop infrastructure is intact and the plan file exists.

### 9.2 Phase 03 (normalizer-implementation)

```bash
node --test workflow/loops/svg-output/svg-output-loop.test.mjs
```

### 9.3 Phase 04 (compatibility-tests)

```bash
node --test test/svg-output.test.mjs workflow/loops/svg-output/svg-output-loop.test.mjs
```

### 9.4 Phase 05 (validation) — full gate

```bash
node --test test/svg-output.test.mjs test/render-yml.test.mjs workflow/loops/svg-output/svg-output-loop.test.mjs
```

Both the SVG output tests and the Render Loop tests must pass (no regression).

### 9.5 Phase 06 (final-report)

```bash
node --test workflow/loops/svg-output/svg-output-loop.test.mjs
```

---

## 10. Commit sequence

All commits use conventional commits format.

| Order | Phase | Commit message | Files |
|---|---|---|---|
| 1 | 02 compatibility-plan | `docs(svg-output): add svg output compatibility plan` | `docs/svg-output/svg-output-plan.md` |
| 2 | 03 normalizer-implementation | `feat(svg-output): add svg normalizer with stable output contract` | `src/render/normalize-svg.js` (+ optional re-export) |
| 3 | 04 compatibility-tests | `test(svg-output): add compatibility tests and report` | `test/svg-output.test.mjs`, `workflow/reports/svg-output-compatibility.json` |
| 4 | 05 validation | `docs(svg-output): record compatibility validation results` | `docs/svg-output/svg-output-validation.md`, `workflow/reports/svg-output-compatibility.json` |
| 5 | 06 final-report | `docs(svg-output): write svg output loop final report` | `docs/svg-output-loop-report.md` |

Each commit is made after its phase verification command passes.

---

## 11. Risk register

| Risk | Mitigation |
|---|---|
| `DOMParser`/`XMLSerializer` are browser-only; Node unit tests cannot import the normalizer directly | Run normalizer assertions through the Playwright in-page harness, like the render tests |
| Id rewrite could miss a reference if Mermaid changes id embedding | Detect the id from root `<svg id>` and globally replace that exact token; covered by a synthetic determinism test |
| Id-token rewrite could false-positive on visible text equal to the render id (`m2s-1`) | The render id is a generated counter token with negligible collision odds against user label text; if deemed material, scope the rewrite to `id=`, `url(#`, and `#`-selector contexts instead of a blind global replace. Record the chosen scope in the validation doc. |
| `securityLevel: "strict"` may already strip `<script>`, making the rule look untestable | Add a synthetic `<script>` input to prove the normalizer removes it independently of Mermaid |
| Normalization could alter layout-visible attributes | Rules only touch id tokens, `viewBox` derivation, and unsafe nodes — never geometry, paths, or text |
| Re-serializing via `XMLSerializer` could reorder attributes | Determinism is asserted per-input (byte-identical on repeat); attribute order within one browser is stable |
| Editing `mermaid-to-svg.js` could break the Render Loop tuple contract | Treat renderer edits as optional re-export only; never change `[OK, svg, diagramType]` / `[errCode, msg]` |
| A future Mermaid version emits volatile content beyond the render id | Record actual behavior in the validation doc; expand rules only with a general mechanism, never a fixture patch |

---

## 12. Out of scope for SVG Output Loop

- Demo page UI, input area, preview area (Web Demo Loop).
- Beautiful Mermaid CSS theme switching (Theme Loop).
- Size / gzip comparison chart (Size Loop).
- i18n key additions (I18N Loop).
- Cloudflare Pages deployment (Deploy Loop).
- Expanding the test corpus beyond the 18 Render Loop cases (deferred per HG-2).
- SVG download / file save (declared non-target in the canonical spec).
