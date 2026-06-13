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

test("svg output loop package script points at workflow loop entry", () => {
  const pkg = readJson("package.json");
  assert.match(
    pkg.scripts["agent:svg-output"],
    /^tsx(?: --env-file=\.env)? workflow\/loops\/svg-output\/svg-output-loop\.ts$/,
  );
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
    "final-report",
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
    "workflow/loops/svg-output/prompts/06-final-report.md",
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
  // Phase 04 delivered compatibility tests and report;
  // the validator must accept all valid artifacts.
  const result = validateSvgOutputPhase({
    id: "validation",
    requiredArtifacts: [],
  });

  assert.equal(result.ok, true);
  // Render Loop delivered a valid renderer; the validator must accept it (no error).
  assert.ok(
    !result.errors.some((error) => error.includes("src/render/mermaid-to-svg.js")),
    "valid renderer should pass svg-output renderer validation",
  );
  // SVG Output Loop delivered a valid normalizer; the validator must accept it (no error).
  assert.ok(
    !result.errors.some((error) => error.includes("src/render/normalize-svg.js")),
    "valid normalizer should pass svg-output normalizer validation",
  );
  assert.ok(
    !result.errors.some((error) => error.includes("test/svg-output.test.mjs")),
    "valid compatibility tests should pass validation",
  );
  assert.ok(
    !result.errors.some((error) => error.includes("workflow/reports/svg-output-compatibility.json")),
    "valid compatibility report should pass validation",
  );

  // validator 仍须能捕获缺失的必要产物
  const missing = validateSvgOutputPhase({
    id: "validation",
    requiredArtifacts: ["nonexistent-artifact-" + Date.now() + ".js"],
  });
  assert.equal(missing.ok, false);
});
