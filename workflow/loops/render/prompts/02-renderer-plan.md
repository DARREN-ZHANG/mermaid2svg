# Render Loop Phase 02: Renderer Plan

Create a narrow implementation plan for the Mermaid source to SVG renderer and YAML render tests.

## Allowed files

- `docs/render/renderer-plan.md`
- `workflow/runs/render/**`

## Blocked files

- `../docs/**`
- `../references/**`
- `demo/**`
- `src/**`
- `test/**`
- `extract/**`
- `workflow/reports/**`

## Required output

- `docs/render/renderer-plan.md`

The plan must define:

- Renderer module path and public API.
- YAML render test runner path and assertions.
- Capability report shape.
- Verification commands.
- Commit sequence using conventional commits.

## Renderer constraints

- Use the official Mermaid browser API.
- Do not implement a Mermaid parser.
- Do not implement a Mermaid layout engine.
- Do not use screenshots, canvas, image snapshots, or static SVG fixtures as a substitute for rendering.
- Do not use server rendering or third-party online conversion services.

## Verification

Run:

```bash
node --test workflow/loops/render/render-loop.test.mjs
```
