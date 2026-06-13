# Phase 7: Verification

You are executing one phase of the Init Agent Loop.

## Goal

Run available project checks honestly and record the results. Do not fake success.

## Inputs to read

- package.json
- AGENTS.md
- docs/init/\*
- docs/test-inventory.md
- test/\*.yml

## Allowed writes

- docs/init/verification.md
- package.json only if adding missing non-runtime scripts is necessary for initialization checks and does not add runtime dependencies

## Forbidden actions

- Do not modify ../docs/mermaid-svg-spec.md.
- Do not modify ../docs/acceptance-criteria.md.
- Do not modify references/\*\*.
- Do not implement the converter.
- Do not add runtime dependencies.
- Do not deploy.
- Do not mark failed commands as passed.

## Commands to attempt if available

- npm install, if package-lock/package setup requires it and dependencies are missing
- npm test, if script exists
- npm run build, if script exists
- npm run extract, if script exists
- git diff --stat
- find test -name '_.yml' -o -name '_.yaml'

## docs/init/verification.md must include

- command table with command/status/exit code
- stdout/stderr summary for failures
- scripts that did not exist
- generated test count
- final git diff summary
- whether repo is ready for formal task decomposition
- blocking issues, if any

## Completion rule

Stop after writing docs/init/verification.md.
