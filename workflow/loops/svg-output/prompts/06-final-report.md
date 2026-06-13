# SVG Output Compatibility Final Report

You are executing the `final-report` phase of the SVG Output Compatibility Loop.

## Mission

Write the final SVG Output Compatibility Loop report from deterministic artifacts.

## Allowed files

- `docs/svg-output-loop-report.md`
- `workflow/runs/svg-output/**`

## Blocked files

- `../docs/**`
- `references/**`
- `demo/**`
- `extract/**`
- Theme, size, i18n, and deployment files

## Required report content

- Inputs consumed from render-loop.
- Output artifacts created.
- Compatibility rules checked.
- Verification commands and outcomes.
- Known unsupported cases with explicit reasons.
- Confirmation that demo UI, theme switching, size comparison, i18n, and deployment were left to later loops.

## Hard boundaries

- SVG Output Compatibility only.
- Do not implement a Mermaid parser.
- Do not implement a Mermaid layout engine.
- Playwright may be used only as a real-browser test harness that calls the project wrapper and asserts SVG string/DOM structure.
- Do not use screenshots, image snapshots, canvas, pixel data, server rendering, or static SVG fixtures as the primary pass/fail oracle or conversion output.
- Do not work on demo UI, theme switching, size comparison, i18n, or deployment.

## Verification

The orchestrator requires `docs/svg-output-loop-report.md`.
