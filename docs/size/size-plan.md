# Size Loop Plan

> Phase: `plan` (Size Loop). Authoritative plan for the `implementation`,
> `verification`, and `final-report` phases. This document only records the
> plan; it does not generate data or wire the chart.

## 1. Mission

Generate traceable raw + gzip JS size data for two artifacts and connect the
demo SVG bar chart to that data:

1. `beautiful-mermaid` — the comparison peer.
2. Our project — the Mermaid → SVG tool built on the official `mermaid`
   browser API.

The comparison is a **performance proxy only** (file size), explicitly NOT a
runtime benchmark. This satisfies `mermaid-svg-spec.md` §9.3 and
`AC-COMPARE-003`.

## 2. Canonical requirements (locked)

| Source | Clause |
| --- | --- |
| spec §9, §9.1–9.4 | chart must be SVG bar chart; four-number comparison; size report script-generated |
| spec §12 | no runtime benchmark gate in this version |
| AC-COMPARE-001 | page contains an SVG bar chart (not PNG/canvas) |
| AC-COMPARE-002 | exactly four numbers; exclude full-site / unrelated vendor / CSS / fonts |
| AC-COMPARE-003 | proxy wording on page; no runtime-benchmark claim |
| AC-COMPARE-004 | `workflow/reports/size-report.json` is the source of truth; page data == report |
| HG-4 | use local `references/beautiful-mermaid` as traceable source; pin commit; default theme needs no CDN |
| size-loop.config | `blockedPatterns: ["runtime benchmark","estimated size","manual size data"]`; `forbiddenScope: i18n or deployment` |

The four comparison numbers (AC-COMPARE-002):

1. `beautiful-mermaid` CDN/browser JS — raw bytes
2. `beautiful-mermaid` CDN/browser JS — gzip bytes
3. our project target JS — raw bytes
4. our project target JS — gzip bytes

## 3. Comparison-target definitions

### 3.1 beautiful-mermaid side

beautiful-mermaid ships a **browser bundle** produced by `Bun.build` from
`references/beautiful-mermaid/src/browser.ts` (target `browser`, `minify`,
format `esm`). This is the exact artifact their own demo/site loads; it
inlines their renderer plus `elkjs` + `entities`. This is the only honest
apples-to-apples peer because it represents the full JS a browser must
download to render Mermaid with that library.

- **Primary metric (recommended):** the `Bun.build` browser bundle.
- **Secondary reference (recorded, not charted):** `tsup` → `dist/index.js`.
  This is what the npm CDN (jsDelivr/unpkg) serves, but it `external`s
  `elkjs`/`entities`, so it understates the real footprint. Recorded for
  traceability only, clearly labeled "CDN entry, deps externalized".

The CDN URL recorded in the report is
`https://cdn.jsdelivr.net/npm/beautiful-mermaid@1.1.3/dist/index.js`
(version/reference only); the **measured bytes** come from the local browser
bundle so the comparison is fair. This split is explicit in the report.

Provenance pin (from theme-css-report.json, already verified):
- repo: `lukilabs/beautiful-mermaid`
- localPath: `references/beautiful-mermaid`
- commit: `2ac8bbbb060ca0a65a6a21f3200bd99b1587b488`
- version: `1.1.3` (`git describe`: `v1.1.3-12-g2ac8bbb`)

### 3.2 Our-project side

Our project wraps the official `mermaid` npm package
(`src/render/mermaid-to-svg.js` + `src/render/normalize-svg.js`) and builds a
demo via Vite (`bun run build` → `demo/dist`). Vite code-splits `mermaid` into
many lazy chunks (core + per-diagram + dagre/graphlib layout).

**Target = the complete client JS footprint of the Mermaid → SVG tool**,
i.e. the entry chunk plus every dynamically-imported chunk reachable from the
render path. This is the honest peer to beautiful-mermaid's all-in-one
browser bundle: both represent "all JS a browser needs to turn Mermaid text
into SVG".

Inclusion / exclusion rules:

