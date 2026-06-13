# Phase 3: Repo Cleanup Execution

You are executing one phase of the Init Agent Loop.

## Goal
Execute only the non-human-gate cleanup from docs/init/cleanup-plan.md.

## Inputs to read
- docs/init/cleanup-plan.md
- docs/init/cleanup-risk.md
- docs/init/preserve-list.md
- AGENTS.md

## Allowed writes
- docs/init/cleanup-execution.md
- project files listed in cleanup-plan.md under the remove section only
- package/build config only if required to keep project install/build scripts coherent after cleanup

## Forbidden actions
- Do not remove anything listed under keep, defer, or human_gate.
- Do not modify ../docs/mermaid-svg-spec.md.
- Do not modify ../docs/acceptance-criteria.md.
- Do not modify references/**.
- Do not delete design/static assets.
- Do not add runtime dependencies.
- Do not implement the converter.
- Do not deploy.
- Do not run git push or publish commands.

## Required output
Write docs/init/cleanup-execution.md with:
- files/directories removed
- files modified
- package scripts touched, if any
- rationale for each change
- anything deferred
- commands run

## Execution rules
- Be conservative.
- Prefer leaving uncertain code in place over deleting it.
- Keep the repository runnable if it was runnable before.
- If cleanup-plan.md is ambiguous, do not guess. Record the ambiguity in docs/init/cleanup-execution.md and skip that item.

## Completion rule
Stop after executing safe cleanup and writing cleanup-execution.md.
