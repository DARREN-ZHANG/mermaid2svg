import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("init loop package script points at workflow loop entry", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["agent:init"], "tsx workflow/loops/init/init-loop.ts");
});

test("init loop config uses workflow state, parent docs, and parent references", () => {
  const config = read("workflow/loops/init/init-loop.config.ts");
  assert.match(config, /stateFile:\s*"workflow\/state\/init-loop\.state\.json"/);
  assert.match(config, /logDir:\s*"workflow\/runs\/init"/);
  assert.match(config, /\.\.\/docs\/mermaid-svg-spec\.md/);
  assert.match(config, /\.\.\/docs\/acceptance-criteria\.md/);
  assert.match(config, /\.\.\/docs\/mermaid-svg-architecture\.md/);
  assert.match(config, /\.\.\/references\/maid/);
  assert.match(config, /\.\.\/references\/beautiful-mermaid/);
  assert.match(config, /\.\.\/references\/mermaid/);
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