- **Include:** every `.js` file under `demo/dist/assets/` reachable from the
  entry module's import graph (entry → `mermaid` → diagram chunks → layout
  libs → our `src/render/*` wrapper). This inherently includes our thin UI
  glue in `index.js` (theme switcher, i18n hookup, examples gallery, waterfall
  layout) because the spec mandates those as page features and they are
  intrinsic to the deliverable — not "unrelated vendor chunk".
- **Exclude (with recorded reason):** non-JS assets (CSS, images, fonts,
  HTML, webmanifest) per AC-COMPARE-002; and any JS chunk proven **unreachable**
  from the entry (orphan) via a module-graph reachability check.

> Rationale for aggregating chunks instead of one file: the report schema
> (`spec §9.4`) uses a single `entry` + `rawBytes`/`gzipBytes`. Because Vite
> splits `mermaid`, a single chunk would misrepresent the footprint. The plan
> keeps the schema's `entry` field (records the entry chunk filename) but
> fills `rawBytes`/`gzipBytes` with the **aggregate render-path footprint**,
> and adds a `chunks[]` list + `excludedChunks[]` list (with reasons) for full
> traceability. This honors the schema while staying honest about
> code-splitting. AC-COMPARE-002's "unrelated vendor chunk" guard is enforced
> by the reachability check, not by cherry-picking.

### 3.3 What is explicitly NOT compared

- Un-gzipped source size.
- Whole-site bytes (HTML/CSS/images/fonts).
- Genuinely unrelated vendor chunks (none expected; verified in implementation).
- Runtime render speed / memory (out of scope this version).

## 4. Measurement methodology

### 4.1 gzip convention

Both sides gzipped identically: `zlib.gzipSync(buffer, { level: 9 })`
(best compression, matches typical CDN `Content-Encoding: gzip` upper bound).
Same level for both → fair. `rawBytes` = `fs.statSync(f).size`;
`gzipBytes` = gzipped byte length.

### 4.2 beautiful-mermaid build + measure

```
# 1. ensure deps (node_modules only; no source changes in references/)
cd references/beautiful-mermaid && bun install && cd -
# 2. build the SAME browser bundle their demo ships, via the method in index.ts
#    (Bun.build on src/browser.ts, target browser, minify, esm)
# 3. measure dist-browser output (single .js): raw + gzip
```

