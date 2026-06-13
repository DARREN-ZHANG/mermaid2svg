# Render Loop Phase 03: Renderer Implementation

Implement the minimal Mermaid source to SVG renderer.

## Allowed files

- `src/render/**`
- `docs/render/**`
- `package.json`
- `workflow/runs/render/**`

## Blocked files

- `../docs/**`
- `references/**`
- `demo/**`
- `test/*.yml`
- `extract/**`
- `workflow/reports/**`

## Required output

- `src/render/mermaid-to-svg.js`

The renderer must:

- Accept Mermaid source text.
- Call the official Mermaid browser API.
- Return SVG text on success.
- Return or throw clear errors for empty input, invalid syntax, render failures, and timeout failures.
- Keep the conversion path short.

## Renderer constraints

- Use the official Mermaid browser API.
- Do not implement a Mermaid parser.
- Do not implement a Mermaid layout engine.
- Do not use screenshots, canvas, image snapshots, or static SVG fixtures as a substitute for rendering.
- Do not add `puppeteer`, `playwright`, `@mermaid-js/mermaid-cli`, or online renderer integrations.

## Verification

Run:

```bash
node --test workflow/loops/render/render-loop.test.mjs
```
