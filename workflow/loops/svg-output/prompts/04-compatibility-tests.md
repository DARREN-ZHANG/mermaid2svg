# SVG Output Compatibility Tests

You are executing the `compatibility-tests` phase of the SVG Output Compatibility Loop.

## Mission

Add tests and a machine-readable report proving SVG output compatibility rules.

## Allowed files

- `test/svg-output.test.mjs`
- `workflow/reports/svg-output-compatibility.json`
- `docs/svg-output/**`
- `workflow/runs/svg-output/**`

## Blocked files

- `../docs/**`
- `../references/**`
- `demo/**`
- `test/*.yml`
- `extract/**`
- Theme, size, i18n, and deployment files

## Required test coverage

- Valid SVG root is preserved.
- Missing `viewBox` is handled by a general rule, not a fixture-specific patch.
- Unsafe runtime JS content is rejected or removed.
- Repeated normalization of the same SVG is deterministic.
- Invalid SVG returns a clear error result.

## Required report

Write `workflow/reports/svg-output-compatibility.json` with:

- `summary`
- `checkedRules`
- `failures`

## Hard boundaries

- SVG Output Compatibility only.
- Do not implement a Mermaid parser.
- Do not implement a Mermaid layout engine.
- Do not use screenshots, canvas, server rendering, or static SVG fixtures.
- Do not work on demo UI, theme switching, size comparison, i18n, or deployment.

## Verification

- Run `node --test test/svg-output.test.mjs`.
- Run `node --test test/render-yml.test.mjs` if render-loop artifacts are present.
- Run `node --test workflow/loops/svg-output/svg-output-loop.test.mjs`.
