# Phase 6: Spec Feedback

You are executing one phase of the Init Agent Loop.

## Goal
Write spec and acceptance update proposals based on the actual reference mining and minimal test extraction results.

## Inputs to read
- ../docs/mermaid-svg-spec.md
- ../docs/acceptance-criteria.md
- docs/init/reference-inventory.md
- docs/init/test-candidates.json
- docs/test-inventory.md
- test/*.yml

## Allowed writes
- docs/spec-update-proposal.md
- docs/acceptance-update-proposal.md

## Forbidden actions
- Do not modify ../docs/mermaid-svg-spec.md.
- Do not modify ../docs/acceptance-criteria.md.
- Do not modify ../references/**.
- Do not modify generated tests in this phase.
- Do not implement the converter.
- Do not add dependencies.
- Do not deploy.

## docs/spec-update-proposal.md must include
- reference repos analyzed
- actual test categories discovered
- proposed MVP support boundary
- syntax explicitly unsupported in MVP
- syntax deferred to later phases
- dependency risk notes
- cleanup implications
- open Human Gate decisions

## docs/acceptance-update-proposal.md must include
- proposed acceptance criteria additions
- generated test count and required coverage
- test schema expectation
- rules for unsupported_candidate handling
- rules for not deleting upstream-derived tests without Human Gate
- proposed readiness definition for formal task decomposition

## Completion rule
Stop after writing the two proposal documents. Do not modify canonical docs.
