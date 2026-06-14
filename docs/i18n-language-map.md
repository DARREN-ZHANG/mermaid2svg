# I18N Language Map & Coverage Report

## Overview

| Item | Value |
|---|---|
| Total locales | 75 |
| Translation keys | 18 string keys + 1 array key (8 elements) |
| Fully translated locales | 8 (en, zh, ja, ko, de, fr, es, ru) |
| English fallback locales | 67 |
| Missing key locales | 0 |
| Fallback strategy | English fallback for untranslated strings; all keys must exist |

Machine-readable report: `workflow/reports/i18n-report.json`

---

## Language List (75 locales)

Language list is sourced from `demo/webc/I18n/CODE.js` and `demo/webc/I18n/NAME.js`,
aligned with `math.webc.site`.

| # | Code | Name | Translated | Fallback |
|---|---|---|---|---|
| 0 | en | English | ✓ (baseline) | — |
| 1 | zh | 中文 | ✓ | — |
| 2 | de | Deutsch | ✓ | — |
| 3 | hi | हिन्दी | — | ✓ |
| 4 | ja | 日本語 | ✓ | — |
| 5 | fr | Français | ✓ | — |
| 6 | it | Italiano | — | ✓ |
| 7 | ru | Русский | ✓ | — |
| 8 | ko | 한국어 | ✓ | — |
| 9 | es | Español | ✓ | — |
| 10 | id | Indonesia | — | ✓ |
| 11 | tr | Türkçe | — | ✓ |
| 12 | ar | العربية | — | ✓ |
| 13 | nl | Nederlands | — | ✓ |
| 14 | pl | Polski | — | ✓ |
| 15 | zh-TW | 正體中文 | — | ✓ |
| 16 | sv | Svenska | — | ✓ |
| 17 | no | Norsk Bokmål | — | ✓ |
| 18 | th | ไทย | — | ✓ |
| 19 | vi | Tiếng Việt | — | ✓ |
| 20 | ceb | Binisaya | — | ✓ |
| 21 | bn | বাংলা | — | ✓ |
| 22 | fa | فارسی | — | ✓ |
| 23 | ms | Bahasa Melayu | — | ✓ |
| 24 | mr | मराठी | — | ✓ |
| 25 | af | Afrikaans | — | ✓ |
| 26 | da | Dansk | — | ✓ |
| 27 | ro | Română | — | ✓ |
| 28 | ur | اردو | — | ✓ |
| 29 | cs | Čeština | — | ✓ |
| 30 | ta | தமிழ் | — | ✓ |
| 31 | fi | Suomi | — | ✓ |
| 32 | pt | Português | — | ✓ |
| 33 | kn | ಕನ್ನಡ | — | ✓ |
| 34 | ca | Català | — | ✓ |
| 35 | gu | ગુજરાતી | — | ✓ |
| 36 | kk | Қазақ Тілі | — | ✓ |
| 37 | el | Ελληνικά | — | ✓ |
| 38 | hu | Magyar | — | ✓ |
| 39 | uk | Українська | — | ✓ |
| 40 | te | తెలుగు | — | ✓ |
| 41 | sk | Slovenčina | — | ✓ |
| 42 | sw | Kiswahili | — | ✓ |
| 43 | bg | Български | — | ✓ |
| 44 | cy | Cymraeg | — | ✓ |
| 45 | eu | Euskara | — | ✓ |
| 46 | hr | Hrvatski | — | ✓ |
| 47 | lb | Lëtzebuergesch | — | ✓ |
| 48 | si | සිංහල | — | ✓ |
| 49 | az | Azərbaycanca | — | ✓ |
| 50 | lt | Lietuvių Kalba | — | ✓ |
| 51 | or | ଓଡ଼ିଆ | — | ✓ |
| 52 | sr | Српски Језик | — | ✓ |
| 53 | be | Беларуская | — | ✓ |
| 54 | gl | Galego | — | ✓ |
| 55 | my | မြန်မာစာ | — | ✓ |
| 56 | sd | سنڌي | — | ✓ |
| 57 | sl | Slovenščina | — | ✓ |
| 58 | as | অসমীয়া | — | ✓ |
| 59 | et | Eesti | — | ✓ |
| 60 | lv | Latviešu Valoda | — | ✓ |
| 61 | km | ភាសាខ្មែរ | — | ✓ |
| 62 | ne | नेपाली | — | ✓ |
| 63 | hy | Հայերեն | — | ✓ |
| 64 | bs | Bosanski | — | ✓ |
| 65 | ka | ქართული | — | ✓ |
| 66 | is | Íslenska | — | ✓ |
| 67 | lo | ພາສາລາວ | — | ✓ |
| 68 | mk | Македонски Јазик | — | ✓ |
| 69 | mt | Malti | — | ✓ |
| 70 | sq | Shqip | — | ✓ |
| 71 | fil | Wikang Filipino | — | ✓ |
| 72 | iw | עברית | — | ✓ |
| 73 | jv | Basa Jawa | — | ✓ |
| 74 | uz | O'zbek | — | ✓ |

