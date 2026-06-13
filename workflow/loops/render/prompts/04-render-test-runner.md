# Render Loop Phase 04: Render Test Runner

Implement automated render tests for extracted YAML cases.

## Allowed files

- `test/render-yml.test.mjs`
- `workflow/reports/render-capabilities.json`
- `docs/render/**`
- `package.json`
- `workflow/runs/render/**`

## Blocked files

- `../docs/**`
- `references/**`
- `demo/**`
- `test/*.yml`
- `test/schema.yml`
- `extract/**`

## Required outputs

- `test/render-yml.test.mjs`
- `workflow/reports/render-capabilities.json`

The runner must:

- Read `test/schema.yml`.
- Read generated `test/*.yml` cases.
- Validate schema before rendering.
- Render executable cases through `src/render/mermaid-to-svg.js`.
- Assert `<svg` root and `viewBox`.
- Record supported and unsupported cases in `workflow/reports/render-capabilities.json`.

## Renderer constraints

- Use the official Mermaid browser API through the project renderer.
- Do not implement a Mermaid parser.
- Do not implement a Mermaid layout engine.
- Do not use screenshots, canvas, image snapshots, or static SVG fixtures as a substitute for rendering.

## Verification

Run:

```bash
node --test test/render-yml.test.mjs workflow/loops/render/render-loop.test.mjs
```