Implementation note: `references/beautiful-mermaid` currently has no
`node_modules`; `elkjs`/`entities` are present in OUR `node_modules`
(transitively via `mermaid`) as a fallback if `bun install` inside references
is undesirable. `bun install` is preferred (creates `node_modules` only — a
build side-effect, not a source modification; compliant with "do not modify
references source").

### 4.3 Our build + measure

```
bun run build                          # → demo/dist (vite)
# 1. enumerate demo/dist/assets/*.js
# 2. reachability check from entry (vite manifest / import-graph scan)
# 3. sum raw bytes over reachable set; sum gzip bytes over same set
```

Implementation phase decides the reachability mechanism: preferred is reading
the Vite build manifest / Rollup output chunks metadata; fallback is a static
allowlist of the known mermaid render-path chunk prefixes (already visible in
`demo/dist/assets/`: `index-*`, `mermaid-parser*`, `dist-*`, `dagre-*`,
`graphlib-*`, `cose-bilkent-*`, `cytoscape*`, `*Diagram-*`, `flowDiagram-*`,
`pie-*`, `sequenceDiagram-*`, `stateDiagram*`, `erDiagram-*`,
`ganttDiagram-*`, `xychartDiagram-*`, plus shared `chunk-*`, `arc-*`,
`line-*`, `path-*`, `linear-*`, `ordinal-*`, `array-*`, `channel-*`,
`katex-*`, `rough.esm-*`, `src-*`, `init-*`, `defaultLocale-*`). Any prefix
NOT in the render graph is recorded in `excludedChunks` with a reason.

### 4.4 Determinism

Both builds are re-run from clean each time the report is generated. Report
records the build commands, the exact files measured, and a content hash per
measured artifact so verification can confirm the numbers match real bytes.

## 5. Report schema — `workflow/reports/size-report.json`

```json
{
  "generatedAt": "ISO-8601",
  "loop": "size-loop",
  "gzipLevel": 9,
  "scopeNote": "JS file size only; performance proxy, not a runtime benchmark.",
  "beautifulMermaid": {
    "url": "https://cdn.jsdelivr.net/npm/beautiful-mermaid@1.1.3/dist/index.js",
    "urlRole": "version/CDN reference only; measured bytes are from local browser bundle",
    "repo": "lukilabs/beautiful-mermaid",
    "localPath": "references/beautiful-mermaid",
    "sourceFile": "src/browser.ts",
    "commit": "2ac8bbbb060ca0a65a6a21f3200bd99b1587b488",
    "commitDate": "2026-05-06T12:53:19+02:00",
    "version": "1.1.3",
    "gitDescribe": "v1.1.3-12-g2ac8bbb",
    "buildMethod": "Bun.build({ entrypoints:[src/browser.ts], target:'browser', format:'esm', minify:true })",
    "artifact": "references/beautiful-mermaid/<browser-bundle-out>.js",
    "rawBytes": 0,
    "gzipBytes": 0,
    "contentSha256": "",
    "secondaryReference": {
      "label": "tsup dist/index.js (CDN entry, elkjs+entities externalized)",
      "artifact": "references/beautiful-mermaid/dist/index.js",
      "rawBytes": 0,
      "gzipBytes": 0,
      "note": "understates real footprint; recorded for traceability, not charted"
    }
  },
  "ours": {
    "entry": "demo/dist/assets/index-<hash>.js",
    "buildCommand": "bun run build",
    "outputDir": "demo/dist",
    "aggregation": "sum of reachable render-path JS chunks",
    "rawBytes": 0,
    "gzipBytes": 0,
    "chunkCount": 0,
    "chunks": [
      { "file": "demo/dist/assets/index-xxx.js", "rawBytes": 0, "gzipBytes": 0 }
    ],
    "excludedChunks": [
      { "file": "...", "reason": "unreachable from entry / non-JS / ..." }
    ]
  },
  "ratios": {
    "rawMultiple": 0,
    "gzipMultiple": 0
  },
  "verification": {
    "commands": [],
    "exitCodes": {},
    "pageMatchesReport": true
  }
}
```

The page SVG bar chart MUST render exactly `beautifulMermaid.rawBytes`,
`beautifulMermaid.gzipBytes`, `ours.rawBytes`, `ours.gzipBytes` from this file
(AC-COMPARE-004).

## 6. SVG bar chart wiring

### 6.1 Placement

Wired into the existing placeholder in `demo/index.pug`:

```pug
.card.benchmark-card.Lg
  // TODO(size-loop): wire size/gzip comparison SVG bar chart here   ← replace
```

The card already has `h2#ui-benchmark-title` + `span#ui-benchmark-tip` (copy
handled by I18N loop; size loop leaves `TODO(i18n-loop)` markers intact).

### 6.2 Data flow

```
sh/gen-size.js (build-time, run by implementation phase)
  ├── builds + measures both sides
  ├── writes workflow/reports/size-report.json   (canonical)
  └── writes demo/const/sizeData.js              (page-facing copy, derived from the same measurement)
        → export const SIZE_DATA = { beautifulMermaid:{raw,gzip}, ours:{raw,gzip}, ... }
```

`demo/const/sizeData.js` is a generated mirror of the report's four numbers
(+ labels/units) so the page never hardcodes bytes. Drift is impossible
because one script writes both from one in-memory measurement.

### 6.3 Chart rendering

Render the bar chart **as real SVG DOM** at runtime in `demo/index.js` from
`SIZE_DATA` into a container inside `.benchmark-card` (e.g.
`#size-chart`). Four bars: beautiful-mermaid raw, beautiful-mermaid gzip,
ours raw, ours gzip. Pure SVG (`<svg><rect>...<text>...</svg>`), no chart
library (AC-COMPARE-001; spec §9.1). Chart must include:

- title (existing `#ui-benchmark-title`)
- unit label (KB / bytes)
- legend / per-bar labels identifying the two projects
- the proxy disclaimer (existing `#ui-benchmark-tip`: "performance proxy,
  not a runtime benchmark")
- value labels above bars

Existing static `demo/size.svg` / `demo/speed.svg` are stale math-project
assets; the implementation phase replaces the size card wiring with the
data-driven chart (does not delete the old files unless clearly orphaned —
record in remove-candidates if so).

### 6.4 Build integration

Add size generation to the build flow so `bun run build` produces fresh data.
Two options (implementation picks one, documents in report):

- **A (recommended):** `sh/gen-size.js` runs before the page build, emits
  `sizeData.js`, which Vite bundles normally. Add an npm script
  `size:report` and call it from the build or document it as a pre-build step.
- **B:** generate at build-time inside `demo/build.js`.

Either way, `size-report.json` is regenerated from real artifacts on every
run; no manual numbers.

## 7. File inventory (for implementation phase)

| File | Owner phase | Purpose |
| --- | --- | --- |
| `sh/gen-size.js` | implementation | build + measure both sides; write report + sizeData.js |
| `workflow/reports/size-report.json` | implementation/verification | canonical data |
| `demo/const/sizeData.js` | implementation | page-facing generated copy |
| `demo/index.js` | implementation | render SVG bar chart from SIZE_DATA |
| `demo/index.pug` | implementation | replace TODO placeholder with chart container |
| `demo/style.styl` | implementation | bar chart styles (optional, minimal) |
| `package.json` | implementation | add `size:report` script |
| `docs/size/size-plan.md` | this phase | plan |
| `docs/size-loop-report.md` | final-report | loop summary |

Implementation-phase allowed files (from `03-implementation.md`):
`demo/**`, `sh/**`, `workflow/reports/size-report.json`, `docs/size/**`.

## 8. Risks & fallbacks

| Risk | Mitigation / fallback |
| --- | --- |
| `bun install` inside `references/beautiful-mermaid` blocked/unwanted | symlink/use elkjs+entities from our `node_modules` (present); record method |
| Vite manifest lacks reachability metadata | static allowlist of known mermaid render-path chunk prefixes (§4.3) + record `excludedChunks` |
| `katex-*` / `rough.esm-*` chunks — are they reachable? | reachability check decides; if pulled by `mermaid` they ARE render-path (include); if orphaned, exclude w/ reason |
| Chart data drift from report | single script writes both from one measurement (§6.2) |
| Numbers look unfavorable (mermaid is large) | report honestly; spec does NOT require us to be smaller — only that the proxy is traceable and correctly scoped. No cherry-picking. |
| Page claims "benchmark" | keep proxy disclaimer visible; chart labels say "size" not "performance/speed" |

## 9. Verification criteria (for `verification` + `final-report` phases)

- `workflow/reports/size-report.json` exists, parses, and has nonzero
  `rawBytes`/`gzipBytes` for both sides.
- Every measured artifact path exists on disk; `contentSha256` recomputes to
  the recorded value (no hand-written numbers).
- gzip recomputed at level 9 matches recorded `gzipBytes`.
- `ours.chunks[]` every file exists; `excludedChunks[]` reasons are non-empty.
- Page SVG bar chart's four values byte-for-byte equal the report
  (AC-COMPARE-004) — verified by reading rendered DOM vs JSON.
- Chart is `<svg>` (AC-COMPARE-001); proxy disclaimer present
  (AC-COMPARE-003).
- `blockedPatterns` (`runtime benchmark`, `estimated size`, `manual size data`)
  absent from report/chart copy.
- No i18n or deployment files touched (`forbiddenScope`).

## 10. Assumptions / open notes

- beautiful-mermaid's fair peer is the **browser bundle**, not the
  externalized CDN entry. This is a judgment call consistent with HG-4's
  "traceable source" + AC-COMPARE-002's intent (compare real browser JS). The
  externalized CDN entry is recorded as a labeled secondary reference.
- Aggregating our Vite chunks as "ours" is the honest representation of our
  render footprint; the spec's single-`entry` schema is honored by recording
  the entry filename separately from the aggregate bytes.
- This plan does not touch i18n; benchmark copy currently has stale
  math-project keys (`benchmark_*`) plus hardcoded English `TODO(i18n-loop)`
  markers — both deferred to the I18N loop per theme-css-report `deferred`.
- No irreversible decisions made in this plan phase; all file writes here are
  documentation only.
