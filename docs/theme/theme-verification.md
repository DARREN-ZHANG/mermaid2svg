# Theme Loop Verification

Theme Loop Phase 04 artifact. This document records the verification evidence for
Beautiful Mermaid CSS theme switching and CSS source/version traceability.

It is the companion to `workflow/reports/theme-css-report.json` (machine-readable)
and implements against the plan in `docs/theme/theme-plan.md`.

---

## 1. Verification Scope

| AC ref       | Requirement                                                                       | Status |
| ------------ | --------------------------------------------------------------------------------- | ------ |
| AC-THEME-001 | Theme switching affects Mermaid SVG styling                                       | pass   |
| AC-THEME-002 | Visible theme switch button; switch is interactive                                | pass   |
| AC-THEME-003 | Beautiful Mermaid CSS source/version traceable; no runtime CDN needed for default | pass   |
| HG-4         | Local `references/beautiful-mermaid` is the traceable source; commit pinned       | pass   |
| spec §8      | Theme switching does not alter the core render flow (`src/**` untouched)          | pass   |

---

## 2. CSS Source Provenance (HG-4)

The CSS palette source is the local read-only reference repository. Provenance was
re-verified at the pinned commit:

| Field      | Recorded value                                  | Verified                                                              |
| ---------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| repo       | `lukilabs/beautiful-mermaid`                    | yes                                                                   |
| url        | `https://github.com/lukilabs/beautiful-mermaid` | yes                                                                   |
| localPath  | `references/beautiful-mermaid`                  | exists                                                                |
| sourceFile | `src/theme.ts` (`THEMES` export)                | exists                                                                |
| commit     | `2ac8bbbb060ca0a65a6a21f3200bd99b1587b488`      | `git log -1` confirms                                                 |
| commitDate | `2026-05-06T12:53:19+02:00`                     | matches `git log -1 --format=%cI`                                     |
| version    | `1.1.3`                                         | `package.json` version = 1.1.3; `git describe` = `v1.1.3-12-g2ac8bbb` |

The same field set is reused verbatim in `demo/const/themes.js` (`THEME_SOURCE`)
and in `theme-css-report.json` (`cssSource`), giving one canonical naming scheme.

### 2.1 CDN independence

No runtime `import` of `beautiful-mermaid` exists in `demo/**`. The palette values
are transcribed into the local data module `demo/const/themes.js`. A grep for
`beautiful-mermaid` in `demo/` only matches comments and the `THEME_SOURCE`
provenance strings. Default theme (`mermaid-default`) renders with no overlay at
all, so it needs no network.

---

## 3. Palette Fidelity

All 8 curated Beautiful Mermaid themes in `demo/const/themes.js` were compared
byte-for-byte against `references/beautiful-mermaid/src/theme.ts` `THEMES` at the
pinned commit:

| theme            | bg      | fg      | line/accent/muted           | match |
| ---------------- | ------- | ------- | --------------------------- | ----- |
| zinc-light       | #FFFFFF | #27272A | (derived)                   | yes   |
| zinc-dark        | #18181B | #FAFAFA | (derived)                   | yes   |
| tokyo-night      | #1a1b26 | #a9b1d6 | #3d59a1 / #7aa2f7 / #565f89 | yes   |
| catppuccin-mocha | #1e1e2e | #cdd6f4 | #585b70 / #cba6f7 / #6c7086 | yes   |
| nord             | #2e3440 | #d8dee9 | #4c566a / #88c0d0 / #616e88 | yes   |
| github-light     | #ffffff | #1f2328 | #d1d9e0 / #0969da / #59636e | yes   |
| github-dark      | #0d1117 | #e6edf3 | #3d444d / #4493f8 / #9198a1 | yes   |
| dracula          | #282a36 | #f8f8f2 | #6272a4 / #bd93f9 / #6272a4 | yes   |

Result: **8/8 byte-match.**

The MIX weights in `themes.js` (`{ sec: 60, muted: 40, line: 50, arrow: 85,
surface: 3, border: 20 }`) map to `theme.ts` MIX (`textSec 60`, `textMuted 40`,
`line 50`, `arrow 85`, `nodeFill 3`, `nodeStroke 20`). Derived colors are computed
in JS by sRGB channel interpolation, which is numerically equivalent to CSS
`color-mix(in srgb, fg X%, bg)`.

---

## 4. Build Verification

| Command         | Exit | Output                                                              |
| --------------- | ---- | ------------------------------------------------------------------- |
| `bun run build` | 0    | `demo/dist` produced; overlay CSS bundled into `assets/index-*.css` |

The build merges `demo/theme.css` and `demo/style.css` into a single bundled CSS.
A grep of the built CSS confirms the overlay selector `[data-theme] #mermaid-svg`
and the derived-variable references `var(--m-surface)`, `var(--m-text)` are present.

The chunk-size warning (>500 kB) is expected and is tracked by the Size Loop, not
this loop.

---

## 5. Runtime Switch Probe

A fresh Playwright probe served the built `demo/dist` over a local static HTTP
server, rendered a flowchart (`graph TD; A[Start] --> B[Process] --> C[End]`),
and read computed styles across theme switches. The probe asserts SVG DOM
structure and computed colors only; it does **not** use screenshots, canvas, or
image data as an oracle (HG-3).

