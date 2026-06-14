# Size Loop Final Report

Size Loop Phase 05 artifact. This is the final report for the Size / Gzip
Comparison Loop. It summarizes the artifacts produced, data sources,
measurement methodology, chart wiring, and verification outcome.

Machine-readable companion: `workflow/reports/size-report.json`.
Plan: `docs/size/size-plan.md`.

---

## 1. Loop Scope and Outcome

The Size Loop generated traceable raw + gzip JS size data for
`beautiful-mermaid` and our project, and wired the demo page's SVG bar chart
to that data.

| Aspect | Result |
|---|---|
| Mission | Generate traceable size data and connect demo SVG bar chart |
| Status | **pass** |
| Report script | `sh/size-report.js` |
| Report JSON | `workflow/reports/size-report.json` |
| Chart data source | `demo/const/sizeData.js` (auto-generated from report) |
| Chart renderer | `demo/webc/js/sizeChart.js` |
| Blocked patterns found | 0 |
| i18n or deployment files touched | no |

### 1.1 Acceptance criteria coverage

| AC ref | Requirement | Status |
|---|---|---|
| AC-COMPARE-001 | Page contains an SVG bar chart (not PNG/canvas) | pass |
| AC-COMPARE-002 | Exactly four numbers; no unrelated vendor chunks | pass |
| AC-COMPARE-003 | Proxy wording on page; no runtime-benchmark claim | pass |
| AC-COMPARE-004 | Size report script-generated; page data == report | pass |
| HG-4 | Local `references/beautiful-mermaid` as traceable source; commit pinned | pass |
| spec §9.1 | Chart is SVG bar chart with title, legend, units, disclaimer | pass |
| spec §9.4 | `workflow/reports/size-report.json` exists with required fields | pass |

---

## 2. Artifacts Produced

| File | Type | Purpose |
|---|---|---|
| `sh/size-report.js` | Script | Bundles beautiful-mermaid from local references; measures both sides; writes report + page data |
| `workflow/reports/size-report.json` | Report (JSON) | Canonical size data with full provenance |
| `demo/const/sizeData.js` | Generated ES module | Page-facing data mirror (single source → both files) |
| `demo/webc/js/sizeChart.js` | Renderer | Pure SVG bar chart renderer (4 bars, gridlines, legend, labels) |
| `demo/index.pug` | Template | Chart container `#size-chart` replacing `TODO(size-loop)` |
| `demo/index.js` | Entry | Imports `SIZE_DATA` + `renderSizeChart`, calls on init |
| `demo/style.styl` | Styles | Responsive sizing for `.size-chart-container svg` |

---

## 3. Measurement Methodology

### 3.1 beautiful-mermaid side

Beautiful-mermaid's JS is measured by bundling its source from the local
reference repository:

```
bun build references/beautiful-mermaid/src/index.ts \
  --external elkjs --external entities \
  --outfile <tmp>/beautiful-mermaid-bundle.js
```

This matches the library's own `tsup.config.ts` externals configuration.
The bundle represents the library's shipped JS code (what
`dist/index.js` would contain after `tsup` build). Dependencies
(`elkjs`, `entities`) are externalized — consistent with how the npm
package and CDN entry work.

Provenance:
- repo: `lukilabs/beautiful-mermaid`
- localPath: `references/beautiful-mermaid`
- commit: `2ac8bbbb060ca0a65a6a21f3200bd99b1587b488`
- version: `1.1.3` (`git describe`: `v1.1.3-12-g2ac8bbb`)

### 3.2 Our-project side

Our entry JS is measured from the actual Vite build output. The script
reads `demo/dist/index.html` to find the entry `<script type="module">`
tag, resolves the hashed filename (e.g. `index-t5kwL7Tc.js`), and
measures that file.

This is the "target JS file" per AC-COMPARE-002 — our project's entry
bundle that boots the demo. Per spec §9.2, we do NOT aggregate vendor
chunks (mermaid library chunks, layout libraries) into the comparison;
only our own entry JS is measured.

### 3.3 gzip convention

Both sides gzipped identically using Node's `zlib.gzipSync(buffer)` with
default compression level. Same method for both → fair comparison.

### 3.4 Measured values (latest run)

| Side | Raw bytes | Gzip bytes | Display |
|---|---|---|---|
| beautiful-mermaid v1.1.3 | 328,094 | 66,816 | 320.4K raw / 65.2K gzip |
| mermaid2svg (entry JS) | 127,100 | ~41,780 | 124.1K raw / 40.8K gzip |

Ratio: beautiful-mermaid is ~2.6× larger than our entry JS (raw).

### 3.5 Scope clarification

This comparison measures **JS file size only** as a performance proxy. It
is explicitly NOT a runtime benchmark (spec §9.3, AC-COMPARE-003). The
page displays the disclaimer "performance proxy, not a runtime
benchmark".

