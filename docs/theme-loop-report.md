# Theme Loop Final Report

Theme Loop Phase 05 artifact. This is the final report for the Theme / CSS
Compatibility Loop. It summarizes artifacts produced, Beautiful Mermaid CSS
source traceability, the theming architecture, and the verification outcome.

Machine-readable companion: `workflow/reports/theme-css-report.json`.
Plan: `docs/theme/theme-plan.md`. Verification evidence:
`docs/theme/theme-verification.md`.

---

## 1. Loop Scope and Outcome

The Theme Loop added Beautiful Mermaid CSS theme switching to the existing
Mermaid → SVG demo without altering the core render flow.

| Aspect | Result |
|---|---|
| Mission | Add Beautiful Mermaid CSS theme switching + source traceability |
| Status | **pass** |
| Render flow touched (`src/**`) | no |
| Switch triggers re-render | no (pure CSS overlay) |
| External CDN required at runtime | no |
| Blocked patterns found | 0 |
| Regression tests | 48 pass / 0 fail |

### 1.1 Acceptance criteria coverage

| AC ref | Requirement | Status |
|---|---|---|
| AC-THEME-001 | Theme switching affects Mermaid SVG styling | pass |
| AC-THEME-002 | Visible, interactive theme switch button | pass |
| AC-THEME-003 | CSS source/version traceable; default needs no CDN | pass |
| HG-4 | Local `references/beautiful-mermaid` is the traceable source; commit pinned | pass |
| spec §8 | Theme switching does not alter the core render flow | pass |

---

## 2. Artifacts Produced

| Artifact | Path | Purpose |
|---|---|---|
| Theme plan | `docs/theme/theme-plan.md` | Phase 02 — scope, architecture, file boundaries |
| Theme palette data | `demo/const/themes.js` | 9 curated themes transcribed from reference; derived-color computation |
| CSS overlay | `demo/theme.css` | Pure-CSS overlay targeting normalized Mermaid SVG selectors |
| Demo wiring | `demo/index.js`, `demo/index.pug`, `demo/style.styl` | Theme switcher UI + `applyTheme` handler |
| CSS source report | `workflow/reports/theme-css-report.json` | Machine-readable provenance + verification result |
| Verification doc | `docs/theme/theme-verification.md` | Phase 04 — build, palette fidelity, runtime probe, regression |
| Final report | `docs/theme-loop-report.md` | This document |

---

## 3. CSS Source Traceability (HG-4)

The Beautiful Mermaid palette source is the local read-only reference repository.
Provenance is recorded identically in three places — `demo/const/themes.js`
(`THEME_SOURCE`), `theme-css-report.json` (`cssSource`), and
`theme-verification.md` — giving one canonical naming scheme.

| Field | Value | Verified |
|---|---|---|
| repo | `lukilabs/beautiful-mermaid` | yes |
| url | `https://github.com/lukilabs/beautiful-mermaid` | yes |
| localPath | `references/beautiful-mermaid` | exists |
| sourceFile | `src/theme.ts` (`THEMES` export) | exists |
| commit | `2ac8bbbb060ca0a65a6a21f3200bd99b1587b488` | `git log -1` confirms |
| commitDate | `2026-05-06T12:53:19+02:00` | matches |
| version | `1.1.3` | `package.json` + `git describe` = `v1.1.3-12-g2ac8bbb` |

### 3.1 CDN independence

No runtime `import` of `beautiful-mermaid` exists in `demo/**`. Palette values
are transcribed into the local data module `demo/const/themes.js`. Derived colors
are computed in JS via sRGB channel interpolation (weights aligned to `theme.ts`
`MIX`) and applied as inline CSS custom properties on `<html data-theme>`. The
default theme (`mermaid-default`) renders with no overlay at all, so it needs no
network.

### 3.2 Palette fidelity

All 8 curated Beautiful Mermaid themes in `demo/const/themes.js` were compared
byte-for-byte against `references/beautiful-mermaid/src/theme.ts` `THEMES` at the
pinned commit. Result: **8/8 byte-match** (bg, fg, and provided line/accent/muted).

