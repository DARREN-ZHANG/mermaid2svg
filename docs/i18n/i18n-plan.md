# I18N Loop Plan

## 1. Mission

Align the Mermaid demo page copy with the existing 75-locale i18n mechanism,
define the full set of Mermaid translation keys, propagate them to every locale,
and produce the machine-readable coverage report required by the spec.

**This is a planning document only.** It does not modify any source files.
Implementation phases will follow this plan.

---

## 2. Current State Analysis

### 2.1 Two independent i18n subsystems

| Subsystem                | Location                        | Format              | Runtime mechanism                                                 | Current status                                                                                         |
| ------------------------ | ------------------------------- | ------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| A — Language selector UI | `demo/webc/I18n/i18n/*/js.json` | JSON                | `fetchLang()` fetches JSON at runtime when user switches language | **Working.** Each file has `{ "choose", "lang" }`. No changes needed.                                  |
| B — Page content         | `demo/i18n/*.js`                | ESM `() => ({...})` | **Not wired.** `index.js` has `onLang(() => {})` (empty no-op).   | **Stale.** Still contains upstream Math keys. Must be migrated to Mermaid keys and wired into the DOM. |

Subsystem B is the focus of this loop.

### 2.2 Locale inventory

- **75 locale files** in `demo/i18n/*.js` (codes defined in `demo/webc/I18n/CODE.js`).
- **75 matching JSON files** in `demo/webc/I18n/i18n/*/js.json` (language selector UI).
- **75 display names** in `demo/webc/I18n/NAME.js` and `demo/const/langName.js`.
- Language list matches `math.webc.site` exactly (HG-5 compliant).

Locale codes (first 10 + last 5 for reference):

```
en, zh, de, hi, ja, fr, it, ru, ko, es, ... fil, iw, jv, uz
```

### 2.3 Existing Math keys (to be replaced)

Every `demo/i18n/*.js` file currently exports this key set:

| Key                     | EN value                                | Mermaid status                               |
| ----------------------- | --------------------------------------- | -------------------------------------------- |
| `title`                 | `"@webc.site/math"`                     | **Must change** → Mermaid title              |
| `subtitle`              | `"The world's smallest..."`             | **Must change** → Mermaid subtitle           |
| `formulas_title`        | `"Demos"`                               | **Must change** → `examples_title`           |
| `benchmark_title`       | `"Performance & Size"`                  | **Remove** (not used in Mermaid demo)        |
| `benchmark_tip`         | `"Lower size / higher speed is better"` | **Must change** → size comparison tip        |
| `benchmark_size_title`  | `"Size Comparison"`                     | **Keep/rename** → `size_title`               |
| `benchmark_size_tip`    | `"GZIP size, lower is better"`          | **Must change** → size tip with proxy caveat |
| `benchmark_speed_title` | `"Performance Comparison"`              | **Remove** (no runtime benchmark)            |
| `benchmark_speed_tip`   | `"Higher is better"`                    | **Remove**                                   |
| `preview_title`         | `"Real-time Render Preview"`            | **Repurpose** → SVG preview label            |
| `editor_title`          | `"Interactive Editor"`                  | **Keep**                                     |
| `editor_tip`            | `"Input LaTeX formulas..."`             | **Must change** → Mermaid editor tip         |
| `editor_placeholder`    | `"Type text with formulas here..."`     | **Must change** → Mermaid placeholder        |
| `usage_title`           | `"Usage Example"`                       | **Keep**                                     |
| `source_code`           | `"Source Code"`                         | **Remove** (not used in Mermaid demo)        |
| `comment_import`        | `"Import formula compiler"`             | **Remove**                                   |
| `comment_compile`       | `"Compile LaTeX formulas..."`           | **Remove**                                   |
| `comment_output`        | `"Output"`                              | **Remove**                                   |
| `usage_formula`         | `"Euler Identity..."`                   | **Remove**                                   |
| `names`                 | 32-element array of Math formula names  | **Must change** → 8 Mermaid example names    |

### 2.4 TODO(i18n-loop) markers left by prior loops

**Web Demo Loop** left 9 markers in `demo/index.pug` and 3 in `demo/index.js`.
**Theme Loop** left 1 marker in `demo/index.js` (theme label).