Key scope notes:
- beautiful-mermaid's externals (`elkjs`, `entities`) are not inlined;
  our mermaid dependency chunks are not aggregated. Both sides compare
  the project's own JS code.
- Non-JS assets (CSS, images, fonts, HTML) are excluded per
  AC-COMPARE-002.
- Gzip byte count may fluctuate ±3 bytes across builds due to content
  hash changes in the entry filename; raw bytes are stable.

---

## 4. Chart Implementation

### 4.1 Architecture

```
sh/size-report.js (build-time)
  ├── bundles beautiful-mermaid → temp file → measure
  ├── finds our entry JS in demo/dist/index.html → measure
  ├── writes workflow/reports/size-report.json (canonical)
  └── writes demo/const/sizeData.js (page-facing copy)

demo/index.js (runtime)
  ├── imports SIZE_DATA from demo/const/sizeData.js
  ├── imports renderSizeChart from demo/webc/js/sizeChart.js
  └── calls renderSizeChart(SIZE_DATA) → SVG element → #size-chart
```

Single script writes both the report and the page data from one
in-memory measurement, eliminating drift between report and page.

### 4.2 Chart features

- Real SVG element created via `document.createElementNS`
- `viewBox="0 0 440 280"` for responsive scaling
- Four bars: BM raw (solid gray), BM gzip (translucent gray),
  ours raw (solid accent), ours gzip (translucent accent)
- Y-axis gridlines with KB labels (auto-scaled via `niceScale`)
- Legend distinguishing Raw vs Gzip
- X-axis labels: "beautiful-mermaid" and "mermaid2svg"
- Value labels above each bar (formatted KB)
- Ratio annotation: "2.6× smaller"
- Proxy disclaimer in card header (i18n-deferred)

### 4.3 Data consistency

`demo/const/sizeData.js` is auto-generated by `sh/size-report.js` and
contains exactly the same four numbers as
`workflow/reports/size-report.json`. The script header declares
"Auto-generated by sh/size-report.js — do not edit manually".

---

## 5. Verification

### 5.1 Build verification

```
$ bun run build
✓ built in 263ms

$ bun sh/size-report.js
size-report.json -> workflow/reports/
  beautiful-mermaid 1.1.3 (v1.1.3-12-g2ac8bbb)
    raw:  328094 bytes
    gzip: 66816 bytes
  ours (demo/dist/assets/index-t5kwL7Tc.js)
    raw:  127100 bytes
    gzip: 41780 bytes
```

### 5.2 Data consistency check

`demo/const/sizeData.js` values match `workflow/reports/size-report.json`
byte-for-byte:

| Field | sizeData.js | size-report.json | Match |
|---|---|---|---|
| BM rawBytes | 328094 | 328094 | ✓ |
| BM gzipBytes | 66816 | 66816 | ✓ |
| ours rawBytes | 127100 | 127100 | ✓ |
| ours gzipBytes | 41780 | 41780 | ✓ |

### 5.3 Blocked patterns scan

No instances of "runtime benchmark", "estimated size", or "manual size
data" in any size-loop artifact. The page displays "performance proxy,
not a runtime benchmark".

### 5.4 Spec compliance review

Spec compliance review: 9/9 checks passed.
Code quality review: passed after snake_case variable naming fix.

---

## 6. Deviations from Plan

The plan (`docs/size/size-plan.md`) proposed a more elaborate
methodology. Key differences in implementation:

1. **beautiful-mermaid target**: The plan proposed building a full
   browser bundle (`src/browser.ts` with all deps inlined). The
   implementation uses the library entry (`src/index.ts` with tsup-matched
   externals). This is more consistent with AC-COMPARE-002's
   "beautiful-mermaid CDN JS 文件" (the npm CDN entry has externals).

2. **Our target**: The plan proposed aggregating ALL reachable render-path
   chunks. The implementation measures only the entry JS. This is more
   consistent with AC-COMPARE-002's "本项目打包后的目标 JS 文件" (singular)
   and its explicit exclusion of "unrelated vendor chunk".

3. **Script name**: Plan called it `sh/gen-size.js`; implementation uses
   `sh/size-report.js`.

4. **gzip level**: Plan specified level 9; implementation uses default
   `zlib.gzipSync` level. Both sides use the same method, so the
   comparison is fair.

These deviations simplify the implementation while remaining strictly
within spec requirements.

---

## 7. Deferred

| Item | Owner |
|---|---|
| i18n keys for chart labels | I18N Loop |
| Cloudflare Pages deployment with size chart | Deploy Loop |
| Static `demo/size.svg` / `demo/speed.svg` cleanup | Final Audit |
| `package.json` `size:report` script | Not in allowed files for this loop |
