# SVG Output Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the third workflow loop, `svg-output-loop`, to orchestrate stable SVG output compatibility work after `render-loop`.

**Architecture:** The loop mirrors `init-loop` and `render-loop`: a deterministic TypeScript orchestrator, config-defined phases, OpenCode prompts, phase validators, a pinned OpenCode agent, state file, package script, and contract tests. It only prepares the workflow that will implement SVG output normalization; it does not implement demo UI, theme switching, size comparison, i18n, or deployment.

**Tech Stack:** Node.js test runner, TypeScript via `tsx`, OpenCode SDK runner shared from `workflow/loops/init/lib`, JSON state and reports.

---

## File Structure

- `workflow/loops/svg-output/svg-output-loop.ts`: orchestrates phases and records run summaries.
- `workflow/loops/svg-output/svg-output-loop.config.ts`: defines loop metadata, required inputs, output artifacts, blocked patterns, and phase topology.
- `workflow/loops/svg-output/lib/validators.ts`: deterministic validators for render-loop inputs and SVG output artifacts.
- `workflow/loops/svg-output/prompts/*.md`: phase prompts for OpenCode.
- `.opencode/agents/svg-output-agent.md`: agent-level boundaries and workflow rules.
- `workflow/state/svg-output-loop.state.json`: resumable loop state.
- `workflow/loops/svg-output/svg-output-loop.test.mjs`: contract tests for integration.
- `package.json`, `opencode.jsonc`, `.husky/pre-commit`, `workflow/hooks/pre-commit.test.mjs`: project integration points.

## Task 1: Contract Test

- [x] Write `workflow/loops/svg-output/svg-output-loop.test.mjs`.
- [x] Run `node --test workflow/loops/svg-output/svg-output-loop.test.mjs`.
- [x] Verify it fails because the loop is not implemented yet.

## Task 2: Loop Orchestrator

- [x] Add `workflow/loops/svg-output/svg-output-loop.config.ts`.
- [x] Add `workflow/loops/svg-output/svg-output-loop.ts`.
- [x] Add `workflow/loops/svg-output/lib/validators.ts`.

## Task 3: Agent And Prompts

- [x] Add `.opencode/agents/svg-output-agent.md`.
- [x] Add six phase prompts under `workflow/loops/svg-output/prompts/`.
- [x] Add `workflow/state/svg-output-loop.state.json` and `workflow/loops/svg-output/README.md`.

## Task 4: Project Integration

- [x] Add `agent:svg-output` script.
- [x] Register `svg-output-agent` in `opencode.jsonc`.
- [x] Include the new contract test in `.husky/pre-commit`.
- [x] Update `workflow/hooks/pre-commit.test.mjs`.

## Task 5: Verification And Commit

- [x] Run `node --test workflow/loops/svg-output/svg-output-loop.test.mjs`.
- [x] Run the full workflow contract suite.
- [x] Run `.husky/pre-commit`.
- [x] Commit with a conventional commit message.