| Location       | Element ID            | Current hardcoded text                       | Source loop |
| -------------- | --------------------- | -------------------------------------------- | ----------- |
| `index.pug:23` | `#ui-title`           | `Mermaid → SVG`                              | Web Demo    |
| `index.pug:25` | `#ui-subtitle`        | `Browser-side Mermaid to svg converter`      | Web Demo    |
| `index.pug:30` | `#ui-usage-title`     | `Usage`                                      | Web Demo    |
| `index.pug:37` | `#ui-benchmark-title` | `Size Comparison`                            | Web Demo    |
| `index.pug:39` | `#ui-benchmark-tip`   | `performance proxy, not a runtime benchmark` | Web Demo    |
| `index.pug:46` | `#ui-editor-title`    | `Interactive Editor`                         | Web Demo    |
| `index.pug:48` | `#theme-switcher`     | `Theme` (data-theme-label attr)              | Web Demo    |
| `index.pug:50` | `#ui-editor-tip`      | `Enter Mermaid source text to render SVG`    | Web Demo    |
| `index.pug:58` | `#ui-examples-title`  | `Examples`                                   | Web Demo    |
| `index.js:59`  | theme label span      | `Theme`                                      | Theme       |
| `index.js:89`  | EMPTY_HINT const      | `Enter Mermaid source to see SVG preview`    | Web Demo    |
| `index.js:168` | usage_code const      | code sample string                           | Web Demo    |

### 2.5 Other hardcoded English in the demo

| File                             | Text                                                                                            | Notes                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `index.pug:52`                   | `placeholder="Enter Mermaid source here..."`                                                    | No TODO marker but needs i18n                 |
| `index.js:28-31`                 | Error messages: `"Parse error: "`, `"Render error: "`, `"Render timed out"`, `"Output error: "` | Needs i18n keys                               |
| `webc/js/sizeChart.js:87-91`     | `"Raw"`, `"Gzip"` legend labels                                                                 | Chart legend text                             |
| `webc/js/sizeChart.js:141`       | `"× smaller"` ratio label                                                                       | Chart annotation                              |
| `const/mermaidExamples.js:43-50` | Example display names: `"Flowchart"`, `"Sequence Diagram"`, etc.                                | These will become the `names[]` array in i18n |

---

## 3. Proposed Mermaid Key Set

### 3.1 Full key inventory

Replacing all Math keys with the following Mermaid-specific keys:

| Key                  | EN fallback text                                            | DOM target                     | Spec section             |
| -------------------- | ----------------------------------------------------------- | ------------------------------ | ------------------------ |
| `title`              | `Mermaid → SVG`                                             | `#ui-title`                    | 10 (page title)          |
| `subtitle`           | `Browser-side Mermaid to SVG converter`                     | `#ui-subtitle`                 | 10 (page description)    |
| `editor_title`       | `Interactive Editor`                                        | `#ui-editor-title`             | 10 (input area label)    |
| `editor_tip`         | `Enter Mermaid source text to render SVG`                   | `#ui-editor-tip`               | 10 (input tip)           |
| `editor_placeholder` | `Enter Mermaid source here...`                              | `#mermaid-input[placeholder]`  | 10 (input placeholder)   |
| `preview_title`      | `SVG Preview`                                               | `#svg-preview` section label   | 10 (SVG preview label)   |
| `examples_title`     | `Examples`                                                  | `#ui-examples-title`           | 10 (examples title)      |
| `usage_title`        | `Usage`                                                     | `#ui-usage-title`              | 10 (usage title)         |
| `size_title`         | `Size Comparison`                                           | `#ui-benchmark-title`          | 10 (comparison title)    |
| `size_tip`           | `Performance proxy (JS file size), not a runtime benchmark` | `#ui-benchmark-tip`            | 10 (comparison unit/tip) |
| `theme_label`        | `Theme`                                                     | `#theme-switcher` label        | 10 (theme toggle button) |
| `empty_hint`         | `Enter Mermaid source to see SVG preview`                   | `#render-status` (empty state) | 10 (empty state hint)    |
| `err_parse`          | `Parse error: `                                             | `#render-status` (error)       | 10 (error message)       |
| `err_render`         | `Render error: `                                            | `#render-status` (error)       | 10 (error message)       |
| `err_timeout`        | `Render timed out`                                          | `#render-status` (error)       | 10 (error message)       |
| `err_output`         | `Output error: `                                            | `#render-status` (error)       | 10 (error message)       |
| `chart_raw`          | `Raw`                                                       | Size chart legend              | 10 (comparison unit)     |
| `chart_gzip`         | `Gzip`                                                      | Size chart legend              | 10 (comparison unit)     |
| `chart_smaller`      | `× smaller`                                                 | Size chart annotation          | 10 (comparison unit)     |
| `names`              | 8-element array (see 3.2)                                   | Example card titles            | 10 (example titles)      |

