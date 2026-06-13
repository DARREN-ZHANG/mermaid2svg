# Phase 5: Minimal Test Extraction

You are executing one phase of the Init Agent Loop.

## Goal
Create the repeatable test extraction entrypoint and use it to generate a minimal Mermaid YAML test set.

## Inputs to read
- docs/init/test-candidates.json
- docs/init/reference-inventory.md
- ../docs/mermaid-svg-spec.md
- ../docs/acceptance-criteria.md
- AGENTS.md

## Allowed writes
- extract/run.js
- extract/report.json
- test/schema.yml
- test/*.yml
- docs/test-inventory.md

## Forbidden actions
- Do not modify ../docs/mermaid-svg-spec.md.
- Do not modify ../docs/acceptance-criteria.md.
- Do not modify references/**.
- Do not implement the converter.
- Do not add dependencies.
- Do not create permanent exclusion files.
- Do not deploy.

## extract/run.js
The script must:

- read from local `references/maid`, `references/beautiful-mermaid`, and `references/mermaid`
- generate all accepted tests into `test/*.yml`
- generate `test/schema.yml`
- generate `extract/report.json`
- record skipped candidates with reasons
- avoid mutating `references/**`

## YAML test schema
Every generated test file must follow this shape:

```yaml
id: string
source:
  repo: string
  path: string
  url: null
diagram:
  type: string
  title: null
input:
  mermaid: |
    Mermaid source here
expect:
  render: true
  svg:
    root: true
    viewBox: true
    containsText: []
skip:
  enabled: false
  reason: null
```

## Extraction rules
- Generate a small, high-signal set suitable for manual review.
- Prefer minimal_core candidates.
- Include at least 5 tests if candidates allow.
- Include at least 3 flowchart/graph tests if candidates allow.
- Include at least 1 sequenceDiagram test if candidates allow.
- Include at least 1 classDiagram or stateDiagram test if candidates allow.
- Keep generated test files directly under `test/`; do not use `test/generated`.
- Use stable IDs.
- Preserve sourceRepo and sourcePath.
- Do not invent inputs unrelated to the candidates unless the candidate is too large and can be reduced while preserving its intent.

## docs/test-inventory.md
Include:
- generated tests table
- source repo/path for each test
- diagram type coverage
- omitted candidates and why
- unsupported_candidate summary
- recommended MVP syntax boundary implied by the tests

## extract/report.json
Include:
- `sources.probelabs/maid`
- `sources.lukilabs/beautiful-mermaid`
- `sources.mermaid-js/mermaid`
- scanned file counts
- candidate counts
- accepted and skipped counts
- `byDiagramType`
- `skipReasons`
- skipped sample source paths and reasons

## Completion rule
Stop after writing `extract/run.js`, running it, and writing generated YAML tests, `test/schema.yml`, `extract/report.json`, and `docs/test-inventory.md`.
