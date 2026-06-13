import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("init loop package script points at workflow loop entry", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.scripts["agent:init"], /^tsx(?: --env-file=\.env)? workflow\/loops\/init\/init-loop\.ts$/);
});

test("init loop config uses workflow state, parent docs, and local references", () => {
  const config = read("workflow/loops/init/init-loop.config.ts");
  assert.match(config, /stateFile:\s*"workflow\/state\/init-loop\.state\.json"/);
  assert.match(config, /logDir:\s*"workflow\/runs\/init"/);
  assert.match(config, /\.\.\/docs\/mermaid-svg-spec\.md/);
  assert.match(config, /\.\.\/docs\/acceptance-criteria\.md/);
  assert.match(config, /\.\.\/docs\/mermaid-svg-architecture\.md/);
  assert.match(config, /dir:\s*"references\/maid"/);
  assert.match(config, /dir:\s*"references\/beautiful-mermaid"/);
  assert.match(config, /dir:\s*"references\/mermaid"/);
  assert.match(config, /"references\/\*\*"/);
  assert.doesNotMatch(config, /\.\.\/references/);
  assert.doesNotMatch(config, /test\/generated/);
  assert.match(config, /extract\/run\.js/);
  assert.match(config, /extract\/report\.json/);
  assert.match(config, /test\/schema\.yml/);
});

test("init loop entry preflight verifies references instead of cloning them", () => {
  const entry = read("workflow/loops/init/init-loop.ts");
  assert.match(entry, /Missing local reference repo/);
  assert.doesNotMatch(entry, /git clone/);
  assert.doesNotMatch(entry, /git checkout -b/);
});

test("opencode runner preserves diagnostics when a phase fails before completion", () => {
  const runner = read("workflow/loops/init/lib/opencode-runner.ts");
  assert.match(runner, /\$\{input\.phaseId\}\.session\.json/);
  assert.match(runner, /sessionId/);
  assert.match(runner, /\$\{input\.phaseId\}\.failure\.json/);
  assert.match(runner, /opencode\.client\.session\.messages/);
  assert.match(runner, /\$\{input\.phaseId\}\.messages\.json/);
});

test("opencode runner fails promptly when a running session disappears from status", () => {
  const runner = read("workflow/loops/init/lib/opencode-runner.ts");
  assert.match(runner, /missingStatusPolls/);
  assert.match(runner, /disappeared from status/);
});

test("opencode runner treats a disappeared finished session as completed", () => {
  const runner = read("workflow/loops/init/lib/opencode-runner.ts");
  assert.match(runner, /sessionFinishedWithStop/);
  assert.match(runner, /messagesFinishedWithStop/);
  assert.match(runner, /message\.info\.finish === "stop"/);
  assert.match(runner, /lastStatus = "idle"/);
});

test("init loop clears stale failure fields when an attempt starts", () => {
  const state = read("workflow/loops/init/lib/state.ts");
  assert.match(state, /export function incrementAttempt[\s\S]*blockedReason:\s*null/);
  assert.match(state, /export function incrementAttempt[\s\S]*finishedAt:\s*null/);
});

test("opencode runner snapshots child sessions while a phase is running", () => {
  const runner = read("workflow/loops/init/lib/opencode-runner.ts");
  assert.match(runner, /\$\{input\.phaseId\}\.status\.json/);
  assert.match(runner, /session\.children/);
  assert.match(runner, /\$\{input\.phaseId\}\.child\.\$\{child\.id\}\.messages\.json/);
  assert.match(runner, /toDiagnosticMessages/);
  assert.match(runner, /omitted from diagnostics/);
});

test("reference directories are ignored by git and opencode watcher", () => {
  assert.match(read(".gitignore"), /^references\/$/m);
  assert.match(read("opencode.jsonc"), /references\/\*\*\/\.git\/\*\*/);
});

test("reference mining prompt keeps the explore subagent strategy", () => {
  const prompt = read("workflow/loops/init/prompts/04-reference-mining.md");
  assert.match(prompt, /subagent-based/i);
  assert.match(prompt, /MUST delegate exploration to subagents/);
  assert.match(prompt, /Type:\s*`explore`/);
});

test("opencode config pins zhipu coding plan GLM-5.1", () => {
  const config = JSON.parse(read("opencode.jsonc"));
  assert.equal(config.model, "zhipuai-coding-plan/glm-5.1");
  assert.equal(config.small_model, "zhipuai-coding-plan/glm-5.1");
  assert.equal(config.provider["zhipuai-coding-plan"].npm, "@ai-sdk/openai-compatible");
  assert.equal(config.provider["zhipuai-coding-plan"].options.baseURL, "https://open.bigmodel.cn/api/coding/paas/v4");
  assert.equal(config.provider["zhipuai-coding-plan"].options.apiKey, "{env:ZHIPU_API_KEY}");
  assert.equal(config.provider["zhipuai-coding-plan"].models["glm-5.1"].name, "GLM-5.1");
  assert.equal(config.agent["init-agent"].model, "zhipuai-coding-plan/glm-5.1");
});

test("init agent requires subagent-driven development for concrete tasks", () => {
  const config = JSON.parse(read("opencode.jsonc")),
    agent = read(".opencode/agents/init-agent.md"),
    prompt = config.agent["init-agent"].prompt;

  for (const text of [agent, prompt]) {
    assert.match(text, /superpowers:subagent-driven-development/);
    assert.match(text, /fresh subagent per task/i);
    assert.match(text, /spec compliance/i);
    assert.match(text, /code quality/i);
  }
});

test("init agent requires frequent conventional commits", () => {
  const config = JSON.parse(read("opencode.jsonc")),
    agent = read(".opencode/agents/init-agent.md"),
    prompt = config.agent["init-agent"].prompt;

  for (const text of [agent, prompt]) {
    assert.match(text, /conventional commits/i);
    assert.match(text, /commit frequently/i);
    assert.match(text, /small group of work/i);
  }
});
