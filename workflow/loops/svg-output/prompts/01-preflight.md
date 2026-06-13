# SVG Output Compatibility Preflight

You are executing the `preflight` phase of the SVG Output Compatibility Loop.

## Mission

Confirm the render-loop artifacts are present before SVG output work starts.

## Allowed files

- `workflow/runs/svg-output/**`

## Blocked files

- `../docs/**`
- `references/**`
- `src/**`
- `test/**`
- `demo/**`
- `workflow/reports/**`

## Required checks

- Confirm `src/render/mermaid-to-svg.js` exists.
- Confirm `test/render-yml.test.mjs` exists.
- Confirm `workflow/reports/render-capabilities.json` exists and is valid JSON.
- Confirm canonical parent docs are available.

## Hard boundaries

- SVG Output Compatibility only.
- Do not implement a Mermaid parser.
- Do not implement a Mermaid layout engine.
- Playwright may be used only as a real-browser test harness.
- Do not use screenshots, image snapshots, canvas, pixel data, server rendering, or static SVG fixtures as the primary pass/fail oracle or conversion output.
- Do not work on demo UI, theme switching, size comparison, i18n, or deployment.

## Verification

The orchestrator validates this phase with deterministic file and JSON checks.
