# Phase 2: Repo Cleanup Plan

You are executing one phase of the Init Agent Loop.

## Goal

Create a deterministic cleanup plan for turning the original repo into a lean Mermaid-to-SVG project baseline.

## Inputs to read

- AGENTS.md
- ../docs/mermaid-svg-spec.md
- ../docs/acceptance-criteria.md
- ../docs/mermaid-svg-architecture.md
- docs/init/project-inventory.md
- docs/init/preserve-list.md
- docs/init/remove-candidates.md
- current repository tree

## Allowed writes

- docs/init/cleanup-plan.md
- docs/init/cleanup-risk.md

## Forbidden actions

- Do not delete files.
- Do not modify source code.
- Do not modify ../docs/mermaid-svg-spec.md.
- Do not modify ../docs/acceptance-criteria.md.
- Do not modify references/\*\*.
- Do not implement the converter.
- Do not add dependencies.
- Do not deploy.

## Required cleanup-plan structure

Write docs/init/cleanup-plan.md with four sections:

1. keep
   - files/directories to preserve
   - reason
2. remove
   - files/directories safe to remove automatically
   - reason
   - confidence must be high
3. defer
   - files/directories that may be removable later but need more context
   - reason
4. human_gate
   - files/directories requiring explicit human approval before deletion
   - reason

## Required cleanup-risk structure

Write docs/init/cleanup-risk.md with:

- possible breakages from cleanup
- build/test risks
- design asset preservation risks
- dependency risks
- recommended rollback strategy

## Planning rules

- Preserve demo scaffolding if it can host the Mermaid playground.
- Preserve CSS/style/design assets if they help match math.webc.site style.
- Preserve deployment config if reusable for Cloudflare Pages.
- Preserve license/README metadata.
- Never plan to remove ../docs/mermaid-svg-spec.md or ../docs/acceptance-criteria.md.
- Never plan to modify reference repos.

## Completion rule

Stop after writing the cleanup plan and risk document. Do not execute the cleanup.
