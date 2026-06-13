# Render Loop Phase 05: Validation

Run render validation and record honest results.

## Allowed files

- `docs/render/render-validation.md`
- `workflow/reports/render-capabilities.json`
- `workflow/runs/render/**`

## Blocked files

- `../docs/**`
- `references/**`
- `demo/**`
- `src/**`
- `test/*.yml`
- `test/schema.yml`
- `extract/**`

## Required outputs

- `docs/render/render-validation.md`
- `workflow/reports/render-capabilities.json`

The validation document must include:

- Exact commands run.
- Exit codes.
- Number of YAML cases read.
- Number of rendered cases passed.
- Unsupported cases with reasons.

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
