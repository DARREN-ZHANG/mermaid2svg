# Remove Candidates

Files and directories that appear unrelated to the Mermaid → SVG goal.
**None of these should be removed in Phase 1.** This list is for review and decision in later phases.

Generated: 2026-06-12
Phase: Project Cognition

---

## High Confidence — Likely Remove/Replace

These are directly tied to the MathML/KaTeX/MathJax extraction pipeline and must be replaced with Mermaid equivalents.

| Path | Reason | Confidence | Suggested Action |
|---|---|---|---|
| `extract/run.js` | Currently extracts from KaTeX/MathJax. Must be **rewritten** for Mermaid extraction from maid/beautiful-mermaid/mermaid-js. | **HIGH** | Rewrite in place. Do not delete until replacement is ready. |
| `extract/katex.js` | KaTeX-specific extraction + rendering. Entirely MathML-focused. | **HIGH** | Replace with Mermaid source extractors. |
| `extract/mathjax.js` | MathJax-specific extraction + rendering. Entirely MathML-focused. | **HIGH** | Replace with Mermaid source extractors. |
| `extract/lib.js` | Shared helpers for MathML extraction (read, normalize, isSupported). Mostly MathML-specific. | **HIGH** | Replace with Mermaid-specific helpers. Some utilities (git clone, file I/O) may be reusable. |
| `test/compare.js` | MathML comparison logic (normalize, getSingleChild). Specific to MathML output validation. | **HIGH** | Will need Mermaid SVG comparison logic instead. |
| `test/compare.test.js` | MathML test runner. Specific to MathML. | **HIGH** | Will need Mermaid test runner instead. |
| `test/case/*.yml` | 7 YAML files with LaTeX→MathML test cases. Not applicable to Mermaid. | **HIGH** | Keep in `test/case/` subdirectory (for upstream MathML tests) or relocate. New Mermaid YAML tests go to `test/*.yml`. |
| `demo/webc/Math.js` | `<c-math>` custom element for TeX rendering. Math-specific. | **HIGH** | Preserve as upstream component. Mermaid will add a separate `<c-mermaid>` component. Do not remove. |

## Medium Confidence — Evaluate for Removal/Archive

These are math-specific but may have reusable patterns or infrastructure value.

| Path | Reason | Confidence | Suggested Action |
|---|---|---|---|
| `demo/const/formulas.js` | 33 LaTeX formulas for demo gallery. Not needed for Mermaid demo. | **MEDIUM** | Replace with Mermaid example diagrams. |
| `demo/size.svg` | Static SVG comparing KaTeX/MathJax sizes. Must be replaced with Mermaid vs beautiful-mermaid. | **MEDIUM** | Replace with Mermaid size comparison SVG. |
| `demo/speed.svg` | Static SVG comparing rendering speed. Spec only requires size comparison, not speed. | **MEDIUM** | May be removed or repurposed. |
| `demo/svg/demo.en.svg` | English demo screenshot. Math-specific screenshot. | **MEDIUM** | Will need Mermaid demo screenshots instead. |
| `demo/svg/demo.zh.svg` | Chinese demo screenshot. Math-specific screenshot. | **MEDIUM** | Will need Mermaid demo screenshots instead. |
| `sh/gen_formula_svg.js` | Generates formula SVGs from LaTeX. Math-specific. | **MEDIUM** | Not needed for Mermaid. May be archived. |
| `sh/bench/` | Benchmark scripts for math rendering. | **MEDIUM** | Not needed for Mermaid. May be archived. |
| `sh/stringAnalyze.js` | String analysis utility. May or may not be useful for Mermaid. | **MEDIUM** | Evaluate utility before deciding. |
| `sh/unicodeUnescape.js` | Unicode unescape utility. May or may not be useful for Mermaid. | **MEDIUM** | Evaluate utility before deciding. |

## Low Confidence — Likely Preserve but Verify

These are unrelated to Mermaid but are part of the upstream project ecosystem.

| Path | Reason | Confidence | Suggested Action |
|---|---|---|---|
| `blog/` | dev.to articles about the math project. Completely unrelated to Mermaid. | **LOW** | Preserve. Part of upstream project value. Do not remove. |
| `plugin/` | markdown-it/marked/remark integrations. Unrelated to Mermaid. | **LOW** | Preserve. Part of upstream project value. Do not remove. |
| `readme/` | Split README content for math project. | **LOW** | Preserve until README is updated for Mermaid. |
| `README.mdt` | README template. Math-specific. | **LOW** | Preserve until README is updated. |
| `.github/workflows/npm.yml` | npm publish for @webc.site/math. | **LOW** | Preserve. Upstream CI pipeline. |
| `sh/github/` | GitHub automation scripts. | **LOW** | Preserve. May be useful for Mermaid releases too. |

---

## Summary

| Confidence | Count | Action |
|---|---|---|
| HIGH (rewrite/replace) | 6 | Rewrite `extract/` for Mermaid, replace MathML test infrastructure |
| MEDIUM (evaluate) | 9 | Evaluate per item; most will be replaced or archived |
| LOW (likely preserve) | 6 | Preserve as upstream project assets |

### Key Decisions Needed

1. **`test/case/*.yml` MathML tests**: Should they be kept in `test/case/` alongside new Mermaid `test/*.yml` files, or archived elsewhere? Recommendation: keep in place, they validate the upstream math library which should remain functional.

2. **`extract/lib.js` utilities**: The `clone()` function for git cloning repos and basic file I/O helpers may be reusable for Mermaid extraction. Evaluate before wholesale replacement.

3. **`demo/size.svg` and `demo/speed.svg`**: The spec requires a Mermaid vs beautiful-mermaid size comparison SVG. The current SVGs serve as structural references for the chart format.

4. **Blog and plugin directories**: These are entirely upstream project assets. Removing them would be destructive to the fork lineage. Recommendation: preserve indefinitely.
