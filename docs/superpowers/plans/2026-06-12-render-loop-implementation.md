# Render Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `render-loop` orchestrator that drives OpenCode to build and validate the first Mermaid source to SVG rendering closure.

**Architecture:** Mirror the existing `workflow/loops/init` shape: a small deterministic TypeScript orchestrator, phase config, prompt files, state file, run logs, and contract tests. The loop does not hand-write the renderer itself; it schedules OpenCode phases and verifies machine-readable artifacts such as `src/render/*`, `test/render-yml.test.mjs`, `workflow/reports/render-capabilities.json`, and `docs/render-loop-report.md`.

**Tech Stack:** Node.js built-in test runner, TypeScript via `tsx`, OpenCode SDK through the existing runner pattern, JSON/YAML artifacts, Mermaid official browser API as the required implementation path for the executor phase.

---

### Task 1: Render Loop Contract Tests

**Files:**

- Create: `workflow/loops/render/render-loop.test.mjs`

- [ ] **Step 1: Write failing tests**

Create tests that assert:

- `package.json` has `agent:render` pointing to `tsx --env-file=.env workflow/loops/render/render-loop.ts` or the same command without `--env-file=.env`.
- `opencode.jsonc` includes `.opencode/agents/render-agent.md`, defines `render-agent`, pins it to `zhipuai-coding-plan/glm-5.1`, and makes it the default only if the project intentionally chooses that later.
- `workflow/loops/render/render-loop.config.ts` uses `workflow/state/render-loop.state.json`, `workflow/runs/render`, parent canonical docs, `test/*.yml`, `test/schema.yml`, `extract/report.json`, and required final artifacts.
- Prompt files exist for preflight, renderer plan, renderer implementation, test runner, validation, and final report.

- [ ] **Step 2: Verify red**

Run:

```bash
node --test workflow/loops/render/render-loop.test.mjs
```

Expected: fail because `workflow/loops/render` does not exist.

### Task 2: Render Loop Orchestrator Skeleton

**Files:**

- Create: `workflow/loops/render/render-loop.ts`
- Create: `workflow/loops/render/render-loop.config.ts`
- Create: `workflow/state/render-loop.state.json`
- Create: `workflow/loops/render/README.md`
- Modify: `package.json`
- Modify: `opencode.jsonc`
- Create: `.opencode/agents/render-agent.md`

- [ ] **Step 1: Implement minimal orchestrator**

Reuse the init loop support libraries from `workflow/loops/init/lib/*` by importing them with relative paths. The render loop must create `workflow/runs/render`, `workflow/reports`, and `docs/render` directories, then execute configured shell/OpenCode phases with state persistence.

- [ ] **Step 2: Add scripts and agent config**

Add:

```json
"agent:render": "tsx --env-file=.env workflow/loops/render/render-loop.ts"
```

Add `render-agent` with the same Zhipu model, allow edit/bash, frequent conventional commits, and required `superpowers:subagent-driven-development` instruction.

- [ ] **Step 3: Verify green**

Run:

```bash
node --test workflow/loops/render/render-loop.test.mjs
```

Expected: pass for structure/config assertions.

### Task 3: Deterministic Render Validators

**Files:**

- Create: `workflow/loops/render/lib/validators.ts`
- Modify: `workflow/loops/render/render-loop.ts`
- Modify: `workflow/loops/render/render-loop.test.mjs`

- [ ] **Step 1: Write failing validator tests**

Extend contract tests to assert validators reject:

- missing `test/schema.yml`
- no executable `test/*.yml`
- missing renderer entry such as `src/render/mermaid-to-svg.js`
- missing `test/render-yml.test.mjs`
- missing or invalid `workflow/reports/render-capabilities.json`
- render code containing blocked implementation paths such as `puppeteer`, `playwright`, `@mermaid-js/mermaid-cli`, `canvas`, or `screenshot`

- [ ] **Step 2: Implement validators**

Implement deterministic file and content checks only. Do not infer success from prose. Require the final report to exist only in the final-report phase.

- [ ] **Step 3: Verify green**

Run:

```bash
node --test workflow/loops/render/render-loop.test.mjs
```

Expected: pass.

### Task 4: Render Phase Prompts

**Files:**

- Create: `workflow/loops/render/prompts/01-preflight.md`
- Create: `workflow/loops/render/prompts/02-renderer-plan.md`
- Create: `workflow/loops/render/prompts/03-renderer-implementation.md`
- Create: `workflow/loops/render/prompts/04-render-test-runner.md`
- Create: `workflow/loops/render/prompts/05-validation.md`
- Create: `workflow/loops/render/prompts/06-final-report.md`

- [ ] **Step 1: Write phase prompts**

Each prompt must include exact allowed files, blocked files, output artifacts, verification commands, and explicit prohibitions against custom parser/layout, screenshot/canvas substitution, server rendering, and online services.

- [ ] **Step 2: Verify prompt coverage**

Run:

```bash
node --test workflow/loops/render/render-loop.test.mjs
```

Expected: pass with prompt coverage assertions.

### Task 5: Final Verification And Commit

**Files:**

- All files above

- [ ] **Step 1: Run full contract test suite**

Run:

```bash
node --test workflow/loops/init/init-loop.test.mjs workflow/hooks/pre-commit.test.mjs workflow/loops/render/render-loop.test.mjs
```

Expected: all tests pass.

- [ ] **Step 2: Run render loop preflight only by invoking tests**

Do not run OpenCode phases without `ZHIPU_API_KEY`. The contract test is the executable validation for loop code shape.

- [ ] **Step 3: Commit**

```bash
git add package.json opencode.jsonc .opencode/agents/render-agent.md workflow/loops/render workflow/state/render-loop.state.json docs/superpowers/plans/2026-06-12-render-loop-implementation.md
git commit -m "feat(workflow): add render loop orchestrator"
```
