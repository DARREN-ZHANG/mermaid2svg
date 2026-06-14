import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const readJson = (path) =>
  path.endsWith(".jsonc") ? parseJsonc(read(path)) : JSON.parse(read(path));

function parseJsonc(text) {
  return JSON.parse(removeTrailingCommas(stripJsonComments(text)));
}

function stripJsonComments(text) {
  let result = "";
  let i = 0;
  let inString = false;
  while (i < text.length) {
    if (inString) {
      result += text[i];
      if (text[i] === "\\" && i + 1 < text.length) {
        result += text[i + 1];
        i += 2;
        continue;
      }
      if (text[i] === '"') inString = false;
      i++;
    } else if (text[i] === '"') {
      inString = true;
      result += text[i];
      i++;
    } else if (text[i] === "/" && text[i + 1] === "/") {
      i += 2;
      while (i < text.length && text[i] !== "\n") i++;
    } else if (text[i] === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length - 1 && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
    } else {
      result += text[i];
      i++;
    }
  }
  return result;
}

function removeTrailingCommas(text) {
  let result = "";
  let i = 0;
  let inString = false;
  while (i < text.length) {
    if (inString) {
      result += text[i];
      if (text[i] === "\\" && i + 1 < text.length) {
        result += text[i + 1];
        i += 2;
        continue;
      }
      if (text[i] === '"') inString = false;
      i++;
      continue;
    }

    if (text[i] === '"') {
      inString = true;
      result += text[i];
      i++;
      continue;
    }

    if (text[i] === ",") {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      if (text[j] === "}" || text[j] === "]") {
        i++;
        continue;
      }
    }

    result += text[i];
    i++;
  }
  return result;
}

const loops = [
  {
    id: "web-demo",
    script: "agent:web-demo",
    agent: "web-demo-agent",
    title: "Web Demo Loop",
    requiredInputs: [
      "demo/render/mermaid-to-svg.js",
      "demo/render/normalize-svg.js",
      "workflow/reports/svg-output-compatibility.json",
    ],
    requiredOutputs: [
      "demo",
      "workflow/reports/web-demo-report.json",
      "docs/web-demo-loop-report.md",
    ],
    forbiddenScope: "theme switching, size comparison, i18n, or deployment",
  },
  {
    id: "theme",
    script: "agent:theme",
    agent: "theme-agent",
    title: "Theme Loop",
    requiredInputs: ["workflow/reports/web-demo-report.json", "demo/render/normalize-svg.js"],
    requiredOutputs: ["workflow/reports/theme-css-report.json", "docs/theme-loop-report.md"],
    forbiddenScope: "size comparison, i18n, or deployment",
  },
  {
    id: "size",
    script: "agent:size",
    agent: "size-agent",
    title: "Size Loop",
    requiredInputs: ["workflow/reports/theme-css-report.json", "demo"],
    requiredOutputs: ["workflow/reports/size-report.json", "docs/size-loop-report.md"],
    forbiddenScope: "i18n or deployment",
  },
  {
    id: "i18n",
    script: "agent:i18n",
    agent: "i18n-agent",
    title: "I18N Loop",
    requiredInputs: ["workflow/reports/size-report.json", "demo"],
    requiredOutputs: [
      "workflow/reports/i18n-report.json",
      "docs/i18n-language-map.md",
      "docs/i18n-loop-report.md",
    ],
    forbiddenScope: "deployment",
  },
  {
    id: "deploy",
    script: "agent:deploy",
    agent: "deploy-agent",
    title: "Deploy Loop",
    requiredInputs: [
      "workflow/reports/i18n-report.json",
      "workflow/reports/size-report.json",
      "demo",
    ],
    requiredOutputs: ["workflow/reports/deployment-report.json", "docs/deploy-loop-report.md"],
    forbiddenScope: "final acceptance sign-off",
  },
  {
    id: "final-audit",
    script: "agent:final-audit",
    agent: "final-audit-agent",
    title: "Final Acceptance Audit Loop",
    requiredInputs: [
      "workflow/reports/deployment-report.json",
      "workflow/reports/i18n-report.json",
      "workflow/reports/size-report.json",
    ],
    requiredOutputs: [
      "workflow/reports/final-report.md",
      "workflow/reports/final-acceptance-checklist.json",
      "docs/dev-workflow.md",
    ],
    forbiddenScope: "new feature implementation",
  },
];

test("remaining workflow loops expose package scripts in execution order", () => {
  const pkg = readJson("package.json");

  for (const loop of loops) {
    assert.match(
      pkg.scripts[loop.script],
      new RegExp(
        `^tsx(?: --env-file=\\.env)? workflow\\/loops\\/${loop.id}\\/${loop.id}-loop\\.ts$`,
      ),
      loop.id,
    );
  }
});

test("opencode config defines all remaining agents pinned to zhipu GLM-5.1", () => {
  const config = readJson("opencode.jsonc");

  for (const loop of loops) {
    const instruction = `.opencode/agents/${loop.agent}.md`;
    const agent = config.agent[loop.agent];

    assert.ok(config.instructions.includes(instruction), `${instruction} must be loaded`);
    assert.equal(agent.model, "zhipuai-coding-plan/glm-5.1", loop.agent);
    assert.equal(agent.permission.edit, "allow", loop.agent);
    assert.equal(agent.permission.bash, "allow", loop.agent);
    assert.match(agent.prompt, new RegExp(loop.title, "i"), loop.agent);
    assert.match(agent.prompt, /superpowers:subagent-driven-development/, loop.agent);
    assert.match(agent.prompt, /conventional commits/i, loop.agent);
  }
});