The `MIX` weights in `themes.js` (`{ sec: 60, muted: 40, line: 50, arrow: 85,
surface: 3, border: 20 }`) map to `theme.ts` MIX (`textSec 60`, `textMuted 40`,
`line 50`, `arrow 85`, `nodeFill 3`, `nodeStroke 20`).

---

## 4. Theming Architecture

### 4.1 Approach: page-level CSS overlay

Theme switching applies a **CSS overlay** on top of the already-rendered,
normalized Mermaid SVG. The render path is untouched. This is chosen because:

1. It does not alter the core rendering flow (spec §8 hard constraint).
2. Switching is instant — no re-render needed.
3. It adapts Beautiful Mermaid's CSS-custom-property model to official Mermaid
   SVG output.
4. It stays entirely within `demo/**` (no `src/**` edits).

### 4.2 Why it works

The official Mermaid default-theme output applies colors only through a `<style>`
block scoped by the SVG root id, never as inline color attributes. The SVG Output
Loop's `normalizeSvg` canonicalizes the root id from `m2s-N` → `mermaid-svg`, so
every embedded selector is scoped by `#mermaid-svg`. A page rule with higher
specificity — `[data-theme] #mermaid-svg .node rect` (1 attribute + 1 id) — wins
over `#mermaid-svg .node rect` (1 id), so the overlay overrides without
`!important`.

### 4.3 Color-role mapping

| Beautiful Mermaid variable | Mermaid SVG target | Role |
|---|---|---|
| `--bg` | `#mermaid-svg` background | Canvas background |
| `--fg` → `--m-text` | root fill, `.label`, `.marker` | Primary text + arrowheads |
| `--m-line` | `.edgePath .path`, `.flowchart-link`, edges | Connectors |
| `--m-surface` | `.node rect/circle/...`, `.actor`, `.entityBox` | Node box fill |
| `--m-border` | node shape stroke | Node box stroke |
| `--m-sec` | cluster labels, edge labels | Secondary text |

### 4.4 Switch mechanics

1. User clicks a theme button → `applyTheme(id)` sets `data-theme` on
   `document.documentElement` (themes both the editor preview and the examples
   gallery at once) and inlines the derived CSS custom properties.
2. `mermaid-default` removes the `data-theme` attribute, so overlay rules no
   longer match → native Mermaid look restored.
3. The active id persists to `localStorage` key `m2s-theme`.
4. On load, the stored theme is restored; unknown ids fall back to
   `mermaid-default` so a stale value never breaks the page.

---

## 5. Curated Theme Set

Nine entries cover light, dark, and popular palettes, keeping the switcher
readable:

| id | label | type |
|---|---|---|
| `mermaid-default` | Mermaid Default | sentinel — disables overlay |
| `zinc-light` | Zinc Light | light |
| `zinc-dark` | Zinc Dark | dark |
| `tokyo-night` | Tokyo Night | dark colored |
| `catppuccin-mocha` | Catppuccin Mocha | dark colored |
| `nord` | Nord | dark colored |
| `github-light` | GitHub Light | light |
| `github-dark` | GitHub Dark | dark |
| `dracula` | Dracula | dark colored |

---

## 6. Diagram-Type Coverage

The overlay CSS targets selectors across all 8 MVP diagram types (HG-1 scope):

| type | themed selectors |
|---|---|
| flowchart / graph | `.node rect/circle/...`, `.edgePath .path`, `.flowchart-link`, `.marker` |
| sequenceDiagram | `.actor`, `.actor-line`, `.messageLine0/1`, `.messageText`, `.labelBox` |
| classDiagram / erDiagram | `g.classGroup rect`, `.entityBox`, `.relationshipLine` |
| stateDiagram-v2 | `g.stateGroup rect`, `.transition`, `.statediagram-cluster rect` |
| pie | `.slice`, `.pieTitleText`, `.legend text` |
| gantt | `.sectionTitle/0-3`, `.titleText` |
| xychart-beta | `.grid .tick text`, `.vertText` |

Known limitation (recorded, not silently weakened): some relationship-arrowhead
rules in classDiagram/erDiagram use `!important` in Mermaid's embedded style and
are not overridden by the overlay; the relationship lines themselves are themed.

---