---

## Translation Keys

### String keys (18)

| Key | English value | DOM target | Spec section |
|---|---|---|---|
| `title` | Mermaid → SVG | `#ui-title` | 10 — page title |
| `subtitle` | Browser-side Mermaid to SVG converter | `#ui-subtitle` | 10 — page description |
| `usage_title` | Usage | `#ui-usage-title` | 10 — usage title |
| `benchmark_title` | Size Comparison | `#ui-benchmark-title` | 10 — comparison title |
| `benchmark_tip` | Performance proxy, not a runtime benchmark | `#ui-benchmark-tip` | 10 — comparison unit |
| `editor_title` | Interactive Editor | `#ui-editor-title` | 10 — input area label |
| `editor_tip` | Enter Mermaid source text to render SVG | `#ui-editor-tip` | 10 — input tip |
| `editor_placeholder` | Enter Mermaid source here... | `#mermaid-input[placeholder]` | 10 — input placeholder |
| `examples_title` | Examples | `#ui-examples-title` | 10 — examples title |
| `theme_label` | Theme | `.theme-switcher-label` | 10 — theme toggle |
| `empty_hint` | Enter Mermaid source to see SVG preview | `#render-status` (empty) | 10 — empty state |
| `err_parse` | Parse error | `#render-status` (error) | 10 — error message |
| `err_render` | Render error | `#render-status` (error) | 10 — error message |
| `err_timeout` | Render timed out | `#render-status` (error) | 10 — error message |
| `err_output` | Output error | `#render-status` (error) | 10 — error message |
| `chart_raw` | Raw | Size chart legend | 10 — chart legend |
| `chart_gzip` | Gzip | Size chart legend | 10 — chart legend |
| `chart_smaller` | × smaller | Size chart annotation | 10 — chart unit |

### Array key (1, 8 elements)

| Index | English | Diagram type |
|---|---|---|
| 0 | Flowchart | flowchart / graph |
| 1 | Sequence Diagram | sequenceDiagram |
| 2 | Class Diagram | classDiagram |
| 3 | State Diagram | stateDiagram-v2 |
| 4 | ER Diagram | erDiagram |
| 5 | Pie Chart | pie |
| 6 | Gantt Chart | gantt |
| 7 | XY Chart | xychart-beta |

---

## Fallback Strategy (HG-5 Compliant)

> "Keep the existing 75-locale structure. All Mermaid demo keys must exist in every
> locale file. English fallback text is acceptable for languages without translated
> Mermaid-specific copy, but missing keys are not acceptable."

- **Fallback locale:** `en`
- **Translated locales:** zh, ja, ko, de, fr, es, ru (7 languages with full translations)
- **Fallback locales:** All other 67 locales use English text
- **Missing keys:** None — all 75 files have all 19 keys
- **`names` array:** 8 elements in every file

---

## Runtime Mechanism

```
User clicks language → c-i18n component → onLang callback →
  import.meta.glob loads demo/i18n/{code}.js →
    applyI18n(t) sets DOM textContent by element ID →
      renderInput() updates error/empty messages →
        size chart rebuilt with translated legend
```

### DOM element IDs

| Element | Attribute | Updated by |
|---|---|---|
| `#ui-title` | textContent | `applyI18n()` |
| `#ui-subtitle` | textContent | `applyI18n()` |
| `#ui-usage-title` | textContent | `applyI18n()` |
| `#ui-benchmark-title` | textContent | `applyI18n()` |
| `#ui-benchmark-tip` | textContent | `applyI18n()` |
| `#ui-editor-title` | textContent | `applyI18n()` |
| `#ui-editor-tip` | textContent | `applyI18n()` |
| `#ui-examples-title` | textContent | `applyI18n()` |
| `#mermaid-input` | placeholder | `applyI18n()` |
| `.theme-switcher-label` | textContent | `applyI18n()` |
| `#render-status` | textContent | `renderInput()` |
| `.example-card h3` | textContent | `onLang()` loop |
| `#size-chart svg` | rebuilt | `renderSizeChart()` with labels |

---

## Verification

| Check | Method | Result |
|---|---|---|
| All keys present | `sh/check.js` | ✅ Pass (exit code 0) |
| `names` array length | `sh/check.js` | ✅ All 75 files have 8 elements |
| Similarity warnings | `sh/check.js` | ⚠️ 67 fallback locales warn (>5% identical to EN) — acceptable per HG-5 |
| Build | `bun run build` | Pending deploy loop |
| Language switching | Manual / Playwright | Pending deploy loop |

### Representative locale spot-checks

| Locale | All keys present | names[8] | Fallback |
|---|---|---|---|
| en | ✓ | ✓ | — |
| zh | ✓ | ✓ | — |
| ja | ✓ | ✓ | — |
| de | ✓ | ✓ | — |
| fr | ✓ | ✓ | — |
| es | ✓ | ✓ | — |
| ru | ✓ | ✓ | — |
| ko | ✓ | ✓ | — |
| ar | ✓ | ✓ | ✓ |
| hi | ✓ | ✓ | ✓ |
