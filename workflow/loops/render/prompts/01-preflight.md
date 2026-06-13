# Render Loop Phase 01: Preflight

Verify that the render loop has enough inputs to start renderer work.

## Allowed files

- `workflow/runs/render/**`
- `docs/render/**`

## Blocked files

- `../docs/**`
- `references/**`
- `demo/**`
- `src/**`
- `test/**`
- `extract/**`

## Required checks

- Confirm `test/schema.yml` exists.
- Confirm at least one executable `test/*.yml` file exists.
- Confirm `extract/report.json` exists and includes the three required source repositories.
- Confirm the parent canonical docs are readable.

## Renderer constraints

- Use the official Mermaid browser API in later implementation phases.
- Do not implement a Mermaid parser.
- Do not implement a Mermaid layout engine.
- Playwright may be used only as a real-browser test harness.
- Do not use screenshots, image snapshots, canvas, pixel data, or static SVG fixtures as the primary pass/fail oracle or conversion output.

## Verification

Run:

```bash
node --test workflow/loops/render/render-loop.test.mjs
```
