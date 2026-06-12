# SVG Output Compatibility Normalizer Implementation

You are executing the `normalizer-implementation` phase of the SVG Output Compatibility Loop.

## Mission

Implement the smallest general SVG output normalization API around the renderer output.

## Allowed files

- `src/render/normalize-svg.js`
- `src/render/mermaid-to-svg.js`
- `docs/svg-output/**`
- `workflow/runs/svg-output/**`

## Blocked files

- `../docs/**`
- `../references/**`
- `demo/**`
- `test/*.yml`
- `extract/**`
- Theme, size, i18n, and deployment files

## Required behavior

- Preserve valid Mermaid-rendered SVG content.
- Ensure the result has an `<svg>` root and usable `viewBox`.
- Keep dimensions stable and embeddable.
- Remove runtime JS hazards such as `<script>` and inline event handlers.
- Produce deterministic output for the same input.
- Return explicit structured errors for invalid or missing SVG.

## Hard boundaries

- SVG Output Compatibility only.
- Do not implement a Mermaid parser.
- Do not implement a Mermaid layout engine.
- Do not use screenshots, canvas, server rendering, or static SVG fixtures.
- Do not work on demo UI, theme switching, size comparison, i18n, or deployment.
- Do not add fixture-specific local fixes. Use general SVG structural rules only.

## Verification

- Run `node --test workflow/loops/svg-output/svg-output-loop.test.mjs`.
- The orchestrator requires `src/render/normalize-svg.js`.
