# Phase 4: Reference Repo Mining

You are executing one phase of the Init Agent Loop.

## Goal
Read the three local reference repositories and produce a structured inventory of reusable Mermaid test candidates.

## Inputs to read
- ../references/maid
- ../references/beautiful-mermaid
- ../references/mermaid
- ../docs/mermaid-svg-spec.md
- ../docs/acceptance-criteria.md
- AGENTS.md

## Allowed writes
- docs/init/reference-inventory.md
- docs/init/test-candidates.json

## Forbidden actions
- Do not modify ../references/**.
- Do not modify ../docs/mermaid-svg-spec.md.
- Do not modify ../docs/acceptance-criteria.md.
- Do not generate YAML tests in this phase.
- Do not implement the converter.
- Do not add dependencies.
- Do not deploy.

## Candidate classification
Every candidate must use one of these classifications:
- minimal_core
- useful_later
- unsupported_candidate
- invalid_or_non_deterministic

## Candidate JSON schema
Write docs/init/test-candidates.json as a JSON array. Each item must include:

```json
{
  "id": "string",
  "sourceRepo": "maid | beautiful-mermaid | mermaid",
  "sourcePath": "string",
  "type": "flowchart | sequenceDiagram | classDiagram | stateDiagram | erDiagram | gantt | pie | other",
  "priority": "P0 | P1 | P2",
  "classification": "minimal_core | useful_later | unsupported_candidate | invalid_or_non_deterministic",
  "input": "Mermaid source",
  "reason": "string"
}
```

## Mining rules
- Prefer small canonical examples over large examples.
- Prefer syntactic breadth over high volume.
- Include at least 5 minimal_core candidates if available.
- Include at least 3 flowchart/graph candidates if available.
- Search for sequenceDiagram candidates.
- Search for classDiagram or stateDiagram candidates.
- Mark browser-dependent, snapshot-heavy, theme-only, or layout-nondeterministic tests as useful_later or unsupported_candidate.
- Do not silently discard interesting unsupported cases; classify them.

## docs/init/reference-inventory.md
Include:
- where examples/tests were found in each repo
- useful directories/files
- candidate counts by repo and diagram type
- unsupported or risky categories
- notable gaps

## Completion rule
Stop after writing reference-inventory.md and test-candidates.json.
