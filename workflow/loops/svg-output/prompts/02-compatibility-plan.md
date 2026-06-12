# SVG Output Compatibility Plan

You are executing the `compatibility-plan` phase of the SVG Output Compatibility Loop.

## Mission

Write the narrow implementation plan for normalizing Mermaid renderer SVG output. The plan must map directly to the canonical SVG Output Compatibility requirements: root SVG, `viewBox`, stable dimensions, deterministic output, no runtime JS dependency, unsafe content removal, and explicit error result shape.

## Allowed files

- `docs/svg-output/svg-output-plan.md`
- `workflow/runs/svg-output/**`

## Blocked files

- `../docs/**`
- `../references/**`
- `demo/**`
- `src/**`
- `test/**`
- `workflow/reports/**`
- Theme, size, i18n, and deployment files

## Required content

- Inputs: `src/render/mermaid-to-svg.js`, `test/render-yml.test.mjs`, `workflow/reports/render-capabilities.json`.
- Outputs: `src/render/normalize-svg.js`, `test/svg-output.test.mjs`, `workflow/reports/svg-output-compatibility.json`.
- Acceptance rules for root `<svg>`, `viewBox`, dimensions, deterministic output, unsafe content, and error result shape.
- Verification commands that include render tests and SVG output tests.

## Hard boundaries

- SVG Output Compatibility only.
- Do not implement a Mermaid parser.
- Do not implement a Mermaid layout engine.
- Do not use screenshots, canvas, server rendering, or static SVG fixtures.
- Do not work on demo UI, theme switching, size comparison, i18n, or deployment.
- Do not add fixture-specific local fixes. Use general SVG structural rules only.

## Verification

The orchestrator requires `docs/svg-output/svg-output-plan.md`.