**Total: 19 string keys + 1 array key (8 elements) = 27 translatable strings.**

### 3.2 names[] array — Mermaid example display names

The 8-element `names` array replaces the 32-element Math formula names. These
correspond to the 8 MVP diagram types in `demo/const/mermaidExamples.js`:

| Index | EN fallback        | Diagram type          |
| ----- | ------------------ | --------------------- |
| 0     | `Flowchart`        | `flowchart` / `graph` |
| 1     | `Sequence Diagram` | `sequenceDiagram`     |
| 2     | `Class Diagram`    | `classDiagram`        |
| 3     | `State Diagram`    | `stateDiagram-v2`     |
| 4     | `ER Diagram`       | `erDiagram`           |
| 5     | `Pie Chart`        | `pie`                 |
| 6     | `Gantt Chart`      | `gantt`               |
| 7     | `XY Chart`         | `xychart-beta`        |

These names are consumed from the i18n module by `index.js` instead of the
hardcoded second tuple element in `mermaidExamples.js`.

### 3.3 Keys explicitly removed vs upstream Math

The following upstream Math keys are **not carried forward** because the Mermaid
demo does not use them:

- `formulas_title` (replaced by `examples_title`)
- `benchmark_title` (not used; size section has its own title)
- `benchmark_size_title` (replaced by `size_title`)
- `benchmark_size_tip` (replaced by `size_tip`)
- `benchmark_speed_title` (removed — no runtime benchmark, per spec 9.3)
- `benchmark_speed_tip` (removed)
- `source_code`, `comment_import`, `comment_compile`, `comment_output`,
  `usage_formula` (LaTeX-specific, not applicable)

---

## 4. Wiring Strategy

### 4.1 Architecture decision: lazy import via `import.meta.glob`

**Constraint:** `demo/i18n/*.js` files are ESM modules, not JSON. The existing
language selector subsystem fetches JSON via `fetchLang()`. We have two options:

| Option                           | Pros                                                                                      | Cons                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------- |
| A: Convert to JSON + fetchLang   | Consistent with subsystem A                                                               | Breaks `sh/check.js` (expects ESM); large migration |
| B: Keep ESM + `import.meta.glob` | Zero migration of file format; check.js unchanged; Vite handles code-splitting per locale | Slightly larger initial bundle (glob metadata only) |

**Decision: Option B.** Rationale:

- `sh/check.js` imports `demo/i18n/*.js` as ESM modules — changing to JSON would
  break the validation pipeline.
- Vite `import.meta.glob('./i18n/*.js')` with `{ import: 'default' }` produces
  lazy-importable chunks, one per locale, loaded on demand.
- Aligns with "prefer small, reversible changes" — no format migration needed.

### 4.2 Runtime wiring plan

In `demo/index.js`, replace the empty `onLang(() => {})` callback:

```text
1. Pre-build a map: CODE → lazy import function via import.meta.glob
2. On language change (onLang):
   a. Get locale code from CODE[langId]
   b. Lazy-import demo/i18n/{code}.js
   c. Call the exported function to get the translation object
   d. Apply translations to DOM elements by ID/data-attribute
   e. Update names[] in example cards
```

### 4.3 DOM application mechanism

Translation keys map to DOM elements via existing `#ui-*` IDs:

| Mechanism          | Selector                             | Attribute                         |
| ------------------ | ------------------------------------ | --------------------------------- |
| `textContent`      | `#ui-title`, `#ui-subtitle`, `#ui-*` | text content                      |
| `placeholder`      | `#mermaid-input`                     | placeholder attribute             |
| `data-theme-label` | `#theme-switcher`                    | data attribute → span textContent |
| `names[]`          | `.example-card h3`                   | iterate cards by index            |

Error messages are applied dynamically from the i18n object when errors occur,
not at language switch time.

---

## 5. Implementation Phases

### Phase 1: Define EN and ZH baselines

**Files:** `demo/i18n/en.js`, `demo/i18n/zh.js`

1. Rewrite `en.js` with the 19 string keys + 8-element `names` array (section 3).
2. Rewrite `zh.js` with Chinese translations for the same key set.
3. Both files must have identical key sets (check.js enforces this against zh.js).

**EN baseline content** (all spec-required strings):

