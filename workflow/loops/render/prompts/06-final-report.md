# Render Loop Phase 06: Final Report

Write the final render loop report from machine-readable artifacts.

## Allowed files

- `docs/render-loop-report.md`
- `workflow/runs/render/**`

## Blocked files

- `../docs/**`
- `references/**`
- `demo/**`
- `src/**`
- `test/**`
- `extract/**`
- `workflow/reports/render-capabilities.json`

## Required output

- `docs/render-loop-report.md`

The report must summarize:

- Renderer entry point.
- Render test runner.
- Capability report location.
- Verification commands and results.
- Remaining scope for the later SVG compatibility loop.

## Renderer constraints

- Use the official Mermaid browser API through the project renderer.
- Do not implement a Mermaid parser.
- Do not implement a Mermaid layout engine.
- Playwright may be used only as a real-browser test harness that calls the project renderer.
- Do not use screenshots, image snapshots, canvas, pixel data, or static SVG fixtures as the primary pass/fail oracle or conversion output.

## Verification

Run:

```bash
node --test workflow/loops/render/render-loop.test.mjs
```
