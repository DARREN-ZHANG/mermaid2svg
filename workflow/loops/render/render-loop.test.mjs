import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const readJson = (path) => JSON.parse(read(path));

test("render loop package script points at workflow loop entry", () => {
  const pkg = readJson("package.json");
  assert.match(pkg.scripts["agent:render"], /^tsx(?: --env-file=\.env)? workflow\/loops\/render\/render-loop\.ts$/);
});

test("opencode config defines render agent pinned to zhipu GLM-5.1", () => {
  const config = readJson("opencode.jsonc");
  const agent = config.agent["render-agent"];

  assert.ok(config.instructions.includes(".opencode/agents/render-agent.md"));
  assert.equal(agent.model, "zhipuai-coding-plan/glm-5.1");
  assert.equal(agent.permission.edit, "allow");
  assert.equal(agent.permission.bash, "allow");
  assert.match(agent.prompt, /Mermaid source to SVG/i);
  assert.match(agent.prompt, /Playwright is allowed only as a real-browser test harness/i);
  assert.match(agent.prompt, /primary pass\/fail oracle/i);
  assert.match(agent.prompt, /Playwright-as-renderer/i);
  assert.match(agent.prompt, /superpowers:subagent-driven-development/);
  assert.match(agent.prompt, /conventional commits/i);
});

test("render agent instructions pin execution boundaries", () => {
  const agent = read(".opencode/agents/render-agent.md");

  assert.match(agent, /Mermaid source to SVG/i);
  assert.match(agent, /official Mermaid browser/i);
  assert.match(agent, /Do not implement a Mermaid parser/i);
  assert.match(agent, /Playwright is allowed only as a real-browser test harness/i);
  assert.match(agent, /primary pass\/fail oracle/i);
  assert.match(agent, /Playwright-as-renderer/i);
  assert.match(agent, /Commit frequently/i);
  assert.match(agent, /conventional commits/i);
});

test("render loop config defines deterministic phase topology and artifacts", () => {
  const config = read("workflow/loops/render/render-loop.config.ts");

  assert.match(config, /loopName:\s*"render-loop"/);
  assert.match(config, /stateFile:\s*"workflow\/state\/render-loop\.state\.json"/);
  assert.match(config, /logDir:\s*"workflow\/runs\/render"/);
  assert.match(config, /reportDir:\s*"workflow\/reports"/);
  assert.match(config, /\.\.\/docs\/mermaid-svg-spec\.md/);
  assert.match(config, /\.\.\/docs\/acceptance-criteria\.md/);
  assert.match(config, /\.\.\/docs\/mermaid-svg-architecture\.md/);
  assert.match(config, /test\/schema\.yml/);
  assert.match(config, /test\/\*\.yml/);
  assert.match(config, /extract\/report\.json/);
  assert.match(config, /src\/render\/mermaid-to-svg\.js/);
  assert.match(config, /test\/render-yml\.test\.mjs/);
  assert.match(config, /workflow\/reports\/render-capabilities\.json/);

  for (const phase of [
    "preflight",
    "renderer-plan",
    "renderer-implementation",
    "render-test-runner",
    "validation",
    "final-report"
  ]) {
    assert.match(config, new RegExp(`id:\\s*"${phase}"`));
  }
});

test("render loop names opencode sessions with the render loop title", () => {
  const entry = read("workflow/loops/render/render-loop.ts");
  assert.match(entry, /loopTitle: "Render Loop"/);
});

test("render loop prompts exist and enforce renderer constraints", () => {
  const prompts = [
    "workflow/loops/render/prompts/01-preflight.md",
    "workflow/loops/render/prompts/02-renderer-plan.md",
    "workflow/loops/render/prompts/03-renderer-implementation.md",
    "workflow/loops/render/prompts/04-render-test-runner.md",
    "workflow/loops/render/prompts/05-validation.md",
    "workflow/loops/render/prompts/06-final-report.md"
  ];

  for (const prompt of prompts) {
    assert.ok(existsSync(prompt), `${prompt} must exist`);
    const text = read(prompt);
    assert.match(text, /Allowed files/i, prompt);
    assert.match(text, /Blocked files/i, prompt);
    assert.match(text, /Verification/i, prompt);
    assert.match(text, /official Mermaid browser/i, prompt);
    assert.match(text, /Do not implement a Mermaid parser/i, prompt);
    assert.match(text, /Playwright may be used only as a real-browser test harness/i, prompt);
    assert.match(text, /primary pass\/fail oracle/i, prompt);
  }
});

test("render validators reject missing artifacts and blocked render paths", async () => {
  const validators = read("workflow/loops/render/lib/validators.ts");
  const config = read("workflow/loops/render/render-loop.config.ts");
  const validationSurface = `${validators}\n${config}`;

  assert.match(validators, /validateRenderPhase/);
  assert.match(validators, /test\/schema\.yml/);
  assert.match(validators, /test\/render-yml\.test\.mjs/);
  assert.match(validators, /src\/render\/mermaid-to-svg\.js/);
  assert.match(validators, /workflow\/reports\/render-capabilities\.json/);
  assert.match(validationSurface, /puppeteer/);
  assert.match(validationSurface, /playwright/);
  assert.match(validationSurface, /@mermaid-js\/mermaid-cli/);
  assert.match(validationSurface, /screenshot/);
  assert.match(validationSurface, /canvas/);

  const { validateRenderPhase } = await import("./lib/validators.ts");
  const result = validateRenderPhase({
    id: "validation",
    requiredArtifacts: []
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("src/render/mermaid-to-svg.js")));
  assert.ok(result.errors.some((error) => error.includes("test/render-yml.test.mjs")));
  assert.ok(result.errors.some((error) => error.includes("workflow/reports/render-capabilities.json")));
});
