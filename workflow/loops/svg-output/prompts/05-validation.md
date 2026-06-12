# SVG Output Compatibility Validation

You are executing the `validation` phase of the SVG Output Compatibility Loop.

## Mission

Run the render and SVG output verification commands, refresh the compatibility report, and document the result.

## Allowed files

- `workflow/reports/svg-output-compatibility.json`
- `docs/svg-output/svg-output-validation.md`
- `workflow/runs/svg-output/**`

## Blocked files

- `../docs/**`
- `../references/**`
- `demo/**`
- `extract/**`
- Theme, size, i18n, and deployment files

## Required validation

- Render-loop tests still pass.
- SVG output tests pass.
- Compatibility report reflects actual checked rules.
- Validation document records commands, exit status, and any unsupported behavior.

## Hard boundaries

- SVG Output Compatibility only.
- Do not implement a Mermaid parser.
- Do not implement a Mermaid layout engine.
- Do not use screenshots, canvas, server rendering, or static SVG fixtures.
- Do not work on demo UI, theme switching, size comparison, i18n, or deployment.
- Do not claim support that is not proven by tests or machine-readable report data.

## Verification

The orchestrator requires `docs/svg-output/svg-output-validation.md` and `workflow/reports/svg-output-compatibility.json`.
