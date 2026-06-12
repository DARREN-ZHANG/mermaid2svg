# Init Loop Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the init loop into `mermaid2svg` under the project workflow structure and align it with the Mermaid to SVG spec.

**Architecture:** The init loop lives under `workflow/loops/init` with state and run artifacts under `workflow/state`, `workflow/runs/init`, and `workflow/reports`. It reads canonical docs and reference repos from the parent workspace, while project deliverables remain inside `mermaid2svg`.

**Tech Stack:** TypeScript, `tsx`, Node.js filesystem/process APIs, OpenCode SDK, Node `node:test` for lightweight workflow contract checks.

---

### Task 1: Lock Workflow Contract

**Files:**
- Create: `workflow/loops/init/init-loop.test.mjs`

- [x] **Step 1: Write the failing test**

Create a Node test that verifies the init loop script, config, prompt paths, docs paths, reference paths, and package script use the intended workflow layout.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test workflow/loops/init/init-loop.test.mjs`
Expected: FAIL because `workflow/loops/init/init-loop.config.ts` does not exist yet.

### Task 2: Move Init Loop Into Workflow

**Files:**
- Create: `workflow/loops/init/**`
- Create: `workflow/state/init-loop.state.json`
- Modify: `package.json`

- [x] **Step 1: Copy orchestrator files into `workflow/loops/init`**

Move the existing init-loop implementation into the workflow tree without changing runtime behavior yet.

- [x] **Step 2: Update package script**

Set `scripts.agent:init` to `tsx workflow/loops/init/init-loop.ts`.

### Task 3: Align Config, Validators, and Prompts

**Files:**
- Modify: `workflow/loops/init/init-loop.config.ts`
- Modify: `workflow/loops/init/init-loop.ts`
- Modify: `workflow/loops/init/lib/*.ts`
- Modify: `workflow/loops/init/prompts/*.md`
- Modify: `workflow/loops/init/README.md`

- [x] **Step 1: Point docs and references to parent workspace**

Use `../docs/mermaid-svg-spec.md`, `../docs/acceptance-criteria.md`, `../docs/mermaid-svg-architecture.md`, and `../references/{maid,beautiful-mermaid,mermaid}`.

- [x] **Step 2: Use workflow artifact locations**

Use `workflow/state/init-loop.state.json`, `workflow/runs/init`, and `workflow/reports`.

- [x] **Step 3: Align test extraction outputs**

Require `extract/run.js`, `extract/report.json`, `test/schema.yml`, and `test/*.yml`.

- [x] **Step 4: Remove automatic reference cloning**

Preflight should verify local references exist and block clearly if they do not.

### Task 4: Verify and Commit

**Files:**
- All modified files

- [x] **Step 1: Run workflow contract test**

Run: `node --test workflow/loops/init/init-loop.test.mjs`
Expected: PASS.

- [x] **Step 2: Run TypeScript syntax/import check**

Run: `pnpm exec tsx workflow/loops/init/init-loop.ts`
Expected: It may stop before OpenCode if dependencies are missing or external services are unavailable, but local path/config errors should be resolved.

- [ ] **Step 3: Commit**

Commit message: `chore(workflow): integrate init loop`