```
title: "Mermaid → SVG"
subtitle: "Browser-side Mermaid to SVG converter"
editor_title: "Interactive Editor"
editor_tip: "Enter Mermaid source text to render SVG"
editor_placeholder: "Enter Mermaid source here..."
preview_title: "SVG Preview"
examples_title: "Examples"
usage_title: "Usage"
size_title: "Size Comparison"
size_tip: "Performance proxy (JS file size), not a runtime benchmark"
theme_label: "Theme"
empty_hint: "Enter Mermaid source to see SVG preview"
err_parse: "Parse error: "
err_render: "Render error: "
err_timeout: "Render timed out"
err_output: "Output error: "
chart_raw: "Raw"
chart_gzip: "Gzip"
chart_smaller: "× smaller"
names: ["Flowchart", "Sequence Diagram", "Class Diagram",
        "State Diagram", "ER Diagram", "Pie Chart",
        "Gantt Chart", "XY Chart"]
```

**ZH baseline** (representative):

```
title: "Mermaid → SVG"
subtitle: "浏览器端 Mermaid 转 SVG 转换器"
editor_title: "交互式编辑器"
editor_tip: "输入 Mermaid 源文本以渲染 SVG"
...
```

### Phase 2: Propagate keys to all 73 remaining locales

**Files:** `demo/i18n/{de,hi,ja,...,uz}.js` (73 files)

Strategy:

1. For each locale, replace the Math key set with the Mermaid key set.
2. Translate high-visibility strings (title, subtitle, section headers) for
   major languages (de, ja, fr, es, ru, ko, pt, it, ar, hi).
