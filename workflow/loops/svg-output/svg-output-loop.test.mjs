import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const readJson = (path) => JSON.parse(read(path));

test("svg output loop package script points at workflow loop entry", () => {
  const pkg = readJson("package.json");
  assert.match(pkg.scripts["agent:svg-output"], /^tsx(?: --env-file=\.env)? workflow\/loops\/svg-output\/svg-output-loop\.ts$/);
});

test("opencode config defines svg output agent pinned to zhipu GLM-5.1", () => {
  const config = readJson("opencode.jsonc");
  const agent = config.agent["svg-output-agent"];

  assert.ok(config.instructions.includes(".opencode/agents/svg-output-agent.md"));
  assert.equal(agent.model, "zhipuai-coding-plan/glm-5.1");
  assert.equal(agent.permission.edit, "allow");
  assert.equal(agent.permission.bash, "allow");
  assert.match(agent.prompt, /SVG Output Compatibility/i);
  assert.match(agent.prompt, /Playwright is allowed only as a real-browser test harness/i);
  assert.match(agent.prompt, /primary pass\/fail oracle/i);
  assert.match(agent.prompt, /Playwright-as-renderer/i);
  assert.match(agent.prompt, /superpowers:subagent-driven-development/);
  assert.match(agent.prompt, /conventional commits/i);
});

test("svg output agent instructions pin output compatibility boundaries", () => {
  const agent = read(".opencode/agents/svg-output-agent.md");

  assert.match(agent, /SVG Output Compatibility/i);
  assert.match(agent, /Normalize Mermaid renderer SVG output/i);
  assert.match(agent, /Do not implement a Mermaid parser/i);
  assert.match(agent, /Playwright is allowed only as a real-browser test harness/i);
  assert.match(agent, /primary pass\/fail oracle/i);
  assert.match(agent, /Playwright-as-renderer/i);
  assert.match(agent, /Do not work on demo UI/i);
  assert.match(agent, /Commit frequently/i);
  assert.match(agent, /conventional commits/i);
});

test("svg output loop config defines deterministic phase topology and artifacts", () => {
  const config = read("workflow/loops/svg-output/svg-output-loop.config.ts");

  assert.match(config, /loopName:\s*"svg-output-loop"/);
  assert.match(config, /stateFile:\s*"workflow\/state\/svg-output-loop\.state\.json"/);
  assert.match(config, /logDir:\s*"workflow\/runs\/svg-output"/);
  assert.match(config, /reportDir:\s*"workflow\/reports"/);
  assert.match(config, /docsDir:\s*"docs\/svg-output"/);
  assert.match(config, /\.\.\/docs\/mermaid-svg-spec\.md/);
  assert.match(config, /\.\.\/docs\/acceptance-criteria\.md/);
  assert.match(config, /\.\.\/docs\/mermaid-svg-architecture\.md/);
  assert.match(config, /src\/render\/mermaid-to-svg\.js/);
  assert.match(config, /test\/render-yml\.test\.mjs/);
  assert.match(config, /workflow\/reports\/render-capabilities\.json/);
  assert.match(config, /src\/render\/normalize-svg\.js/);
  assert.match(config, /test\/svg-output\.test\.mjs/);
  assert.match(config, /workflow\/reports\/svg-output-compatibility\.json/);

  for (const phase of [
    "preflight",
    "compatibility-plan",
    "normalizer-implementation",
    "compatibility-tests",
    "validation",
    "final-report"
  ]) {
    assert.match(config, new RegExp(`id:\\s*"${phase}"`));
  }
});

test("svg output loop names opencode sessions with the svg output loop title", () => {
  const entry = read("workflow/loops/svg-output/svg-output-loop.ts");
  assert.match(entry, /loopTitle: "SVG Output Loop"/);
});

test("svg output loop prompts exist and enforce output constraints", () => {
  const prompts = [
    "workflow/loops/svg-output/prompts/01-preflight.md",
    "workflow/loops/svg-output/prompts/02-compatibility-plan.md",
    "workflow/loops/svg-output/prompts/03-normalizer-implementation.md",
    "workflow/loops/svg-output/prompts/04-compatibility-tests.md",
    "workflow/loops/svg-output/prompts/05-validation.md",
    "workflow/loops/svg-output/prompts/06-final-report.md"
  ];

  for (const prompt of prompts) {
    assert.ok(existsSync(prompt), `${prompt} must exist`);
    const text = read(prompt);
    assert.match(text, /Allowed files/i, prompt);
    assert.match(text, /Blocked files/i, prompt);
    assert.match(text, /Verification/i, prompt);
    assert.match(text, /SVG Output Compatibility/i, prompt);
    assert.match(text, /Do not implement a Mermaid parser/i, prompt);
    assert.match(text, /Playwright may be used only as a real-browser test harness/i, prompt);
    assert.match(text, /primary pass\/fail oracle/i, prompt);
    assert.match(text, /Do not work on demo UI/i, prompt);
  }
});

test("svg output validators reject missing artifacts and blocked compatibility paths", async () => {
  const validators = read("workflow/loops/svg-output/lib/validators.ts");
  const config = read("workflow/loops/svg-output/svg-output-loop.config.ts");
  const validationSurface = `${validators}\n${config}`;

  assert.match(validators, /validateSvgOutputPhase/);
  assert.match(validators, /src\/render\/mermaid-to-svg\.js/);
  assert.match(validators, /src\/render\/normalize-svg\.js/);
  assert.match(validators, /test\/svg-output\.test\.mjs/);
  assert.match(validators, /workflow\/reports\/svg-output-compatibility\.json/);
  assert.match(validators, /viewBox/);
  assert.match(validators, /deterministic/);
  assert.match(validators, /runtime JS/);
  assert.match(validationSurface, /puppeteer/);
  assert.match(validationSurface, /playwright/);
  assert.match(validationSurface, /@mermaid-js\/mermaid-cli/);
  assert.match(validationSurface, /screenshot/);
  assert.match(validationSurface, /canvas/);

  const { validateSvgOutputPhase } = await import("./lib/validators.ts");
  const result = validateSvgOutputPhase({
    id: "validation",
    requiredArtifacts: []
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("src/render/mermaid-to-svg.js")));
  assert.ok(result.errors.some((error) => error.includes("src/render/normalize-svg.js")));
  assert.ok(result.errors.some((error) => error.includes("test/svg-output.test.mjs")));
  assert.ok(result.errors.some((error) => error.includes("workflow/reports/svg-output-compatibility.json")));
});
