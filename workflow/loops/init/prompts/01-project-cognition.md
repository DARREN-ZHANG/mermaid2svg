# Phase 1: Project Cognition

You are executing one phase of the Init Agent Loop.

## Goal
Build project cognition for a minimal-fast Mermaid-to-SVG project. This phase is analysis and documentation only.

## Inputs to read
- ../docs/mermaid-svg-spec.md
- ../docs/acceptance-criteria.md
- ../docs/mermaid-svg-architecture.md
- current repository tree
- package/build/deployment config if present
- demo/public/style/design assets if present

## Allowed writes
- AGENTS.md
- docs/init/project-inventory.md
- docs/init/preserve-list.md
- docs/init/remove-candidates.md

## Forbidden actions
- Do not delete files.
- Do not modify source code.
- Do not modify ../docs/mermaid-svg-spec.md.
- Do not modify ../docs/acceptance-criteria.md.
- Do not modify ../references/**.
- Do not implement the converter.
- Do not add dependencies.
- Do not deploy.

## Required outputs

### AGENTS.md
Create or update AGENTS.md with operational rules for future coding agents. Include:
- project goal
- non-goals
- coding-agent boundaries
- protected files
- dependency policy
- testing policy
- repo cleanup policy
- Human Gate policy

### docs/init/project-inventory.md
Include:
- detected app framework/build tooling
- source directories and their apparent responsibilities
- demo/design assets found
- scripts found in package.json
- deployment config found
- risks/unknowns

### docs/init/preserve-list.md
Classify files/directories that should be preserved. Explain why.

### docs/init/remove-candidates.md
Classify files/directories that appear unrelated to the Mermaid-to-SVG goal. Do not remove them in this phase. Include confidence: high/medium/low.

## Completion rule
Stop after producing the required documents. Do not proceed to cleanup.