3. For minor languages, use English fallback text (HG-5 compliant — "English
   fallback text is acceptable for languages without translated Mermaid-specific
   copy, but missing keys are not acceptable").
4. **Critical:** The `names` array must have exactly 8 elements in every file.
5. **Critical:** No file (except `en.js`) may have >5% identical values to `en.js`
   (check.js warns and may fail — see section 6.1 for edge cases).

**Note on similarity threshold:** The check.js 5% similarity rule compares
non-EN files against EN. With 27 strings, if more than ~1 string matches EN
exactly, the file triggers a warning (>5%). For minor locales using full English
fallback, this will trigger warnings. Per `check.js`, warnings return `true`
(pass) but print WARN messages. We need to verify this doesn't cause CI failure.

**Mitigation:** Translate at least the `names` array and 2-3 UI strings for
every locale to stay under 5% identical ratio, even if the remaining strings
use English fallback.

### Phase 3: Wire i18n into demo/index.js

**Files:** `demo/index.js`

1. Add `import.meta.glob` for lazy-loading locale modules.
2. Replace `onLang(() => {})` with real translation application logic.
3. Remove all `TODO(i18n-loop)` markers.
4. Apply translations to DOM elements by ID.
5. Update `names[]` source: read from i18n module instead of `mermaidExamples.js`.
6. Update error message function to use i18n keys.
7. Update editor placeholder to use i18n.
8. Update `usage_code` — keep as-is (code sample, language-neutral, not i18n'd).

### Phase 4: Wire i18n into demo/index.pug

**Files:** `demo/index.pug`

1. Remove hardcoded English text from `#ui-*` elements.
2. Remove `TODO(i18n-loop)` comments.
3. Update `placeholder` attribute on `#mermaid-input`.
4. Update `data-theme-label` attribute.
5. Leave elements empty — `index.js` populates them on init + language change.

### Phase 5: Wire i18n into size chart

**Files:** `demo/webc/js/sizeChart.js`

1. Accept i18n labels as parameters to `renderSizeChart()`.
2. Replace hardcoded `"Raw"`, `"Gzip"`, `"× smaller"` with i18n values.
3. Keep `bm.label` and `ours.label` from size data (these are package names,
   not translatable UI text).

### Phase 6: Update sh/check.js compatibility

**Files:** none (check.js should work unchanged)

Verify:

1. `zh.js` keys are the baseline — all 75 files must match.
2. `names` array length = 8 across all files.
3. EN is excluded from similarity check (already handled).
4. Warnings for high-similarity minor locales are acceptable (return true).

### Phase 7: Generate i18n coverage report

**File:** `workflow/reports/i18n-report.json`

Machine-readable report with:

```json
{
  "localeCount": 75,
  "locales": ["en", "zh", ...],
  "source": "demo/webc/I18n/CODE.js + demo/webc/I18n/NAME.js",
  "translationKeys": ["title", "subtitle", ...],
  "keyCount": 19,
  "namesArrayLength": 8,
  "perLocale": {
    "en": { "keysPresent": 19, "namesLength": 8, "fallback": false },
    "zh": { "keysPresent": 19, "namesLength": 8, "fallback": false },
    ...
  },
  "fallbackStrategy": "English fallback for minor locales; all keys present in all locales",
  "verification": {
    "checkJs": "bun run sh/check.js",
    "spotCheckLocales": ["en", "zh", "ja", "ar", "de"]
  }
}
```

---

## 6. Validation and Edge Cases

### 6.1 sh/check.js constraints

`sh/check.js` enforces:

1. Every file must export a function returning a non-null object.
2. All keys from `zh.js` must exist in every other file.
3. The `names` array must exist and match `zh.js`'s names length (8).
4. Non-EN files with >5% identical values to EN trigger a WARN (not a failure).
5. The function returns `true` (pass) even with warnings.

**Risk:** If a minor locale file is 100% English fallback, it will WARN but pass.
This is acceptable per HG-5 ("English fallback text is acceptable").

### 6.2 Similarity threshold mitigation

With 19 string keys + 8 name entries = 27 comparable values:

- 5% of 27 ≈ 1.35 values
- If ≥2 values are identical to EN, the file WARNs.

**Strategy for minor locales:** Translate at least the `names` array entries
(8 entries — but these are often the same in many languages: "Flowchart" may be
universal). Translate `title` and at least 3-4 UI labels to bring identical
count below threshold.

If this proves impractical for all 75 locales, **acceptable fallback:**

- Translate names[] to locale script where possible.
- Accept check.js warnings for remaining minor locales (they return pass).

### 6.3 Build verification

After implementation, verify:

1. `bun run sh/check.js` — all 75 files pass (warnings acceptable).
2. `bun run dev` — page loads, language switching works, text updates.
3. `bun run build` — build succeeds, locale chunks are code-split.
4. `./test.sh` — all existing tests still pass.

---

## 7. Fallback Strategy (HG-5 Compliance)

> "Keep the existing 75-locale structure. All Mermaid demo keys must exist in
> every locale file. English fallback text is acceptable for languages without
> translated Mermaid-specific copy, but missing keys are not acceptable."

Implementation:

- Every `demo/i18n/*.js` file will have all 19 keys + 8-element `names` array.
- English fallback text is used for untranslated strings.
- Missing keys = check.js failure = not acceptable.
- Language switching works for all 75 locales (no crash, no missing key).

---

## 8. Deliverables Checklist

| Deliverable                       | Path                                | Spec ref          |
| --------------------------------- | ----------------------------------- | ----------------- |
| 75 locale files with Mermaid keys | `demo/i18n/*.js`                    | 10, AC-I18N-001   |
| DOM wiring in index.js            | `demo/index.js`                     | 10, AC-I18N-002   |
| Pug template cleanup              | `demo/index.pug`                    | 10                |
| Size chart i18n                   | `demo/webc/js/sizeChart.js`         | 10                |
| check.js passes                   | `sh/check.js`                       | AC-BUILD-002      |
| Coverage report                   | `workflow/reports/i18n-report.json` | 10.1, AC-I18N-003 |
| Loop report                       | `docs/i18n-loop-report.md`          | Workflow          |

---

## 9. Out of Scope

- Deploy Loop: Cloudflare Pages config (explicitly blocked).
- Language selector UI translations (`js.json` files) — already working, no change.
- Adding new languages beyond the existing 75.
- Auto-translation services or AI translation.
- RTL layout adjustments (Arabic/Hebrew already handled by upstream CSS).
- Translating code samples (usage_code is language-neutral).

---

## 10. Uncertainties and Risks

| Risk                                                                       | Impact              | Mitigation                                                                         |
| -------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| check.js 5% similarity causes warnings for minor locales                   | Low (warnings pass) | Translate names[] + key UI labels; accept warnings                                 |
| `import.meta.glob` chunk-splitting increases total bundle                  | Low                 | Vite handles per-locale lazy loading; initial load unchanged                       |
| Names array consistency across locales                                     | Medium              | Script-generate or batch-edit to ensure length=8 everywhere                        |
| Upstream `title` key has special check.js handling (excluded from en_keys) | Low                 | Already accounted for — `title` is filtered out of en_keys in check.js line 111    |
| `mermaidExamples.js` currently has English display names in tuple[1]       | Low                 | After i18n wiring, names come from i18n module; tuple[1] becomes unused or removed |

---

## 11. Execution Order

```
Phase 1: EN + ZH baselines (2 files)
    ↓
Phase 2: Propagate to 73 locales (batch)
    ↓
Phase 3: Wire index.js (DOM application)
    ↓
Phase 4: Clean up index.pug (remove hardcoded text)
    ↓
Phase 5: Wire sizeChart.js (chart labels)
    ↓
Phase 6: Verify check.js + build + test
    ↓
Phase 7: Generate i18n-report.json
    ↓
Write loop report → commit
```