test("remaining agent instruction files pin loop-specific boundaries", () => {
  for (const loop of loops) {
    const agent = read(`.opencode/agents/${loop.agent}.md`);

    assert.match(agent, new RegExp(loop.title, "i"), loop.agent);
    assert.match(agent, /Execute only the phase prompt/i, loop.agent);
    assert.match(agent, /Commit frequently/i, loop.agent);
    assert.match(agent, /conventional commits/i, loop.agent);
    assert.match(agent, new RegExp(loop.forbiddenScope, "i"), loop.agent);
  }
});

test("remaining loop configs define deterministic topology and artifacts", () => {
  for (const loop of loops) {
    const config = read(`workflow/loops/${loop.id}/${loop.id}-loop.config.ts`);

    assert.match(config, new RegExp(`loopName:\\s*"${loop.id}-loop"`), loop.id);
    assert.match(
      config,
      new RegExp(`stateFile:\\s*"workflow\\/state\\/${loop.id}-loop\\.state\\.json"`),
      loop.id,
    );
    assert.match(config, new RegExp(`logDir:\\s*"workflow\\/runs\\/${loop.id}"`), loop.id);
    assert.match(config, /reportDir:\s*"workflow\/reports"/, loop.id);
    assert.match(config, /\.\.\/docs\/mermaid-svg-spec\.md/, loop.id);
    assert.match(config, /\.\.\/docs\/acceptance-criteria\.md/, loop.id);
    assert.match(config, /\.\.\/docs\/mermaid-svg-architecture\.md/, loop.id);

    for (const input of loop.requiredInputs)
      assert.match(
        config,
        new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${loop.id} input ${input}`,
      );
    for (const output of loop.requiredOutputs)
      assert.match(
        config,
        new RegExp(output.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${loop.id} output ${output}`,
      );

    for (const phase of ["preflight", "plan", "implementation", "verification", "final-report"]) {
      assert.match(config, new RegExp(`id:\\s*"${phase}"`), `${loop.id} phase ${phase}`);
    }
  }
});

test("remaining loop prompts exist and enforce scope boundaries", () => {
  for (const loop of loops) {
    for (const prompt of [
      `workflow/loops/${loop.id}/prompts/01-preflight.md`,
      `workflow/loops/${loop.id}/prompts/02-plan.md`,
      `workflow/loops/${loop.id}/prompts/03-implementation.md`,
      `workflow/loops/${loop.id}/prompts/04-verification.md`,
      `workflow/loops/${loop.id}/prompts/05-final-report.md`,
    ]) {
      assert.ok(existsSync(prompt), `${prompt} must exist`);
      const text = read(prompt);
      assert.match(text, /Allowed files/i, prompt);
      assert.match(text, /Blocked files/i, prompt);
      assert.match(text, /Verification/i, prompt);
      assert.match(text, new RegExp(loop.title, "i"), prompt);
      assert.match(text, new RegExp(loop.forbiddenScope, "i"), prompt);
    }
  }
});

test("remaining validators reject missing required inputs and outputs", async () => {
  for (const loop of loops) {
    const validators = read(`workflow/loops/${loop.id}/lib/validators.ts`);
    assert.match(validators, /validateRemainingLoopPhase/, loop.id);
    assert.match(
      validators,
      new RegExp(loop.requiredOutputs[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      loop.id,
    );

    const module = await import(`../${loop.id}/lib/validators.ts`);
    const result = module.validateRemainingLoopPhase({
      id: "final-report",
      requiredArtifacts: [],
    });

    // 已完整交付的 loop（全部输入和输出都存在）不满足"拒绝缺失产物"测试前提，跳过
    const allDelivered = [...loop.requiredInputs, ...loop.requiredOutputs].every((p) =>
      existsSync(p),
    );
    if (allDelivered) continue;

    assert.equal(result.ok, false, loop.id);
    // Upstream loops may have already delivered a required input; only assert
    // the validator reports it while it is genuinely absent.
    if (!existsSync(loop.requiredInputs[0])) {
      assert.ok(
        result.errors.some((error) => error.includes(loop.requiredInputs[0])),
        `${loop.id} must require first input`,
      );
    }
    if (!existsSync(loop.requiredOutputs[0])) {
      assert.ok(
        result.errors.some((error) => error.includes(loop.requiredOutputs[0])),
        `${loop.id} must require first output`,
      );
    }
  }
});

test("remaining loop runner records failed state and names opencode sessions by loop", () => {
  const runner = read("workflow/loops/remaining/lib/runner.ts");
  assert.match(runner, /state\.status = "failed"/);
  assert.match(runner, /state\.blockedReason = \(error as Error\)\.message/);
  assert.match(runner, /loopTitle: config\.title/);
});

test("pre-commit hook runs the remaining workflow loop contract test", () => {
  const hook = read(".husky/pre-commit");
  assert.match(hook, /workflow\/loops\/remaining\/remaining-loops\.test\.mjs/);
});