## 7. Verification Summary

### 7.1 Build

| Command | Exit | Output |
|---|---|---|
| `bun run build` | 0 | `demo/dist` produced; overlay CSS bundled into `assets/index-*.css` |

The build merges `demo/theme.css` into the bundled CSS. A grep of built CSS
confirms the overlay selector `[data-theme] #mermaid-svg` and derived-variable
references `var(--m-surface)`, `var(--m-text)` are present.

### 7.2 Runtime switch probe

A Playwright probe served the built `demo/dist` over local static HTTP, rendered a
flowchart, and read computed styles across theme switches. The probe asserts SVG
DOM structure and computed colors only — no screenshots, canvas, or image data
(HG-3).

| theme | node rect fill | svg background |
|---|---|---|
| mermaid-default | `rgb(236, 236, 255)` | `rgba(0, 0, 0, 0)` |
| zinc-dark | `rgb(31, 31, 34)` | `rgb(24, 24, 27)` |
| dracula | `rgb(46, 48, 60)` | `rgb(40, 42, 54)` |
| restored → default | `rgb(236, 236, 255)` | `rgba(0, 0, 0, 0)` |
| after reload (nord) | `rgb(51, 57, 69)` | `rgb(46, 52, 64)` |

Observed derived surfaces match manual sRGB interpolation exactly (e.g. zinc-dark
surface = mix(fg, bg, 3%) → `[31,31,34]`). Key assertions all pass: different
themes produce different fills; default restored on return; theme persists across
reload via `localStorage`; zero uncaught page errors.

### 7.3 Render-flow isolation

`git show --name-only` across all theme commits (`13efbf4`, `4805e65`, `b7da3a6`,
`96a9235`) confirms only `demo/**`, `docs/theme/**`, and
`workflow/reports/theme-css-report.json` were touched. **No `src/` change.** The
theme overlay never calls `mermaid.configure` or re-renders.

### 7.4 Blocked-pattern scan

A grep of `demo/**` for `puppeteer`, `mermaid-cli`, `screenshot`, `toDataURL`,
`canvas.toBlob`, `getImageData`, server-render references found **0** matches.

### 7.5 Regression tests

| Command | Result |
|---|---|
| `bun test test/render-yml.test.mjs` | 19 pass / 0 fail |
| `bun test test/svg-output.test.mjs` | 29 pass / 0 fail |

Total: **48 pass / 0 fail**. The theme overlay introduced no regressions.

---

## 8. Commit Sequence

All commits follow conventional commits format.

| Commit | Phase | Message |
|---|---|---|
| `13efbf4` | 02 plan | `docs(theme): add theme loop plan` |
| `4805e65` | 03 implementation | `feat(theme): add beautiful mermaid css theme switching` |
| `b7da3a6` | 03 implementation | `chore(theme): record theme css report` |
| `ab1f96a` | 03 implementation | `fix(theme): move css overlay to plain theme.css` |
| `96a9235` | 04 verification | `docs(theme): record theme verification` |

The `ab1f96a` fix moved the overlay from `demo/style.styl` to a standalone
`demo/theme.css` because the pre-commit Stylus formatter would rewrite class
names that must match Mermaid's emitted SVG classes verbatim.

---

## 9. Deferred to Later Loops

These items are explicitly out of scope for the Theme Loop and are handed off:

| Item | Target loop | Current state |
|---|---|---|
| Theme button labels in all 75 locales | I18N Loop | Hardcoded English marked `TODO(i18n-loop)` |
| Size / gzip comparison SVG bar chart | Size Loop | Not started |
| Cloudflare Pages deployment config | Deploy Loop | Not started |

---

## 10. Outcome

All Theme Loop acceptance criteria are satisfied:

- Theme switching produces visibly different SVG styling across light, dark, and
  colored palettes.
- The switch button is interactive; active state is reflected.
- Switching back to default restores the native Mermaid look.
- Theme persists across reloads via `localStorage`.
- CSS source is traceable to a pinned commit in the local reference repo.
- Default theme needs no external CDN.
- The core render flow (`src/**`) is untouched.
- No forbidden patterns are present.
- Existing tests pass with no regressions.

**Status: pass.**
