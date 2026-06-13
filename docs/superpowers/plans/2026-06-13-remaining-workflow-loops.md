# Remaining Workflow Loops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the remaining project workflow loops so the project can be completed through sequential OpenCode-driven phases.

**Architecture:** Reuse the existing deterministic orchestrator pattern from init/render/svg-output. Add a shared remaining-loop runner and validator, then define six concrete loop configs: web demo, theme, size, i18n, deploy, and final audit.

**Tech Stack:** Node.js test runner, TypeScript via `tsx`, OpenCode SDK runner shared from `workflow/loops/init/lib`, JSON state and report artifacts.

---

## File Structure

- `workflow/loops/remaining/lib/runner.ts`: shared deterministic loop runner.
- `workflow/loops/remaining/lib/validators.ts`: shared input/output artifact validation.
- `workflow/loops/<loop>/<loop>-loop.config.ts`: loop-specific phase topology.
- `workflow/loops/<loop>/<loop>-loop.ts`: loop entrypoint.
- `workflow/loops/<loop>/prompts/*.md`: OpenCode phase prompts.
- `.opencode/agents/*-agent.md`: agent-level boundaries.
- `workflow/state/*-loop.state.json`: resumable loop state.

## Tasks

- [x] Write failing remaining loop contract test.
- [x] Add shared remaining-loop runner and validators.
- [x] Add `web-demo-loop`.
- [x] Add `theme-loop`.
- [x] Add `size-loop`.
- [x] Add `i18n-loop`.
- [x] Add `deploy-loop`.
- [x] Add `final-audit-loop`.
- [x] Register package scripts and OpenCode agents.
- [x] Add execution order documentation.
- [x] Run full workflow contract suite.
- [x] Run pre-commit hook.
- [x] Commit with a conventional commit message.
