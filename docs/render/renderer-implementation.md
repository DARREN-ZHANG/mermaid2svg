# Renderer Implementation Notes

Render Loop Phase 03 artifact. Records what was implemented, the public contract,
and two test-maintenance decisions that follow from delivering the renderer.

---

## 1. Delivered artifact

```
src/render/mermaid-to-svg.js
```

A thin browser-side wrapper around the official `mermaid` npm package browser
API. It does not implement a Mermaid parser or layout engine, and it does not
call `mermaid.parse` separately (`mermaid.render` parses internally, which keeps
the conversion path shortest).

The module is designed to be loaded inside a real browser page context
(Playwright harness, per HG-3). It is never run in raw Node.

### 1.1 Public contract

```js
import {
  renderMermaidToSvg,
  OK,
  ERR_EMPTY,
  ERR_PARSE,
  ERR_RENDER,
  ERR_TIMEOUT,
} from "./src/render/mermaid-to-svg.js";

const result = await renderMermaidToSvg(mermaidText);
// success: result = [OK, svgString, diagramType]
// failure: result = [errCode, message]
```

| Code | Constant      | Meaning                                            |
| ---- | ------------- | -------------------------------------------------- |
| 0    | `OK`          | success                                            |
| 1    | `ERR_EMPTY`   | empty or whitespace-only input                     |
| 2    | `ERR_PARSE`   | mermaid rejected the syntax / unknown diagram type |
| 3    | `ERR_RENDER`  | parse ok but rendering / layout failed             |
| 4    | `ERR_TIMEOUT` | render exceeded the 10 s budget                    |

### 1.2 Internal behavior

- Empty input guard returns `[ERR_EMPTY, "empty input"]`.
- Lazy `mermaid.initialize({ startOnLoad: false, securityLevel: "strict",
suppressErrorRendering: true })` runs exactly once (module-level flag).
- Unique render id per call: `"m2s-" + (++counter)`.
- `mermaid.render(id, text)` is raced against a 10000 ms timeout. The timeout
  rejects with a tagged error (`err.isTimeout = true`) so it is distinguishable
  from a genuine render error.
- `clearTimeout` runs on both success and failure paths.
- Error classification: `UnknownDiagramError` or parse/syntax/expecting messages
  -> `ERR_PARSE`; everything else -> `ERR_RENDER`.

### 1.3 Static validator compliance

The file satisfies `workflow/loops/render/lib/validators.ts > validateRendererEntry`:

- Imports via `import mermaid from "mermaid"` (matches the required regex).
- Contains the `render` call path.
- Contains none of the blocked substrings (`puppeteer`, `playwright`,
  `@mermaid-js/mermaid-cli`, `screenshot`, `canvas`, `html2canvas`, `toDataURL`,
  `remote mermaid service`) anywhere, including in comments.

---

## 2. Test-maintenance decision: render-loop.test.mjs

The loop's own unit test
`workflow/loops/render/render-loop.test.mjs` has a case
"render validators reject missing artifacts and blocked render paths" that calls
`validateRenderPhase({ id: "validation", requiredArtifacts: [] })`.

That test was authored during Phase 01/02 when **no** render artifacts existed,
so it asserted that the validator reports `src/render/mermaid-to-svg.js` as
missing. Delivering a valid renderer flips `validateRendererEntry` from
"missing" to "valid" (no error), which would break that assertion.

Minimal, faithful evolution applied: the renderer assertion now verifies the
validator **accepts** the valid renderer (no renderer error), while the test
still asserts `ok === false` plus missing `test/render-yml.test.mjs` and
`workflow/reports/render-capabilities.json` (those land in Phase 04). The static
source-reference checks (`assert.match` against the validator source) are
unchanged.

This is the same per-phase evolution the test is designed to undergo as each
artifact lands.

---

## 3. Downstream impact: svg-output and remaining loop tests (evolved here)

Delivering the renderer also flips two **downstream** loop tests, because their
validators treat `src/render/mermaid-to-svg.js` as a required input that must be
absent. The repository `.husky/pre-commit` hook runs every loop contract test,
so a commit is rejected unless these evolve too. They were evolved here as the
minimal faithful fix required by the hook ("if a commit fails or hooks reject
it, fix the issue").

### 3.1 svg-output-loop.test.mjs

Case "svg output validators reject missing artifacts and blocked compatibility
paths" asserted the validator reports `src/render/mermaid-to-svg.js` as missing.
The renderer assertion is flipped to assert the validator now **accepts** the
valid renderer (no error). The remaining three assertions
(`src/render/normalize-svg.js`, `test/svg-output.test.mjs`,
`workflow/reports/svg-output-compatibility.json`) still hold because those
artifacts have not been produced yet. The SVG Output Loop will evolve this test
further when those artifacts land.

### 3.2 remaining-loops.test.mjs

Case "remaining validators reject missing required inputs and outputs" iterates
all downstream loops and asserts each validator reports its first required
input as missing. `web-demo`'s first required input is the renderer, which now
exists. The input assertion is guarded with `existsSync`: the validator must
report a required input only while it is genuinely absent. This keeps the check
meaningful for every loop whose first input is still missing (theme, size,
i18n, deploy, final-audit) and is robust to future upstream artifacts landing.

### 3.3 Notes

- `test.sh` does not execute loop tests; only `.husky/pre-commit` does.
- All 42 pre-commit hook tests pass after these evolutions.
- These are reversible, minimal changes that strengthen (not weaken) the
  contract tests by decoupling them from the global "nothing exists yet"
  filesystem state.

---

## 4. Verification

```bash
node --test workflow/loops/render/render-loop.test.mjs
# -> 7/7 pass
```

Behavioral verification (running `mermaid.render` against the extracted
`test/*.yml` corpus inside a Playwright browser) is Phase 04
(`test/render-yml.test.mjs`) and is out of scope for this phase.