### 5.1 Observed computed styles

| theme               | data-theme attr | node rect fill       | svg background     |
| ------------------- | --------------- | -------------------- | ------------------ |
| mermaid-default     | (absent)        | `rgb(236, 236, 255)` | `rgba(0, 0, 0, 0)` |
| zinc-dark           | `zinc-dark`     | `rgb(31, 31, 34)`    | `rgb(24, 24, 27)`  |
| dracula             | `dracula`       | `rgb(46, 48, 60)`    | `rgb(40, 42, 54)`  |
| restored → default  | (absent)        | `rgb(236, 236, 255)` | `rgba(0, 0, 0, 0)` |
| after reload (nord) | `nord`          | `rgb(51, 57, 69)`    | `rgb(46, 52, 64)`  |

### 5.2 Derived-color cross-check

The observed derived surfaces match manual sRGB interpolation exactly:

- zinc-dark surface = mix(fg #FAFAFA, bg #18181B, 3%) → `[31, 31, 34]` (match)
- dracula surface = mix(fg #f8f8f2, bg #282a36, 3%) → `[46, 48, 60]` (match)
- nord surface = mix(fg #d8dee9, bg #2e3440, 3%) → `[51, 57, 69]` (match)
- zinc-dark background = bg #18181B → `rgb(24, 24, 27)` (match)
- dracula background = bg #282a36 → `rgb(40, 42, 54)` (match)

### 5.3 Assertions (all pass)

1. SVG `<svg>` root present (`#mermaid-svg`).
2. Default theme has no `data-theme` attribute (native Mermaid look).
3. zinc-dark sets `data-theme="zinc-dark"`; node fill and svg background both
   differ from default.
4. dracula node fill differs from zinc-dark (different themes → different fills).
5. Switching back to `mermaid-default` removes `data-theme` and restores the
   default node fill exactly.
6. Theme id persists to `localStorage` key `m2s-theme`.
7. After `localStorage` set to `nord` and page reload, `data-theme="nord"` is
   restored on load.
8. Zero uncaught page errors across all switches.

### 5.4 Diagram-type coverage

The overlay CSS (`demo/theme.css`) targets selectors across all 8 MVP diagram
types:

| type                     | themed selectors                                                         |
| ------------------------ | ------------------------------------------------------------------------ |
| flowchart / graph        | `.node rect/circle/...`, `.edgePath .path`, `.flowchart-link`, `.marker` |
| sequenceDiagram          | `.actor`, `.actor-line`, `.messageLine0/1`, `.messageText`, `.labelBox`  |
| classDiagram / erDiagram | `g.classGroup rect`, `.entityBox`, `.relationshipLine`                   |
| stateDiagram-v2          | `g.stateGroup rect`, `.transition`, `.statediagram-cluster rect`         |
| pie                      | `.slice`, `.pieTitleText`, `.legend text`                                |
| gantt                    | `.sectionTitle/0-3`, `.titleText`                                        |
| xychart-beta             | `.grid .tick text`, `.vertText`                                          |

Known limitation (recorded, not silently weakened): some relationship-arrowhead
rules in classDiagram/erDiagram use `!important` in Mermaid's embedded style and
are not overridden by the overlay; the relationship lines themselves are themed.

---

## 6. Render-flow isolation

The theme loop commits (`4805e65`, `ab1f96a`, `b7da3a6`, `13efbf4`) touch only
`demo/**`, `docs/theme/**`, and `workflow/reports/theme-css-report.json`. A
`git show --name-only` across all theme commits confirms **no `src/` change**.
Theme switching is a pure CSS overlay applied via `data-theme` on
`document.documentElement` plus inline CSS custom properties; it does not call
`mermaid.configure` or re-render (AC: "主题切换不应改变核心渲染流程").

---

## 7. Blocked-pattern scan

A grep of `demo/**` (`*.js`, `*.pug`, `*.styl`, `*.css`) for forbidden patterns
found **0** matches:

- `puppeteer` — absent
- `mermaid-cli` / `@mermaid-js/mermaid-cli` — absent
- `screenshot` / `toDataURL` / `canvas.toBlob` / `getImageData` — absent
- server-render / online-conversion references — absent

---

## 8. Regression tests

Existing tests were re-run to confirm the theme overlay introduced no
regressions:

| Command                             | Result           |
| ----------------------------------- | ---------------- |
| `bun test test/render-yml.test.mjs` | 19 pass / 0 fail |
| `bun test test/svg-output.test.mjs` | 29 pass / 0 fail |

Total: 48 pass / 0 fail.

---

## 9. Verification outcome

All Theme Loop acceptance criteria are satisfied:

- Theme switching produces visibly different SVG styling across light, dark, and
  colored palettes.
- The switch button is interactive and active-state is reflected.
- Switching back to default restores native Mermaid look.
- Theme persists across reloads via `localStorage`.
- CSS source is traceable to a pinned commit in the local reference repo.
- Default theme needs no external CDN.
- The core render flow (`src/**`) is untouched.
- No forbidden patterns are present.

Status: **pass.**
